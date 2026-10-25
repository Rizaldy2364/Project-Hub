import type { Prisma } from "@/app/generated/prisma/client";
import type { AttachmentDTO } from "@/types";

/**
 * Select eksplisit untuk Attachment: field yang aman dikirim ke client.
 * Tidak mengekspos `key` (rahasia UploadThing) maupun uploadedById.
 * Attachment yang sudah soft-delete (deletedAt != null) difilter di repository.
 */
export const attachmentSelect = {
  id: true,
  name: true,
  url: true,
  size: true,
  mimeType: true,
  createdAt: true,
} satisfies Prisma.AttachmentSelect;

export type AttachmentRow = Prisma.AttachmentGetPayload<{
  select: typeof attachmentSelect;
}>;

/**
 * DTO attachment untuk ditampilkan di bubble pesan dan daftar percakapan.
 * `isImage` dihitung dari mimeType.
 */
export function toAttachmentDTO(row: AttachmentRow): AttachmentDTO {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    size: row.size,
    mimeType: row.mimeType,
    isImage: /^(image\/(png|jpeg|jpg|webp|gif))$/i.test(row.mimeType),
  };
}
