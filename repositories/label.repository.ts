import { prisma } from "@/lib/prisma";

export interface CreateLabelInput {
  name: string;
  color: string;
  projectId: string;
}

export interface UpdateLabelInput {
  name?: string;
  color?: string;
}

// CREATE
export async function createLabel(data: CreateLabelInput) {
  return prisma.label.create({
    data,
  });
}

// READ
export async function findLabelById(id: string) {
  return prisma.label.findUnique({
    where: { id, deletedAt: null },
  });
}

export async function findLabelsByProjectId(projectId: string) {
  return prisma.label.findMany({
    where: { projectId, deletedAt: null },
    orderBy: { name: "asc" },
  });
}

// UPDATE
export async function updateLabel(id: string, data: UpdateLabelInput) {
  return prisma.label.update({
    where: { id },
    data,
  });
}

// ASSIGN / UNASSIGN label ke task (many-to-many)
export async function assignLabelToTask(taskId: string, labelId: string) {
  return prisma.task.update({
    where: { id: taskId },
    data: {
      labels: { connect: { id: labelId } },
    },
  });
}

export async function unassignLabelFromTask(taskId: string, labelId: string) {
  return prisma.task.update({
    where: { id: taskId },
    data: {
      labels: { disconnect: { id: labelId } },
    },
  });
}

// SOFT DELETE
export async function softDeleteLabel(id: string) {
  return prisma.label.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}