import { prisma } from "@/lib/prisma";
import {
  chatMessageSelectFor,
  chatMemberSelect,
  type ChatMessageRow,
} from "@/lib/selects/message.select";
import type { Prisma } from "@/app/generated/prisma/client";

export const CHAT_PAGE_SIZE = 50;

export interface CreateMessageInput {
  projectId: string;
  userId: string;
  content: string;
  kind?: "USER" | "SYSTEM";
  replyToId?: string | null;
}

// CREATE — murni insert tanpa validasi/otorisasi (dicek di actions/).
export async function createMessage(data: CreateMessageInput) {
  return prisma.projectMessage.create({
    data: {
      projectId: data.projectId,
      userId: data.userId,
      content: data.content,
      kind: data.kind ?? "USER",
      replyToId: data.replyToId ?? null,
    },
    select: chatMessageSelectFor(data.projectId),
  });
}

// READ — halaman terbaru (50 pesan, urut chronologis; flag = masih ada lebih lama).
export async function findLatestMessages(projectId: string) {
  const rows = await prisma.projectMessage.findMany({
    where: { projectId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: CHAT_PAGE_SIZE + 1,
    select: chatMessageSelectFor(projectId),
  });
  const hasMoreBefore = rows.length > CHAT_PAGE_SIZE;
  const page = hasMoreBefore ? rows.slice(0, CHAT_PAGE_SIZE) : rows;
  // Kembalikan chronologis (asc) agar langsung dirender urut.
  return { messages: page.reverse(), hasMoreBefore };
}

// READ — pesan LEBIH BARU dari cursor (polling `after`), urut asc.
export async function findMessagesAfter(
  projectId: string,
  afterId: string,
  limit = CHAT_PAGE_SIZE
): Promise<ChatMessageRow[] | null> {
  const cursor = await prisma.projectMessage.findUnique({
    where: { id: afterId },
    select: { projectId: true },
  });
  // Cursor harus milik project yang sama — tolak id asing.
  if (!cursor || cursor.projectId !== projectId) return null;
  return prisma.projectMessage.findMany({
    where: { projectId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    cursor: { id: afterId },
    skip: 1,
    take: limit,
    select: chatMessageSelectFor(projectId),
  });
}

// READ — pesan LEBIH TUA dari cursor (lazy load ke atas).
// Urut desc dari cursor supaya Prisma mengambil yang lebih lama, lalu dibalik
// agar chronologis (asc) saat dirender.
export async function findMessagesBefore(
  projectId: string,
  beforeId: string
): Promise<{ messages: ChatMessageRow[]; hasMoreBefore: boolean } | null> {
  const cursor = await prisma.projectMessage.findUnique({
    where: { id: beforeId },
    select: { projectId: true },
  });
  if (!cursor || cursor.projectId !== projectId) return null;
  const rows = await prisma.projectMessage.findMany({
    where: { projectId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    cursor: { id: beforeId },
    skip: 1,
    take: CHAT_PAGE_SIZE + 1,
    select: chatMessageSelectFor(projectId),
  });
  const hasMoreBefore = rows.length > CHAT_PAGE_SIZE;
  const page = hasMoreBefore ? rows.slice(0, CHAT_PAGE_SIZE) : rows;
  return { messages: page.reverse(), hasMoreBefore };
}

// READ — pesan by id + project (untuk cek balasan/kepemilikan di actions/).
export async function findMessageById(projectId: string, messageId: string) {
  return prisma.projectMessage.findFirst({
    where: { id: messageId, projectId },
    select: chatMessageSelectFor(projectId),
  });
}

// READ — pesan tersemat project (hanya yang belum dihapus).
export async function findPinnedMessage(projectId: string) {
  return prisma.projectMessage.findFirst({
    where: { projectId, pinnedAt: { not: null }, deletedAt: null },
    orderBy: { pinnedAt: "desc" },
    select: chatMessageSelectFor(projectId),
  });
}

// UPDATE — sematkan pesan; hanya satu pesan tersemat per project, jadi pesan
// lama dilepas dulu dalam satu transaksi.
export async function pinMessageExclusive(projectId: string, messageId: string) {
  return prisma.$transaction([
    prisma.projectMessage.updateMany({
      where: { projectId, pinnedAt: { not: null }, id: { not: messageId } },
      data: { pinnedAt: null },
    }),
    prisma.projectMessage.update({
      where: { id: messageId },
      data: { pinnedAt: new Date() },
    }),
  ]);
}

export async function unpinMessage(messageId: string) {
  return prisma.projectMessage.update({
    where: { id: messageId },
    data: { pinnedAt: null },
  });
}

// SOFT DELETE — jejak "Pesan ini dihapus" tetap tampil; lepas sematan bila
// pesan yang dihapus kebetulan sedang tersemat.
export async function softDeleteMessage(messageId: string) {
  return prisma.projectMessage.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), pinnedAt: null },
  });
}

