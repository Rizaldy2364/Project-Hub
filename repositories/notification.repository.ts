import { prisma } from "@/lib/prisma";
import { notificationDetailSelect } from "@/lib/selects/notification.select";
import type {
  NotificationType,
  Prisma,
} from "@/app/generated/prisma/client";

export type NotificationTab = "all" | "unread" | "mention" | "task" | "invite";

export interface CreateNotificationInput {
  type: NotificationType;
  userId: string;
  actorId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  commentId?: string | null;
  messageId?: string | null; // mention di Diskusi
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
  task: ["TASK_ASSIGNED", "DUE_SOON", "TASK_COMMENT"],
  invite: ["MEMBER_JOINED"],
};

function buildWhere(userId: string, tab: NotificationTab) {
  const types = TAB_TYPES[tab];
  return {
    userId,
    ...(tab === "unread" ? { readAt: null } : {}),
    ...(types ? { type: { in: types } } : {}),
    // CATATAN: daftar Inbox SENGAJA tetap memuat notifikasi project yang
    // soft-deleted — UI menandainya "Project dihapus" dan menonaktifkan
    // target navigasinya (lihat inbox-meta.projectDisplayName). Filter
    // `notDeletedProjectFilter` hanya dipakai untuk hitungan/badge.
  };
}

/**
 * Angka badge/tab TIDAK menghitung notifikasi project yang sudah soft-deleted
 * (agar "project tidak muncul lagi" di mana pun). Daftar Inbox tetap
 * menampilkan barisnya — ditandai "Project dihapus" oleh UI.
 *
 * Tipe eksplisit `Prisma.NotificationWhereInput` (bukan `as const`) supaya
 * array `OR` tetap mutable — Prisma menuntut `NotificationWhereInput[]`,
 * sedangkan `as const` menghasilkan tuple readonly yang tidak bisa di-assign.
 */
const notDeletedProjectFilter: Prisma.NotificationWhereInput = {
  OR: [{ projectId: null }, { project: { deletedAt: null } }],
};

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

// Hitungan per tab (untuk angka di tab Inbox) — tanpa project soft-deleted.
export async function countNotificationsByTab(userId: string) {
  const [all, unread, mention, task, invite] = await Promise.all([
    prisma.notification.count({
      where: { userId, ...notDeletedProjectFilter },
    }),
    prisma.notification.count({
      where: { userId, readAt: null, ...notDeletedProjectFilter },
    }),
    prisma.notification.count({
      where: { userId, type: "MENTION", ...notDeletedProjectFilter },
    }),
    prisma.notification.count({
      where: {
        userId,
        type: { in: ["TASK_ASSIGNED", "DUE_SOON", "TASK_COMMENT"] },
        ...notDeletedProjectFilter,
      },
    }),
    prisma.notification.count({
      where: { userId, type: "MEMBER_JOINED", ...notDeletedProjectFilter },
    }),
  ]);
  return { all, unread, mention, task, invite };
}

/** Badge sidebar — tanpa notifikasi project soft-deleted. */
export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null, ...notDeletedProjectFilter },
  });
}

/** Sama seperti countUnreadNotifications tapi dibatasi satu project. */
export async function countUnreadNotificationsByProject(
  userId: string,
  projectId: string
) {
  return prisma.notification.count({
    where: { userId, projectId, readAt: null, ...notDeletedProjectFilter },
  });
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

// TASK_COMMENT — koalesensi: satu notifikasi per user per task; jika masih
// belum dibaca, baris lama diperbarui (komentar/aktor terbaru) alih-alih dobel.
export interface UpsertUnreadTaskCommentInput {
  userId: string;
  actorId: string;
  projectId: string;
  taskId: string;
  commentId: string;
}

export async function upsertUnreadTaskCommentNotification({
  userId,
  actorId,
  projectId,
  taskId,
  commentId,
}: UpsertUnreadTaskCommentInput) {
  const existing = await prisma.notification.findFirst({
    where: { userId, taskId, type: "TASK_COMMENT", readAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (existing) {
    return prisma.notification.update({
      where: { id: existing.id },
      data: { actorId, projectId, commentId, createdAt: new Date() },
    });
  }
  return prisma.notification.create({
    data: { type: "TASK_COMMENT", userId, actorId, projectId, taskId, commentId },
  });
}

// TASK_COMMENT — ID notifikasi belum dibaca milik user untuk satu task
// (dipakai auto-read saat user membuka detail task).
export async function findUnreadTaskCommentNotificationIds(
  userId: string,
  taskId: string
) {
  const rows = await prisma.notification.findMany({
    where: { userId, taskId, type: "TASK_COMMENT", readAt: null },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

// OWNER — cek kepemilikan notifikasi di actions/ tanpa query prisma langsung.
export async function findNotificationOwnerId(id: string) {
  return prisma.notification.findUnique({
    where: { id },
    select: { userId: true },
  });
}

// DISKUSI — tandai semua notifikasi MENTION chat (punya messageId, tanpa
// taskId) di satu project sebagai sudah dibaca. Dipanggil saat user membuka
// chat. updateMany milik user sendiri — otorisasi di actions/.
export async function markChatMentionsRead(userId: string, projectId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      projectId,
      type: "MENTION",
      messageId: { not: null },
      taskId: null,
      readAt: null,
    },
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
