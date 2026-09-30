import type { Prisma } from "@/app/generated/prisma/client";

export const projectBoardSelect = {
  id: true,
  name: true,
  description: true,
  joinCode: true,
  createdAt: true,
  members: {
    select: {
      userId: true,
      role: true,
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  },
  labels: {
    where: { deletedAt: null },
    select: { id: true, name: true, color: true },
  },
  lists: {
    where: { deletedAt: null },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      tasks: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          dueDate: true,
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          labels: { where: { deletedAt: null }, select: { id: true, name: true, color: true } },
          _count: { select: { comments: { where: { deletedAt: null } } } },
        },
      },
    },
  },
} satisfies Prisma.ProjectSelect;
