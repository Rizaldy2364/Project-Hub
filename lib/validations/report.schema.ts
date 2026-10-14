import { z } from "zod";

export const reportRangeSchema = z.coerce
  .number()
  .refine((v) => v === 7 || v === 30 || v === 90, {
    message: "Rentang waktu harus 7, 30, atau 90 hari",
  })
  .transform((v) => v as 7 | 30 | 90);

/**
 * Filter halaman /laporan dari URL. ID asing/tidak valid diabaikan (jatuh ke
 * default "all") — validasi terhadap daftar project/member user dilakukan di
 * halaman sebelum query.
 */
export const reportQuerySchema = z.object({
  /** "all" atau id project. */
  project: z.string().cuid().or(z.literal("all")).catch("all").default("all"),
  /** "all" | "me" | id user. */
  member: z
    .string()
    .cuid()
    .or(z.enum(["me", "all"]))
    .catch("all")
    .default("all"),
  range: reportRangeSchema.catch(30).default(30),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
