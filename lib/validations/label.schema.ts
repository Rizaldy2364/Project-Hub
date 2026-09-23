import { z } from "zod";

export const createLabelSchema = z.object({
  name: z.string().min(1, "Nama label wajib diisi").max(30, "Maksimal 30 karakter"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Harus format hex color, misal #FF5733"),
  projectId: z.string().cuid(),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(30).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;