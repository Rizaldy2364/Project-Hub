import { prisma } from "@/lib/prisma";
import { generateJoinCode } from "@/lib/utils";

export interface CreateProjectInput {
  name: string;
  description?: string;
  ownerId: string; // user yang bikin project, otomatis jadi ADMIN
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

export interface CreateProjectMemberInput {
  userId: string;
  projectId: string;
  role: "ADMIN" | "MEMBER";
}

// CREATE
export async function createProject(data: CreateProjectInput) {
  return prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      joinCode: generateJoinCode(),
      members: {
        create: {
          userId: data.ownerId,
          role: "ADMIN",
        },
      },
    },
  });
}

export async function createProjectMember(data: CreateProjectMemberInput) {
  return prisma.projectMember.create({
    data,
  });
}

// READ
export async function findProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id, deletedAt: null },
  });
}

export async function findProjectByJoinCode(joinCode: string) {
  return prisma.project.findUnique({
    where: { joinCode, deletedAt: null },
  });
}

export async function findProjectsByUserId(userId: string) {
  return prisma.project.findMany({
    where: {
      deletedAt: null,
      members: {
        some: { userId },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findProjectMember(userId: string, projectId: string) {
  return prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId,
      },
    },
  });
}

// UPDATE
export async function updateProject(id: string, data: UpdateProjectInput) {
  return prisma.project.update({
    where: { id },
    data,
  });
}

export async function regenerateProjectJoinCode(projectId: string) {
  return prisma.project.update({
    where: { id: projectId },
    data: { joinCode: generateJoinCode() },
  });
}

// SOFT DELETE
export async function softDeleteProject(projectId: string) {
  return prisma.project.update({
    where: { id: projectId },
    data: { deletedAt: new Date() },
  });
}

// RESTORE (kebalikan dari soft delete, buat fitur "Trash" opsional nanti)
export async function restoreProject(projectId: string) {
  return prisma.project.update({
    where: { id: projectId },
    data: { deletedAt: null },
  });
}