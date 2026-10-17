import { prisma } from "@/lib/prisma";
import { activityLogDetailSelect } from "@/lib/selects/activity.select";
import type { ActivityAction, Prisma } from "@/app/generated/prisma/client";

export type ActivityTypeFilter = "all" | "task" | "comment" | "file" | "member";

export interface CreateActivityLogInput {
  userId: string;
  projectId: string;
  taskId?: string | null;
  action: ActivityAction;
  /** Snapshot saat kejadian (judul/dari/ke/…) agar tetap render bila data
   * asli di-rename/di-soft-delete. */
  meta?: Prisma.InputJsonValue;
}

export interface FindActivityLogsInput {
  /** Pemilik feed — hanya log project yang diikutinya yang muncul. */
  userId: string;
  type: ActivityTypeFilter;
  /** "" = semua project. */
  project: string;
  /** "" = semua member (filter per pelaku/actor). */
  member: string;
  /** Opsional; dihilangkan = tanpa batas rentang (mis. kartu "Aktivitas
   * terbaru" di Ringkasan yang selalu menampilkan 5 log terakhir). */
  range?: 7 | 30 | 90;
  cursor?: string;
  take?: number;
}

export interface ActivitySummary {
  taskCompleted: number;
  taskCreated: number;
  commentAdded: number;
  fileUploaded: number;
}

const TYPE_ACTIONS: Record<ActivityTypeFilter, ActivityAction[] | null> = {
  all: null,
  task: ["TASK_CREATED", "TASK_UPDATED", "TASK_COMPLETED"],
  comment: ["COMMENT_ADDED"],
  file: ["FILE_UPLOADED"],
  member: [
    "MEMBER_JOINED",
    "MEMBER_ROLE_CHANGED",
    "MEMBER_REMOVED",
    "PROJECT_CREATED",
  ],
};

function rangeStartDate(range: number): Date {
  const from = new Date();
  from.setDate(from.getDate() - range);
  return from;
}

// Scope keamanan: hanya log project yang diikuti user (ada baris ProjectMember)
// dan project tidak soft-deleted.
function scopeWhere(userId: string): Prisma.ActivityLogWhereInput {
  return {
    project: { deletedAt: null, members: { some: { userId } } },
  };
}

// CREATE — murni insert; dipanggil lewat lib/activity.ts (bukan dari actions/).
export async function createActivityLog(data: CreateActivityLogInput) {
  return prisma.activityLog.create({
    data: {
      userId: data.userId,
      projectId: data.projectId,
      taskId: data.taskId ?? null,
      action: data.action,
      meta: data.meta,
    },
  });
}

// READ — feed dengan cursor pagination (30/halaman), urut createdAt desc.
export async function findActivityLogs({
  userId,
  type,
  project,
  member,
  range,
  cursor,
  take = 30,
}: FindActivityLogsInput) {
  const actions = TYPE_ACTIONS[type];
  const where: Prisma.ActivityLogWhereInput = {
    ...scopeWhere(userId),
    ...(range ? { createdAt: { gte: rangeStartDate(range) } } : {}),
    ...(actions ? { action: { in: actions } } : {}),
    ...(project ? { projectId: project } : {}),
    ...(member ? { userId: member } : {}),
  };

  return prisma.activityLog.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: activityLogDetailSelect,
  });
}

// READ — ringkasan 7 hari terakhir (satu groupBy, tanpa N+1).
export async function summarizeActivityLast7Days(
  userId: string,
  projectId?: string
): Promise<ActivitySummary> {
  const groups = await prisma.activityLog.groupBy({
    by: ["action"],
    where: {
      ...scopeWhere(userId),
      ...(projectId ? { projectId } : {}),
      createdAt: { gte: rangeStartDate(7) },
    },
    _count: { action: true },
  });
  const byAction = new Map(groups.map((g) => [g.action, g._count.action]));
  return {
    taskCompleted: byAction.get("TASK_COMPLETED") ?? 0,
    taskCreated: byAction.get("TASK_CREATED") ?? 0,
    commentAdded: byAction.get("COMMENT_ADDED") ?? 0,
    fileUploaded: byAction.get("FILE_UPLOADED") ?? 0,
  };
}

// READ — top anggota paling aktif 7 hari terakhir (groupBy + satu query nama).
export async function findMostActiveMembers(
  userId: string,
  take = 3,
  projectId?: string
) {
  const groups = await prisma.activityLog.groupBy({
    by: ["userId"],
    where: {
      ...scopeWhere(userId),
      ...(projectId ? { projectId } : {}),
      createdAt: { gte: rangeStartDate(7) },
    },
    _count: { _all: true },
    orderBy: { _count: { userId: "desc" } },
    take,
  });
  if (groups.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: groups.map((g) => g.userId) } },
    select: { id: true, name: true, avatarUrl: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return groups
    .map((g) => {
      const u = userMap.get(g.userId);
      return u ? { ...u, count: g._count._all } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);
}

// READ — user yang berbagi minimal satu project dengan user tsb (dropdown member).
export async function findSharedProjectUsers(userId: string) {
  const memberships = await prisma.projectMember.findMany({
    where: { project: { deletedAt: null, members: { some: { userId } } } },
    distinct: ["userId"],
    select: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
  return memberships
    .map((m) => m.user)
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}
