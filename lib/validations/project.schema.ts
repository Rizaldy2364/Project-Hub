import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Nama project wajib diisi").max(100, "Maksimal 100 karakter"),
  description: z.string().max(500, "Maksimal 500 karakter").optional(),
});

export const joinProjectSchema = z.object({
  joinCode: z
    .string()
    .length(8, "Kode harus 8 karakter")
    .toUpperCase(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type JoinProjectInput = z.infer<typeof joinProjectSchema>;