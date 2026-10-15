import type { Prisma } from "@/app/generated/prisma/client";

/**
 * Select eksplisit untuk pencarian project di top bar. `createdAt` dipakai
 * server untuk peringkat "terbaru" dan TIDAK dikirim ke client.
 */
export const searchProjectSelect = {
  id: true,
  name: true,
  createdAt: true,
  _count: { select: { members: true } },
} satisfies Prisma.ProjectSelect;

/**
 * Select eksplisit untuk pencarian task di top bar: task + project pemiliknya.
 * `createdAt` dipakai server untuk peringkat "terbaru", tidak dikirim ke client.
 */
export const searchTaskSelect = {
  id: true,
  title: true,
  status: true,
  dueDate: true,
  createdAt: true,
  list: {
    select: {
      project: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.TaskSelect;
