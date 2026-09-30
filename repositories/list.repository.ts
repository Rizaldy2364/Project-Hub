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

export interface EnsureDefaultTaskListsInput {
  projectId: string;
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

export async function ensureDefaultTaskLists({ projectId }: EnsureDefaultTaskListsInput) {
  const existingLists = await findTaskListsByProjectId(projectId);
  const defaults = ["To Do", "In Progress", "Done"];
  const missingLists = defaults
    .filter((name) => !existingLists.some((list) => list.name === name))
    .map((name, index) => ({ projectId, name, order: existingLists.length + index }));

  if (missingLists.length) await prisma.taskList.createMany({ data: missingLists });
}

export async function findTaskListByProjectAndName(projectId: string, name: string) {
  return prisma.taskList.findFirst({
    where: { projectId, name, deletedAt: null },
    orderBy: { order: "asc" },
  });
}
