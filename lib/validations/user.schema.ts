import { z } from "zod";
import { calculateAge } from "@/lib/utils";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Minimal 2 karakter").max(50, "Maksimal 50 karakter"),
  bio: z.string().max(160, "Maksimal 160 karakter").optional(),
});

// ===== Detail profil (Personal Information) =====

export const genderSchema = z.enum(["MALE", "FEMALE", "OTHER", "UNDISCLOSED"]);

const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} maksimal ${max} karakter`).optional();

const optionalUrl = (label: string) =>
  z
    .string()
    .trim()
    .url(`${label} harus berupa URL valid, contoh: https://contoh.com`)
    .max(200, `${label} maksimal 200 karakter`)
    .optional();

const tagListSchema = (label: string, maxItems: number, maxLength: number) =>
  z
    .array(
      z
        .string()
        .trim()
        .min(1, `${label} tidak boleh kosong`)
        .max(maxLength, `${label} maksimal ${maxLength} karakter`)
    )
    .max(maxItems, `${label} maksimal ${maxItems} item`)
    .optional();

export const profileDetailsSchema = z.object({
  headline: optionalText("Headline", 80),
  company: optionalText("Perusahaan", 80),
  location: optionalText("Lokasi", 80),
  website: optionalUrl("Website"),
  githubUrl: optionalUrl("GitHub"),
  linkedinUrl: optionalUrl("LinkedIn"),
  gender: genderSchema.optional(),
  skills: tagListSchema("Keahlian", 15, 30),
  languages: tagListSchema("Bahasa", 10, 30),
  birthDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Tanggal tidak valid")
    .refine((value) => new Date(value) <= new Date(), "Tanggal lahir tidak boleh di masa depan")
    .refine((value) => {
      const age = calculateAge(value);
      return age >= 13 && age <= 100;
    }, "Umur harus antara 13 sampai 100 tahun")
    .optional(),
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
export type ProfileDetailsInput = z.infer<typeof profileDetailsSchema>;
export type GenderInput = z.infer<typeof genderSchema>;
