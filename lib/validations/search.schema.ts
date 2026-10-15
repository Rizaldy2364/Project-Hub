import { z } from "zod";

/**
 * Query pencarian top bar: trim, 2–100 karakter. Lebih pendek ditolak agar
 * route mengembalikan 400 dengan hasil kosong tanpa menyentuh database.
 */
export const searchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, "Ketik minimal 2 huruf")
    .max(100, "Maksimal 100 karakter"),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