// READ — anggota project (id, nama, avatar, role) untuk header + popup mention.
export async function findChatMembers(projectId: string) {
  return prisma.projectMember.findMany({
    where: { projectId },
    orderBy: { joinedAt: "asc" },
    select: chatMemberSelect,
  });
}

// UPDATE — tandai chat dibaca: lastReadAt = now().
export async function markChatRead(userId: string, projectId: string) {
  return prisma.projectMember.update({
    where: { userId_projectId: { userId, projectId } },
    data: { lastReadAt: new Date() },
  });
}

// READ — "titik baca" user di project: coalesce(lastReadAt, joinedAt).
// Menentukan posisi divider "Pesan belum dibaca" saat chat dibuka.
export async function findMemberReadAnchor(
  userId: string,
  projectId: string
): Promise<Date | null> {
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { lastReadAt: true, joinedAt: true },
  });
  if (!member) return null;
  return member.lastReadAt ?? member.joinedAt;
}

// READ — minimal "titik baca" anggota LAIN (untuk read-receipt ✓✓).
export async function findOthersMinLastReadAt(
  projectId: string,
  userId: string
): Promise<Date | null> {
  const others = await prisma.projectMember.findMany({
    where: { projectId, userId: { not: userId } },
    select: { lastReadAt: true, joinedAt: true },
  });
  let min: Date | null = null;
  for (const other of others) {
    const anchor = other.lastReadAt ?? other.joinedAt;
    if (!min || anchor < min) min = anchor;
  }
  return min;
}

// ===== Ringkasan Diskusi (semua project user) =====

export interface DiscussionLastMessage {
  projectId: string;
  id: string;
  content: string;
  kind: string; // "USER" | "SYSTEM"
  createdAt: Date;
  deletedAt: Date | null;
  authorName: string;
}

/**
 * Jumlah pesan belum dibaca per project untuk SATU user dalam SATU query
 * agregat (tanpa loop per project). "Belum dibaca" = pesan USER milik orang
 * lain, belum dihapus, createdAt > COALESCE(lastReadAt, joinedAt).
 * Kolom deletedAt difilter eksplisit (jangan andalkan ekstensi soft-delete).
 */
export async function countUnreadChatByProject(
  userId: string
): Promise<Map<string, number>> {
  const rows = await prisma.$queryRaw<{ projectId: string; unread: number }[]>`
    SELECT pm."projectId" AS "projectId", COUNT(m."id")::int AS "unread"
    FROM "ProjectMember" pm
    JOIN "Project" p ON p."id" = pm."projectId" AND p."deletedAt" IS NULL
    LEFT JOIN "ProjectMessage" m
      ON m."projectId" = pm."projectId"
     AND m."userId" <> pm."userId"
     AND m."kind" = 'USER'
     AND m."deletedAt" IS NULL
     AND m."createdAt" > COALESCE(pm."lastReadAt", pm."joinedAt")
    WHERE pm."userId" = ${userId}
    GROUP BY pm."projectId"
  `;
  return new Map(rows.map((row) => [row.projectId, row.unread]));
}

/**
 * Pesan terakhir tiap project yang diikuti user, dalam SATU query (DISTINCT
 * ON). Termasuk pesan terhapus (pratinjau menampilkan "Pesan ini dihapus").
 */
export async function findLastMessagePerProject(
  userId: string
): Promise<
  {
    projectId: string;
    id: string;
    content: string;
    kind: string;
    createdAt: Date;
    deletedAt: Date | null;
    authorName: string;
  }[]
> {
  return prisma.$queryRaw<
    {
      projectId: string;
      id: string;
      content: string;
      kind: string;
      createdAt: Date;
      deletedAt: Date | null;
      authorName: string;
    }[]
  >`
    SELECT DISTINCT ON (m."projectId")
      m."projectId" AS "projectId",
      m."id" AS "id",
      m."content" AS "content",
      m."kind" AS "kind",
      m."createdAt" AS "createdAt",
      m."deletedAt" AS "deletedAt",
      u."name" AS "authorName"
    FROM "ProjectMessage" m
    JOIN "User" u ON u."id" = m."userId"
    JOIN "ProjectMember" pm ON pm."projectId" = m."projectId" AND pm."userId" = ${userId}
    JOIN "Project" p ON p."id" = m."projectId" AND p."deletedAt" IS NULL
    ORDER BY m."projectId", m."createdAt" DESC
  `;
}

export type { ChatMessageRow };
export type ChatMemberRow = Prisma.ProjectMemberGetPayload<{
  select: typeof chatMemberSelect;
}>;