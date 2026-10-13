import { z } from "zod";

export const activityTypeFilterSchema = z.enum([
  "all",
  "task",
  "comment",
  "file",
  "member",
]);

export const activityRangeSchema = z.coerce
  .number()
  .refine((v) => v === 7 || v === 30 || v === 90, {
    message: "Rentang waktu harus 7, 30, atau 90 hari",
  })
  .transform((v) => v as 7 | 30 | 90);

/** "" = tanpa filter. ID asing diabaikan di repository (dibatasi keanggotaan). */
const optionalCuid = z.string().cuid().or(z.literal(""));

export const activityQuerySchema = z.object({
  type: activityTypeFilterSchema.default("all"),
  project: optionalCuid.default(""),
  member: optionalCuid.default(""),
  range: activityRangeSchema.default(30),
});

export const activityFeedSchema = activityQuerySchema.extend({
  cursor: z.string().cuid().optional(),
});

export type ActivityQuery = z.infer<typeof activityQuerySchema>;
