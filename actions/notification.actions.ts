"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { notificationTabSchema } from "@/lib/validations/notification.schema";
import {
  findNotificationsByUserId,
  findNotificationById,
  findNotificationOwnerId,
  countNotificationsByTab,
  countUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  findUnreadTaskCommentNotificationIds,
  type NotificationTab,
} from "@/repositories/notification.repository";
import { createCommentSchema } from "@/lib/validations/comment.schema";
import { createTaskComment } from "@/actions/comment.actions";
import { requireUser } from "@/lib/auth-guards";
import { z } from "zod";
import type { InboxNotification } from "@/types";

function toInboxNotification(row: {
  id: string;
  type: string;
  readAt: Date | null;
  createdAt: Date;
  actor: { id: string; name: string; avatarUrl: string | null } | null;
  task: {
    id: string;
    title: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    dueDate: Date | null;
    status: "TODO" | "IN_PROGRESS" | "DONE";
    assignee: { id: string; name: string; avatarUrl: string | null } | null;
    list: { projectId: string };
  } | null;
  project: { id: string; name: string } | null;
  comment: {
    id: string;
    content: string;
    createdAt: Date;
    user: { id: string; name: string; avatarUrl: string | null } | null;
  } | null;
}): InboxNotification {
  return {
    id: row.id,
    type: row.type as InboxNotification["type"],
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    actor: row.actor,
    task: row.task
      ? {
          id: row.task.id,
          title: row.task.title,
          priority: row.task.priority,
          dueDate: row.task.dueDate?.toISOString() ?? null,
          status: row.task.status,
          assignee: row.task.assignee,
          projectId: row.task.list.projectId,
        }
      : null,
    project: row.project,
    comment: row.comment
      ? {
          id: row.comment.id,
          content: row.comment.content,
          createdAt: row.comment.createdAt.toISOString(),
          author: row.comment.user,
        }
      : null,
  };
}

// DAFTAR — cursor pagination 20 per halaman, urut createdAt desc.
export async function listNotificationsAction(tab: string, cursor?: string | null) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsedTab = notificationTabSchema.safeParse(tab);
  if (!parsedTab.success) return { error: "Tab tidak valid" };

  const rows = await findNotificationsByUserId({
    userId: session.user.id,
    tab: parsedTab.data as NotificationTab,
    cursor: cursor ?? null,
    take: 20,
  });

  const hasMore = rows.length > 20;
  const page = hasMore ? rows.slice(0, 20) : rows;

  return {
    success: true as const,
    items: page.map(toInboxNotification),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

export async function getNotificationCountsAction() {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };
  const counts = await countNotificationsByTab(session.user.id);
  return { success: true as const, counts };
}

// Dipakai sidebar NANTI (jangan edit sidebar sekarang).
export async function getUnreadCount() {
  const session = await auth();
  if (!session) return 0;
  return countUnreadNotifications(session.user.id);
}

// TANDAI SATU DIBACA — user hanya boleh akses notifikasi miliknya.
export async function markNotificationReadAction(notificationId: string) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const owner = await findNotificationOwnerId(notificationId);
  if (!owner) return { error: "Notifikasi tidak ditemukan" };
  if (owner.userId !== session.user.id) {
    return { error: "Kamu tidak punya akses ke notifikasi ini" };
  }

  await markNotificationRead(notificationId);
  revalidatePath("/inbox");
  return { success: true as const };
}

// AUTO-READ TASK_COMMENT — dipanggil saat user membuka detail task: semua
// notifikasi TASK_COMMENT miliknya untuk task itu ditandai dibaca.
export async function markTaskCommentsReadAction(taskId: string) {
  const guard = await requireUser();
  if ("error" in guard) return { error: guard.error ?? "Unauthorized" };

  const parsed = z.string().cuid().safeParse(taskId);
  if (!parsed.success) return { error: "Task tidak valid" };

  const ids = await findUnreadTaskCommentNotificationIds(
    guard.user.id,
    parsed.data
  );
  if (ids.length === 0) return { success: true as const };

  // Memakai mark-read repository yang sama (per ID) seperti aksi manual.
  await Promise.all(ids.map((id) => markNotificationRead(id)));
  revalidatePath("/inbox");
  return { success: true as const };
}

export async function markAllNotificationsReadAction() {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  await markAllNotificationsRead(session.user.id);
  revalidatePath("/inbox");
  return { success: true as const };
}

// BALAS DARI PANEL DETAIL — delegate ke pipeline tunggal createTaskComment
// (mention, aktivitas, dan notifikasi peserta task ikut diproses; penerima
// notifikasi termasuk pembuat komentar sebelumnya — pemicu notifikasi asli).
export async function replyNotificationAction(
  notificationId: string,
  formData: FormData
) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const existing = await findNotificationById(notificationId);
  if (!existing || !existing.task) {
    return { error: "Task notifikasi tidak ditemukan" };
  }

  const owner = await findNotificationOwnerId(notificationId);
  if (!owner || owner.userId !== session.user.id) {
    return { error: "Kamu tidak punya akses ke notifikasi ini" };
  }

  const parsed = createCommentSchema
    .pick({ content: true })
    .safeParse({ content: formData.get("content") });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const result = await createTaskComment({
    taskId: existing.task.id,
    content: parsed.data.content,
  });
  if ("error" in result) return { error: result.error };

  revalidatePath("/inbox");
  return { success: true as const };
}
