import { z } from "zod";

/** Isi pesan Diskusi: trim, 1–2000 karakter, tolak hanya-whitespace. */
const messageContentSchema = z
  .string()
  .trim()
  .min(1, "Pesan tidak boleh kosong")
  .max(2000, "Maksimal 2000 karakter")
  .refine((value) => value.trim().length > 0, "Pesan tidak boleh kosong");

export const sendMessageSchema = z.object({
  projectId: z.string().cuid(),
  content: messageContentSchema,
  replyToId: z.string().cuid().optional(),
});

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