import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Minimal 2 karakter").max(50, "Maksimal 50 karakter"),
  bio: z.string().max(160, "Maksimal 160 karakter").optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z
    .string()
    .min(8, "Minimal 8 karakter")
    .max(72, "Maksimal 72 karakter")
    .regex(/[A-Z]/, "Harus ada huruf besar")
    .regex(/[0-9]/, "Harus ada angka"),
});

export const coverGradientSchema = z.enum(["indigo", "ocean", "sunset", "forest"]);

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CoverGradientInput = z.infer<typeof coverGradientSchema>;
