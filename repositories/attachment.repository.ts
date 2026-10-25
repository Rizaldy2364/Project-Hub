import { prisma } from "@/lib/prisma";
import { attachmentSelect, type AttachmentRow } from "@/lib/selects/attachment.select";

export interface CreateAttachmentInput {
  projectId: string;
  messageId: string | null;
  uploadedById: string;
  name: string;
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

// CREATE — murni insert tanpa validasi/otorisasi (dicek di actions/middleware).
export async function createAttachment(data: CreateAttachmentInput) {
  return prisma.attachment.create({
    data: {
      projectId: data.projectId,
      messageId: data.messageId ?? null,
      uploadedById: data.uploadedById,
      name: data.name,
      url: data.url,
      key: data.key,
      size: data.size,
      mimeType: data.mimeType,
    },
    select: attachmentSelect,
  });
}

// READ — lampiran milik satu pesan (kecuali soft-delete), urut createdAt asc.
export async function findAttachmentsByMessage(messageId: string) {
  return prisma.attachment.findMany({
    where: { messageId, deletedAt: null },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: attachmentSelect,
  });
}

// READ — lampiran yang masih pending (messageId NULL, belum dihapus, milik user,
// dalam project, dibuat dalam jangka waktu `withinHours` terakhir).
export async function findPendingAttachmentById({
  id,
  userId,
  projectId,
  withinHours,
}: {
  id: string;
  userId: string;
  projectId: string;
  withinHours: number;
}) {
  const cutoff = new Date(Date.now() - withinHours * 60 * 60 * 1000);
  return prisma.attachment.findFirst({
    where: {
      id,
      uploadedById: userId,
      projectId,
      messageId: null,
      deletedAt: null,
      createdAt: { gte: cutoff },
    },
    select: attachmentSelect,
  });
}

// READ — semua lampiran pesan (termasuk yang sudah di-soft-delete), untuk tugas
// hapus file di UploadThing saat pesan dihapus.
export async function findAttachmentKeysByMessage(messageId: string) {
  return prisma.attachment.findMany({
    where: { messageId },
    select: { id: true, key: true, name: true },
  });
}

// UPDATE — soft-delete lampiran pesan (deletedAt = now).
export async function softDeleteAttachmentsByMessage(messageId: string) {
  return prisma.attachment.updateMany({
    where: { messageId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

export type { AttachmentRow };
