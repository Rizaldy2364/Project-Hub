"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createCommentSchema } from "@/lib/validations/comment.schema";
import { findProjectMember } from "@/repositories/project.repository";
import { findTaskById } from "@/repositories/task.repository";
import { findTaskListById } from "@/repositories/list.repository";
import {
  createComment,
  softDeleteComment,
  updateComment,
  findCommentById,
} from "@/repositories/comment.repository";
import { createNotification } from "@/repositories/notification.repository";
import { extractMentions } from "@/lib/mentions";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";

// CREATE
export async function createCommentAction(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsed = createCommentSchema.safeParse({
    content: formData.get("content"),
    taskId: formData.get("taskId"),
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

  // MENTION — cocokkan @NamaMember ke member project (tak peka huruf,
  // nama terpanjang dulu). Penerima = yang disebut, bukan penulis.
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

  // ACTIVITAS — COMMENT_ADDED (kegagalan logging tidak menggagalkan aksi).
  await logActivity({
    userId: session.user.id,
    projectId: list.projectId,
    taskId: parsed.data.taskId,
    action: "COMMENT_ADDED",
    meta: { title: task.title },
  });

  revalidatePath(`/projects/${list.projectId}`);
  return { success: true };
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

  await softDeleteComment(commentId);
  return { success: true };
}