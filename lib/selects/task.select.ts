import type { Prisma } from "@/app/generated/prisma/client";

/** Select eksplisit untuk halaman Task Project (/tasks): task + project pemiliknya. */
export const myTaskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  order: true,
  assignee: { select: { id: true, name: true, avatarUrl: true } },
  labels: {
    where: { deletedAt: null },
    select: { id: true, name: true, color: true },
  },
  list: {
    select: {
      project: { select: { id: true, name: true, description: true } },
    },
  },
} satisfies Prisma.TaskSelect;

/**
 * Select eksplisit untuk halaman Kalender (/calendar): task yang punya due date,
 * lengkap dengan project pemilik + role user di project tersebut (buat `isAdmin`).
 */
export const calendarTaskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  assignee: { select: { id: true, name: true, avatarUrl: true } },
  labels: {
    where: { deletedAt: null },
    select: { id: true, name: true, color: true },
  },
  list: {
    select: {
      project: {
        select: {
          id: true,
          name: true,
          members: {
            select: { userId: true, role: true },
          },
        },
      },
    },
  },
  _count: {
    select: { comments: { where: { deletedAt: null } } },
  },
} satisfies Prisma.TaskSelect;
