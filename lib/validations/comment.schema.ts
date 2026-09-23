import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().min(1, "Komentar tidak boleh kosong").max(1000, "Maksimal 1000 karakter"),
  taskId: z.string().cuid(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;