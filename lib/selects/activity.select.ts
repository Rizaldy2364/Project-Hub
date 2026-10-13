import type { Prisma } from "@/app/generated/prisma/client";

/** Select eksplisit untuk halaman Aktivitas (/aktivitas): log + aktor + project. */
export const activityLogDetailSelect = {
  id: true,
  action: true,
  meta: true,
  createdAt: true,
  user: { select: { id: true, name: true, avatarUrl: true } },
  project: { select: { id: true, name: true } },
} satisfies Prisma.ActivityLogSelect;
