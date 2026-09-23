import { prisma } from "@/lib/prisma";

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: Date;
  listId: string;
  assigneeId?: string;
  order: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: Date | null;
  status?: "TODO" | "IN_PROGRESS" | "DONE";
  assigneeId?: string | null;
}

export interface TaskFilterParams {
  projectId: string;
  search?: string;
  assigneeId?: string;
  labelId?: string;
  status?: "TODO" | "IN_PROGRESS" | "DONE";
}

// CREATE
export async function createTask(data: CreateTaskInput) {
  return prisma.task.create({
    data,
  });
}

// READ
export async function findTaskById(id: string) {
  return prisma.task.findUnique({
    where: { id, deletedAt: null },
  });
}

export async function findTasksByListId(listId: string) {
  return prisma.task.findMany({
    where: { listId, deletedAt: null },
    orderBy: { order: "asc" },
  });
}

export async function countTasksByListId(listId: string) {
  return prisma.task.count({
    where: { listId, deletedAt: null },
  });
}

// UPDATE
export async function updateTask(id: string, data: UpdateTaskInput) {
  return prisma.task.update({
    where: { id },
    data,
  });
}

// MOVE TASK — pindah ke list lain dan/atau ubah urutan (buat drag-and-drop)
export async function moveTask(
  taskId: string,
  newListId: string,
  newOrder: number
) {
  return prisma.task.update({
    where: { id: taskId },
    data: {
      listId: newListId,
      order: newOrder,
    },
  });
}

// SEARCH & FILTER
export async function findTasksWithFilters(params: TaskFilterParams) {
  return prisma.task.findMany({
    where: {
      deletedAt: null,
      list: {
        projectId: params.projectId,
      },
      ...(params.search && {
        title: {
          contains: params.search,
          mode: "insensitive",
        },
      }),
      ...(params.assigneeId && {
        assigneeId: params.assigneeId,
      }),
      ...(params.labelId && {
        labels: {
          some: { id: params.labelId },
        },
      }),
      ...(params.status && {
        status: params.status,
      }),
    },
    orderBy: { order: "asc" },
    include: {
      assignee: {
        select: { id: true, name: true, avatarUrl: true },
      },
      labels: {
        select: { id: true, name: true, color: true },
      },
    },
  });
}

// SOFT DELETE
export async function softDeleteTask(id: string) {
  return prisma.task.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}