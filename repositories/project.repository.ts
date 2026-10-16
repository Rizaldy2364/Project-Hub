import { prisma } from "@/lib/prisma";
import { generateJoinCode } from "@/lib/utils";
import { canViewJoinCode } from "@/lib/permissions";
import { projectDashboardSelect } from "@/lib/selects/project.select";
import { projectBoardSelect } from "@/lib/selects/project-board.select";
import type { DashboardProject, ProjectRole } from "@/types";

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
  role: ProjectRole;
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

export interface ProjectOption {
  id: string;
  name: string;
}

// READ — opsi dropdown filter project (hanya project yang diikuti user).
export async function findProjectOptionsByUserId(
  userId: string
): Promise<ProjectOption[]> {
  return prisma.project.findMany({
    where: {
      deletedAt: null,
      members: { some: { userId } },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export interface ProjectMemberUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

// READ — daftar anggota project (id, nama, avatar) untuk pencocokan mention
// dan filter member halaman Aktivitas.
// VIEWER dikeluarkan: tidak muncul di daftar mention dan token `@` untuk
// VIEWER diabaikan (matriks 8.2 — AGENTS.md).
export async function findProjectMemberUsers(
  projectId: string
): Promise<ProjectMemberUser[]> {
  const rows = await prisma.projectMember.findMany({
    where: { projectId, role: { not: "VIEWER" } },
    select: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
  return rows.map((row) => row.user);
}

// READ — ID anggota dengan peran ADMIN/MANAGER (fallback penerima
// notifikasi TASK_COMMENT untuk task lama tanpa createdById).
export async function findProjectAdminUserIds(projectId: string) {
  const rows = await prisma.projectMember.findMany({
    where: { projectId, role: { in: ["ADMIN", "MANAGER"] } },
    select: { userId: true },
  });
  return rows.map((row) => row.userId);
}

export interface FindProjectNameByIdInput {
  projectId: string;
  /** true = ikut ambil joinCode — hanya untuk ADMIN/MANAGER (AGENTS 8.1). */
  withJoinCode: boolean;
}

export interface ProjectNameById {
  name: string;
  joinCode?: string;
}

// READ — nama project; joinCode hanya dibaca dari DB bila withJoinCode=true,
// sehingga untuk MEMBER field ini tidak pernah keluar dari database.
export async function findProjectNameById({
  projectId,
  withJoinCode,
}: FindProjectNameByIdInput): Promise<ProjectNameById | null> {
  if (withJoinCode) {
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
      select: { name: true, joinCode: true },
    });
    return project ? { name: project.name, joinCode: project.joinCode } : null;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId, deletedAt: null },
    select: { name: true },
  });
  return project ? { name: project.name } : null;
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

    // Tenggat project adalah TURUNAN: ambil due date terdekat dari task yang belum selesai.
    const openDueDates = tasks
      .filter((task) => task.status !== "DONE" && task.dueDate)
      .map((task) => task.dueDate!.getTime());
    const nextDueDate = openDueDates.length
      ? new Date(Math.min(...openDueDates)).toISOString()
      : null;

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      // joinCode hanya untuk ADMIN & MANAGER; untuk MEMBER field ini
      // tidak ikut dikirim ke client (bukan sekadar disembunyikan).
      ...(canViewJoinCode(role) ? { joinCode: project.joinCode } : {}),
      createdAt: project.createdAt.toISOString(),
      role,
      memberCount: project.members.length,
      members: project.members.slice(0, 4).map((m) => m.user),
      taskTotal: tasks.length,
      taskDone: tasks.filter((t) => t.status === "DONE").length,
      nextDueDate,
      isOverdue: nextDueDate !== null && nextDueDate < new Date().toISOString(),
    };
  });
}

export interface WeeklyActivityPoint {
  date: string; // yyyy-MM-dd (waktu lokal server)
  count: number;
}

/**
 * Aktivitas 7 hari terakhir di project yang diikuti user:
 * jumlah task yang dibuat + komentar yang ditulis per hari (data nyata, bukan contoh).
 */
export async function findWeeklyActivityByUserId(
  userId: string
): Promise<WeeklyActivityPoint[]> {
  const days = 7;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const projectScope = { deletedAt: null, members: { some: { userId } } };

  const [tasks, comments] = await Promise.all([
    prisma.task.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: start },
        list: { deletedAt: null, project: projectScope },
      },
      select: { createdAt: true },
    }),
    prisma.comment.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: start },
        task: { deletedAt: null, list: { deletedAt: null, project: projectScope } },
      },
      select: { createdAt: true },
    }),
  ]);

  const toKey = (value: Date) =>
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
      value.getDate()
    ).padStart(2, "0")}`;

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    buckets.set(toKey(day), 0);
  }

  for (const item of [...tasks, ...comments]) {
    const key = toKey(item.createdAt);
    if (buckets.has(key)) buckets.set(key, buckets.get(key)! + 1);
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
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
    role: ProjectRole;
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
