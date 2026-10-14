import type { Prisma } from "@/app/generated/prisma/client";

/** Select eksplisit untuk tabel "Task terlambat" di halaman /laporan. */
export const overdueTaskSelect = {
  id: true,
  title: true,
  dueDate: true,
  assignee: { select: { id: true, name: true, avatarUrl: true } },
  list: {
    select: {
      project: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.TaskSelect;
