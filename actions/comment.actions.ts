"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createCommentSchema } from "@/lib/validations/comment.schema";
import { requireProjectMember, requireUser } from "@/lib/auth-guards";
import { findTaskById } from "@/repositories/task.repository";
import { findTaskListById } from "@/repositories/list.repository";
import {
  createComment,
  softDeleteComment,
  updateComment,
  findCommentById,
  findCommentsWithAuthors,
  findDistinctCommentAuthorIds,
} from "@/repositories/comment.repository";
import {
  createNotification,
  upsertUnreadTaskCommentNotification,
} from "@/repositories/notification.repository";
import {
  findProjectAdminUserIds,
  findProjectMemberUsers,
} from "@/repositories/project.repository";
import { canComment } from "@/lib/permissions";
import { extractMentions } from "@/lib/mentions";
import { logActivity } from "@/lib/activity";

// CREATE — delegate ke pipeline tunggal createTaskComment.
export async function createCommentAction(formData: FormData) {
  const result = await createTaskComment({
    taskId: String(formData.get("taskId") ?? ""),
    content: String(formData.get("content") ?? ""),
  });
  if ("error" in result) return { error: result.error };
  return { success: true };
}

export type TaskCommentResult =
  | { success: true; commentId: string; projectId: string }
  | { error: string | Record<string, string[]> };

// LIST — daftar komentar task (beserta penulisnya) untuk UI detail task.
// Tanpa guard project? Tetap guard: hanya anggota project pemilik task.
export async function listTaskCommentsAction(taskId: string) {
  const guard = await requireUser();
  if ("error" in guard) return { error: guard.error ?? "Unauthorized" };

  const parsed = z.string().cuid().safeParse(taskId);
  if (!parsed.success) return { error: "Task tidak valid" };

  const task = await findTaskById(parsed.data);
  if (!task) return { error: "Task tidak ditemukan" };
  const list = await findTaskListById(task.listId);
  if (!list) return { error: "List tidak ditemukan" };
  const membership = await requireProjectMember(list.projectId);
  if ("error" in membership) {
    return { error: membership.error ?? "Kamu bukan member project ini" };
  }

  const rows = await findCommentsWithAuthors(parsed.data);
  return {
    success: true as const,
    items: rows.map((row) => ({
      id: row.id,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      author: {
        id: row.user.id,
        name: row.user.name,
        avatarUrl: row.user.avatarUrl,
      },
    })),
  };
}

/**
 * PIPELINE TUNGGAL pembuatan komentar. Semua jalur — form task maupun balasan
 * Inbox — wajib lewat sini agar tidak ada yang melewatkan logging aktivitas
 * maupun notifikasi. Kegagalan logging/notifikasi TIDAK PERNAH menggagalkan
 * komentar tersimpan.
 */
