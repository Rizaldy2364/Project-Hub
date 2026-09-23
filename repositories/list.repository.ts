import { prisma } from "@/lib/prisma";

export interface CreateTaskListInput {
  name: string;
  projectId: string;
  order: number;
}

export interface UpdateTaskListInput {
  name?: string;
  order?: number;
}

// CREATE
export async function createTaskList(data: CreateTaskListInput) {
  return prisma.taskList.create({
    data,
  });
}

// READ
export async function findTaskListById(id: string) {
  return prisma.taskList.findUnique({
    where: { id, deletedAt: null },
  });
}

export async function findTaskListsByProjectId(projectId: string) {
  return prisma.taskList.findMany({
    where: { projectId, deletedAt: null },
    orderBy: { order: "asc" },
  });
}

export async function countTaskListsByProjectId(projectId: string) {
  return prisma.taskList.count({
    where: { projectId, deletedAt: null },
  });
}

// UPDATE
export async function updateTaskList(id: string, data: UpdateTaskListInput) {
  return prisma.taskList.update({
    where: { id },
    data,
  });
}

// SOFT DELETE
export async function softDeleteTaskList(id: string) {
  return prisma.taskList.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}