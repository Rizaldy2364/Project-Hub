import { z } from "zod";

export const memberRoleFilterSchema = z.enum([
  "all",
  "ADMIN",
  "MANAGER",
  "MEMBER",
  "VIEWER",
]);

export const memberSortSchema = z.enum([
  "role",
  "joined_desc",
  "joined_asc",
  "name_asc",
  "name_desc",
]);

export const memberPageSizeSchema = z.coerce
  .number()
  .refine((v) => v === 10 || v === 25 || v === 50, {
    message: "Ukuran halaman harus 10, 25, atau 50",
  })
  .transform((v) => v as 10 | 25 | 50);

export const listMembersQuerySchema = z.object({
  projectId: z.string().cuid(),
  role: memberRoleFilterSchema.default("all"),
  q: z.string().max(100).default(""),
  sort: memberSortSchema.default("role"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: memberPageSizeSchema.default(10),
});

export const updateMemberRoleSchema = z.object({
  projectId: z.string().cuid(),
  targetUserId: z.string().cuid(),
  // ADMIN tidak bisa di-set/dicabut lewat fitur ini (dicek terpisah di actions).
  role: z.enum(["MANAGER", "MEMBER", "VIEWER"]),
});

export const removeMemberSchema = z.object({
  projectId: z.string().cuid(),
  targetUserId: z.string().cuid(),
});

export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;
