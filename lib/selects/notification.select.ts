import type { Prisma } from "@/app/generated/prisma/client";

/** Select eksplisit untuk Inbox (/inbox): notifikasi + aktor + task + project + komentar. */
export const notificationDetailSelect = {
  id: true,
  type: true,
  readAt: true,
  createdAt: true,
  actor: { select: { id: true, name: true, avatarUrl: true } },
  task: {
    select: {
      id: true,
      title: true,
      priority: true,
      dueDate: true,
      status: true,
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      list: { select: { projectId: true } },
    },
  },
  // Project soft-deleted tetap dikirim (dengan flag deleted) agar baris Inbox
  // tidak crash; UI menampilkannya sebagai "Project dihapus" + target non-klik.
  project: { select: { id: true, name: true, deletedAt: true } },
  comment: {
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  },
  // Mention di Diskusi (messageId tanpa taskId) — pratinjau teks pesan chat.
  message: {
    select: {
      id: true,
      content: true,
      createdAt: true,
      deletedAt: true,
    },
  },
} satisfies Prisma.NotificationSelect;
