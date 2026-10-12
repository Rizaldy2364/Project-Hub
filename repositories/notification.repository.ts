import { prisma } from "@/lib/prisma";
import { notificationDetailSelect } from "@/lib/selects/notification.select";
import type { NotificationType } from "@/app/generated/prisma/client";

export type NotificationTab = "all" | "unread" | "mention" | "task" | "invite";

export interface CreateNotificationInput {
  type: NotificationType;
  userId: string;
  actorId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  commentId?: string | null;
}

export interface FindNotificationsInput {
  userId: string;
  tab: NotificationTab;
  cursor?: string | null;
  take?: number;
}

const TAB_TYPES: Record<NotificationTab, NotificationType[] | null> = {
  all: null,
  unread: null,
  mention: ["MENTION"],
  task: ["TASK_ASSIGNED", "DUE_SOON"],
  invite: ["MEMBER_JOINED"],
};

function buildWhere(userId: string, tab: NotificationTab) {
  const types = TAB_TYPES[tab];
  return {
    userId,
    ...(tab === "unread" ? { readAt: null } : {}),
    ...(types ? { type: { in: types } } : {}),
  };
}

// CREATE — murni insert, tanpa validasi/cek sesi (dicek di actions/).
export async function createNotification(data: CreateNotificationInput) {
  return prisma.notification.create({ data });
}

export async function createManyNotifications(data: CreateNotificationInput[]) {
  if (data.length === 0) return { count: 0 };
  return prisma.notification.createMany({ data });
}

// READ — daftar dengan cursor pagination (20 per halaman), urut createdAt desc.
export async function findNotificationsByUserId({
  userId,
  tab,
  cursor,
  take = 20,
}: FindNotificationsInput) {
  return prisma.notification.findMany({
    where: buildWhere(userId, tab),
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: notificationDetailSelect,
  });
}

export async function findNotificationById(id: string) {
  return prisma.notification.findUnique({
    where: { id },
    select: notificationDetailSelect,
  });
}

// Hitungan per tab (untuk angka di tab Inbox).
export async function countNotificationsByTab(userId: string) {
  const [all, unread, mention, task, invite] = await Promise.all([
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, readAt: null } }),
    prisma.notification.count({ where: { userId, type: "MENTION" } }),
    prisma.notification.count({
      where: { userId, type: { in: ["TASK_ASSIGNED", "DUE_SOON"] } },
    }),
    prisma.notification.count({ where: { userId, type: "MEMBER_JOINED" } }),
  ]);
  return { all, unread, mention, task, invite };
}

export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

// UPDATE — tandai dibaca (kepemilikan dicek di actions/).
export async function markNotificationRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

// DUE_SOON — cegah duplikat: satu notifikasi per (userId, taskId) per hari.
export async function existsDueSoonToday(userId: string, taskId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const found = await prisma.notification.findFirst({
    where: {
      userId,
      taskId,
      type: "DUE_SOON",
      createdAt: { gte: startOfDay },
    },
    select: { id: true },
  });
  return found !== null;
}

export interface DueSoonTaskInput {
  id: string;
  assigneeId: string | null;
}

export async function findDueSoonTasks() {
  const now = new Date();
  const in3Days = new Date(now);
  in3Days.setDate(now.getDate() + 3);
  return prisma.task.findMany({
    where: {
      deletedAt: null,
      status: { not: "DONE" },
      assigneeId: { not: null },
      dueDate: { gte: now, lte: in3Days },
      list: { deletedAt: null, project: { deletedAt: null } },
    },
    select: { id: true, assigneeId: true },
  });
}
