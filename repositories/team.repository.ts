import { prisma } from "@/lib/prisma";
import type { ProjectRole } from "@/types";

export type MemberRoleFilter = "all" | ProjectRole;
export type MemberSort = "joined_desc" | "joined_asc" | "name_asc" | "name_desc";

export interface FindProjectMembersInput {
  projectId: string;
  role: MemberRoleFilter;
  q: string;
  sort: MemberSort;
  page: number;
  pageSize: 10 | 25 | 50;
}

export interface UpdateMemberRoleInput {
  projectId: string;
  targetUserId: string;
  role: "DEPUTY_ADMIN" | "MEMBER";
}

function buildWhere(projectId: string, role: MemberRoleFilter, q: string) {
  const query = q.trim();
  return {
    projectId,
    ...(role !== "all" ? { role } : {}),
    ...(query
      ? {
          user: {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { email: { contains: query, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };
}

function buildOrderBy(sort: MemberSort) {
  switch (sort) {
    case "joined_asc":
      return { joinedAt: "asc" as const };
    case "name_asc":
      return { user: { name: "asc" as const } };
    case "name_desc":
      return { user: { name: "desc" as const } };
    case "joined_desc":
    default:
      return { joinedAt: "desc" as const };
  }
}

// READ — daftar project yang diikuti user (untuk dropdown), tanpa joinCode.
export async function findProjectsForMemberDropdown(userId: string) {
  return prisma.project.findMany({
    where: { deletedAt: null, members: { some: { userId } } },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });
}

// READ — daftar anggota dengan filter/sort/pagination di database.
export async function findProjectMembers({
  projectId,
  role,
  q,
  sort,
  page,
  pageSize,
}: FindProjectMembersInput) {
  const where = buildWhere(projectId, role, q);
  const safePage = Math.max(1, page);

  const [total, rows] = await Promise.all([
    prisma.projectMember.count({ where }),
    prisma.projectMember.findMany({
      where,
      orderBy: buildOrderBy(sort),
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      select: {
        userId: true,
        role: true,
        joinedAt: true,
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    }),
  ]);

  // activeTaskCount untuk satu halaman sekaligus (satu groupBy, bukan per baris).
  const userIds = rows.map((r) => r.userId);
  const counts =
    userIds.length > 0
      ? await prisma.task.groupBy({
          by: ["assigneeId"],
          where: {
            deletedAt: null,
            status: { not: "DONE" },
            assigneeId: { in: userIds },
            list: { deletedAt: null, projectId },
          },
          _count: { assigneeId: true },
        })
      : [];
  const countMap = new Map(
    counts.map((c) => [c.assigneeId as string, c._count.assigneeId])
  );

  return {
    total,
    members: rows.map((r) => ({
      id: r.user.id,
      name: r.user.name,
      email: r.user.email,
      avatarUrl: r.user.avatarUrl,
      role: r.role,
      joinedAt: r.joinedAt.toISOString(),
      activeTaskCount: countMap.get(r.userId) ?? 0,
    })),
  };
}

// READ — ringkasan (tidak terpengaruh filter/pencarian).
export async function countProjectMembersByRole(projectId: string) {
  const groups = await prisma.projectMember.groupBy({
    by: ["role"],
    where: { projectId },
    _count: { role: true },
  });
  const byRole: Record<ProjectRole, number> = {
    ADMIN: 0,
    DEPUTY_ADMIN: 0,
    MEMBER: 0,
  };
  for (const g of groups) byRole[g.role as ProjectRole] = g._count.role;
  return {
    total: byRole.ADMIN + byRole.DEPUTY_ADMIN + byRole.MEMBER,
    admin: byRole.ADMIN,
    deputy: byRole.DEPUTY_ADMIN,
    member: byRole.MEMBER,
  };
}

// UPDATE — ubah peran dalam satu transaksi (aturan divalidasi di actions).
export async function updateProjectMemberRole(data: UpdateMemberRoleInput) {
  return prisma.$transaction([
    prisma.projectMember.update({
      where: {
        userId_projectId: { userId: data.targetUserId, projectId: data.projectId },
      },
      data: { role: data.role },
    }),
  ]);
}

// DELETE — dalam satu transaksi: unassign task-nya lalu hapus membership.
export async function removeProjectMemberWithUnassign(
  projectId: string,
  targetUserId: string
) {
  return prisma.$transaction([
    prisma.task.updateMany({
      where: {
        deletedAt: null,
        assigneeId: targetUserId,
        list: { projectId },
      },
      data: { assigneeId: null },
    }),
    prisma.projectMember.delete({
      where: {
        userId_projectId: { userId: targetUserId, projectId },
      },
    }),
  ]);
}
