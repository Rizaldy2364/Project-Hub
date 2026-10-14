import { prisma } from "@/lib/prisma";

export interface CreateCommentInput {
  content: string;
  taskId: string;
  userId: string;
}

export interface UpdateCommentInput {
  content: string;
}

// CREATE
export async function createComment(data: CreateCommentInput) {
  return prisma.comment.create({
    data,
  });
}

// READ
export async function findCommentById(id: string) {
  return prisma.comment.findUnique({
    where: { id, deletedAt: null },
  });
}

export async function findCommentsByTaskId(taskId: string) {
  return prisma.comment.findMany({
    where: { taskId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
}

// UPDATE
export async function updateComment(id: string, data: UpdateCommentInput) {
  return prisma.comment.update({
    where: { id },
    data,
  });
}

// Peserta diskusi task — ID user unik pembuat komentar aktif (buat penerima
// notifikasi TASK_COMMENT: penugasan + pemberi komentar sebelumnya).
export async function findDistinctCommentAuthorIds(taskId: string) {
  const rows = await prisma.comment.groupBy({
    by: ["userId"],
    where: { taskId, deletedAt: null },
  });
  return rows.map((row) => row.userId);
}

// SOFT DELETE
export async function softDeleteComment(id: string) {
  return prisma.comment.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}