export async function createTaskComment(input: {
  taskId: string;
  content: string;
}): Promise<TaskCommentResult> {
  const guard = await requireUser();
  if ("error" in guard) return { error: guard.error ?? "Unauthorized" };
  const authorId = guard.user.id;

  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const task = await findTaskById(parsed.data.taskId);
  if (!task) return { error: "Task tidak ditemukan" };

  const list = await findTaskListById(task.listId);
  if (!list) return { error: "List tidak ditemukan" };
  const projectId = list.projectId;

  const membership = await requireProjectMember(projectId);
  if ("error" in membership) {
    return { error: membership.error ?? "Kamu bukan member project ini" };
  }

  // MATRIKS IZIN 8.2 — VIEWER hanya bisa membaca; server menolak walau
  // action dipanggil langsung dari luar UI.
  if (!canComment(membership.membership.role)) {
    return { error: "Kamu hanya bisa melihat project ini" };
  }

  const comment = await createComment({
    content: parsed.data.content,
    taskId: parsed.data.taskId,
    userId: authorId,
  });

  // 1) ACTIVITAS — COMMENT_ADDED dengan projectId asli task (bukan guess).
  //    logActivity sudah menelan kegagalannya sendiri.
  await logActivity({
    userId: authorId,
    projectId,
    taskId: task.id,
    action: "COMMENT_ADDED",
    meta: { title: task.title },
  });

  // 2) NOTIFIKASI — mention (MENTION) + peserta task (TASK_COMMENT).
  //    Kegagalan notifikasi tidak menggagalkan komentar tersimpan.
  try {
    const memberUsers = await findProjectMemberUsers(projectId);

    // Mention: penerima = yang disebut, bukan penulis.
    const mentioned = extractMentions(parsed.data.content, memberUsers).filter(
      (m) => m.id !== authorId
    );
    const mentionedIds = new Set(mentioned.map((m) => m.id));
    await Promise.all(
      mentioned.map((m) =>
        createNotification({
          type: "MENTION",
          userId: m.id,
          actorId: authorId,
          projectId,
          taskId: task.id,
          commentId: comment.id,
        }).catch((error) =>
          console.error("[comment] gagal notifikasi MENTION:", error)
        )
      )
    );

    // Peserta task = pembuat task (Task.createdById) + assignee + pemberi
    // komentar sebelumnya. FALLBACK hanya bila task tidak punya createdById
    // (data lama): semua anggota ADMIN / MANAGER project. Kandidat didedupe
    // lewat Set, penulis & yang sudah kena mention dikurangi, lalu disaring ke
    // yang masih anggota project (memberUsers — user yang keluar gugur).
    const candidateIds = new Set<string>();
    if (task.createdById) {
      candidateIds.add(task.createdById);
    } else {
      for (const userId of await findProjectAdminUserIds(projectId)) {
        candidateIds.add(userId);
      }
    }
    if (task.assigneeId) candidateIds.add(task.assigneeId);
    for (const userId of await findDistinctCommentAuthorIds(task.id)) {
      candidateIds.add(userId);
    }
    candidateIds.delete(authorId);
    for (const id of mentionedIds) candidateIds.delete(id);

    const memberIds = new Set(memberUsers.map((user) => user.id));
    const participantIds = [...candidateIds].filter((id) => memberIds.has(id));

    await Promise.all(
      participantIds.map((userId) =>
        upsertUnreadTaskCommentNotification({
          userId,
          actorId: authorId,
          projectId,
          taskId: task.id,
          commentId: comment.id,
        }).catch((error) =>
          console.error("[comment] gagal notifikasi TASK_COMMENT:", error)
        )
      )
    );
  } catch (error) {
    console.error("[comment] gagal membuat notifikasi:", error);
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/inbox");
  revalidatePath("/aktivitas");
  return { success: true, commentId: comment.id, projectId };
}

// UPDATE COMMENT
export async function updateCommentAction(commentId: string, formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const comment = await findCommentById(commentId);
  if (!comment) return { error: "Komentar tidak ditemukan" };

  if (comment.userId !== session.user.id) {
    return { error: "Kamu hanya bisa mengubah komentar sendiri" };
  }

  // MATRIKS IZIN 8.2 — VIEWER tidak boleh mengedit komentar.
  const list = await findTaskListById(
    (await findTaskById(comment.taskId))?.listId ?? ""
  );
  if (!list) return { error: "Task tidak ditemukan" };
  const membership = await requireProjectMember(list.projectId);
  if ("error" in membership) {
    return { error: membership.error ?? "Kamu bukan member project ini" };
  }
  if (!canComment(membership.membership.role)) {
    return { error: "Kamu hanya bisa melihat project ini" };
  }

  const parsed = createCommentSchema.pick({ content: true }).safeParse({
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await updateComment(commentId, { content: parsed.data.content });
  return { success: true };
}

// DELETE (cuma pembuat komentar yang boleh hapus)
export async function deleteCommentAction(commentId: string) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const comment = await findCommentById(commentId);
  if (!comment) return { error: "Komentar tidak ditemukan" };

  if (comment.userId !== session.user.id) {
    return { error: "Kamu hanya bisa menghapus komentar sendiri" };
  }

  // MATRIKS IZIN 8.2 — VIEWER tidak boleh menghapus komentar.
  const task = await findTaskById(comment.taskId);
  const list = task ? await findTaskListById(task.listId) : null;
  if (!list) return { error: "Task tidak ditemukan" };
  const membership = await requireProjectMember(list.projectId);
  if ("error" in membership) {
    return { error: membership.error ?? "Kamu bukan member project ini" };
  }
  if (!canComment(membership.membership.role)) {
    return { error: "Kamu hanya bisa melihat project ini" };
  }

  await softDeleteComment(commentId);
  return { success: true };
}