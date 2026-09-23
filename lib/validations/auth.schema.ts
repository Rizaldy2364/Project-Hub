import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Minimal 2 karakter").max(50, "Maksimal 50 karakter"),
  email: z.string().email("Format email tidak valid").max(255),
  password: z
    .string()
    .min(8, "Minimal 8 karakter")
    .max(72, "Maksimal 72 karakter")
    .regex(/[A-Z]/, "Harus ada huruf besar")
    .regex(/[0-9]/, "Harus ada angka"),
});

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;