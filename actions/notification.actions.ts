"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { notificationTabSchema } from "@/lib/validations/notification.schema";
import {
  findNotificationsByUserId,
  findNotificationById,
  countNotificationsByTab,
  countUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationTab,
} from "@/repositories/notification.repository";
import { prisma } from "@/lib/prisma";
import { createCommentSchema } from "@/lib/validations/comment.schema";
import { createComment } from "@/repositories/comment.repository";
import { createNotification } from "@/repositories/notification.repository";
import { findTaskById } from "@/repositories/task.repository";
import { findTaskListById } from "@/repositories/list.repository";
import { findProjectMember } from "@/repositories/project.repository";
import { extractMentions } from "@/lib/mentions";
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
  comment: { id: string; content: string } | null;
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
    comment: row.comment,
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

  const owner = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true },
  });
  if (!owner) return { error: "Notifikasi tidak ditemukan" };
  if (owner.userId !== session.user.id) {
    return { error: "Kamu tidak punya akses ke notifikasi ini" };
  }

  await markNotificationRead(notificationId);
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

// BALAS DARI PANEL DETAIL — lewat logika create-comment yang sudah ada
// (mention di balasan ikut diproses).
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

  const owner = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true },
  });
  if (!owner || owner.userId !== session.user.id) {
    return { error: "Kamu tidak punya akses ke notifikasi ini" };
  }

  const parsed = createCommentSchema.safeParse({
    content: formData.get("content"),
    taskId: existing.task.id,
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const task = await findTaskById(parsed.data.taskId);
  if (!task) return { error: "Task tidak ditemukan" };
  const list = await findTaskListById(task.listId);
  if (!list) return { error: "List tidak ditemukan" };
  const member = await findProjectMember(session.user.id, list.projectId);
  if (!member) return { error: "Kamu bukan member project ini" };

  const comment = await createComment({
    content: parsed.data.content,
    taskId: parsed.data.taskId,
    userId: session.user.id,
  });

  const projectMembers = await prisma.projectMember.findMany({
    where: { projectId: list.projectId },
    select: { user: { select: { id: true, name: true } } },
  });
  const mentioned = extractMentions(
    parsed.data.content,
    projectMembers.map((m) => m.user)
  ).filter((m) => m.id !== session.user.id);
  if (mentioned.length > 0) {
    await Promise.all(
      mentioned.map((m) =>
        createNotification({
          type: "MENTION",
          userId: m.id,
          actorId: session.user.id,
          projectId: list.projectId,
          taskId: parsed.data.taskId,
          commentId: comment.id,
        })
      )
    );
  }

  revalidatePath("/inbox");
  revalidatePath(`/projects/${list.projectId}`);
  return { success: true as const };
}
