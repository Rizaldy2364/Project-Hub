import type { Prisma } from "@/app/generated/prisma/client";

export const projectDashboardSelect = {
  id: true,
  name: true,
  description: true,
  joinCode: true,
  createdAt: true,
  members: {
    select: {
      userId: true,
      role: true,
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  },
  lists: {
    where: { deletedAt: null },
    select: {
      tasks: { where: { deletedAt: null }, select: { status: true, dueDate: true } },
    },
  },
} satisfies Prisma.ProjectSelect;