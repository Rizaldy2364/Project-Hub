import { z } from "zod";

export const sendMessageSchema = z.object({
  projectId: z.string().cuid(),
  content: z.string().optional(),
  replyToId: z.string().cuid().optional(),
  attachmentIds: z.array(z.string().cuid()).max(5, "Maksimal 5 lampiran").optional(),
})
  .refine(
    (data) => {
      // Jika tidak ada lampiran, konten wajib diisi dan tidak boleh hanya spasi.
      if (!data.attachmentIds || data.attachmentIds.length === 0) {
        return typeof data.content === "string" && data.content.trim().length > 0;
      }
      // Jika ada lampiran, konten boleh kosong (hanya lampiran).
      return true;
    },
    {
      message: "Konten atau minimal satu lampiran wajib diisi",
      path: ["content"],
    }
  )
  .refine(
    (data) => {
      // Konten maksimal 2000 karakter bila diisi.
      if (data.content && data.content.length > 2000) return false;
      return true;
    },
    {
      message: "Maksimal 2000 karakter",
      path: ["content"],
    }
  );

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const messageIdSchema = z.object({
  projectId: z.string().cuid(),
  messageId: z.string().cuid(),
});

export type MessageIdInput = z.infer<typeof messageIdSchema>;

export const chatReadSchema = z.object({
  projectId: z.string().cuid(),
});

export type ChatReadInput = z.infer<typeof chatReadSchema>;