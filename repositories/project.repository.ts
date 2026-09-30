import { prisma } from "@/lib/prisma";
import { generateJoinCode } from "@/lib/utils";
import { projectDashboardSelect } from "@/lib/selects/project.select";
import { projectBoardSelect } from "@/lib/selects/project-board.select";
import type { DashboardProject } from "@/types";

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
    include: {
      _count: {
        select: { members: true },
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

export async function findDashboardProjectsByUserId(
  userId: string
): Promise<DashboardProject[]> {
  const projects = await prisma.project.findMany({
    where: { deletedAt: null, members: { some: { userId } } },
    orderBy: { createdAt: "desc" },
    select: projectDashboardSelect,
  });

  return projects.map((project) => {
    const role =
      project.members.find((m) => m.userId === userId)?.role ?? "MEMBER";
    const tasks = project.lists.flatMap((list) => list.tasks);

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      joinCode: role === "ADMIN" ? project.joinCode : null,
      createdAt: project.createdAt.toISOString(),
      role,
      memberCount: project.members.length,
      members: project.members.slice(0, 4).map((m) => m.user),
      taskTotal: tasks.length,
      taskDone: tasks.filter((t) => t.status === "DONE").length,
    };
  });
}

export async function countTeammates(userId: string) {
  const teammates = await prisma.projectMember.findMany({
    where: {
      userId: { not: userId },
      project: { deletedAt: null, members: { some: { userId } } },
    },
    distinct: ["userId"],
    select: { userId: true },
  });
  return teammates.length;
}

export async function findProjectBoardById(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId, deletedAt: null },
    select: projectBoardSelect,
  });
}

export interface ProfileProjectMetrics {
  projectCount: number;
  adminRoleCount: number;
  projects: {
    id: string;
    name: string;
    role: "ADMIN" | "MEMBER";
    memberCount: number;
  }[];
}

export async function getProfileProjectMetrics(
  userId: string
): Promise<ProfileProjectMetrics> {
  const memberships = await prisma.projectMember.findMany({
    where: {
      userId,
      project: { deletedAt: null },
    },
    select: {
      role: true,
      project: {
        select: {
          id: true,
          name: true,
          _count: { select: { members: true } },
        },
      },
    },
  });

  return {
    projectCount: memberships.length,
    adminRoleCount: memberships.filter((membership) => membership.role === "ADMIN")
      .length,
    projects: memberships.map((membership) => ({
      id: membership.project.id,
      name: membership.project.name,
      role: membership.role,
      memberCount: membership.project._count.members,
    })),
  };
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


export async function removeProjectMember(userId: string, projectId: string) {
  return prisma.projectMember.delete({
    where: {
      userId_projectId: {
        userId,
        projectId,
      },
    },
  });
}
