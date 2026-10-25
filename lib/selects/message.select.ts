import type { Prisma } from "@/app/generated/prisma/client";
import type { ChatMessage, ProjectRole } from "@/types";
import { toAttachmentDTO } from "./attachment.select";

/**
 * Select eksplisit untuk Diskusi: pesan + penulis (dengan role-nya DI project
 * ini) + pratinjau balasan (replyTo) + lampiran. Field sensitif tidak ikut
 * ter-expose.
 *
 * Karena role menempel di ProjectMember (bukan User), select ini dibuat per
 * project lewat `chatMessageSelectFor` agar role yang dikirim ke client adalah
 * role di project itu, bukan gabungan semua keanggotaan.
 */
export function chatMessageSelectFor(projectId: string) {
  return {
    id: true,
    kind: true,
    content: true,
    pinnedAt: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    replyToId: true,
    user: {
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        memberships: {
          select: { role: true },
          where: { projectId },
        },
      },
    },
    replyTo: {
      select: {
        id: true,
        content: true,
        deletedAt: true,
        createdAt: true,
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    },
    attachments: {
      where: { deletedAt: null },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        url: true,
        size: true,
        mimeType: true,
        createdAt: true,
      },
    },
  } satisfies Prisma.ProjectMessageSelect;
}

export type ChatMessageRow = Prisma.ProjectMessageGetPayload<{
  select: ReturnType<typeof chatMessageSelectFor>;
}>;

/** Select ringkas anggota (id, nama, avatar, role) untuk header + popup mention. */
export const chatMemberSelect = {
  userId: true,
  role: true,
  user: { select: { id: true, name: true, avatarUrl: true } },
} satisfies Prisma.ProjectMemberSelect;

/**
 * Map baris Prisma ke DTO aman-serial untuk client (ISOString, tanpa field
 * sensitif). Dipakai oleh actions/message dan GET route polling.
 */
export function toChatMessageDTO(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    kind: row.kind,
    content: row.content,
    pinned: row.pinnedAt !== null,
    createdAt: row.createdAt.toISOString(),
    deleted: row.deletedAt !== null,
    author: {
      id: row.user.id,
      name: row.user.name,
      avatarUrl: row.user.avatarUrl,
      // memberships sudah dibatasi where projectId oleh chatMessageSelectFor.
      role: (row.user.memberships[0]?.role ?? "MEMBER") as ProjectRole,
    },
    replyTo: row.replyTo
      ? {
          id: row.replyTo.id,
          content: row.replyTo.content,
          deleted: row.replyTo.deletedAt !== null,
          authorName: row.replyTo.user.name,
          createdAt: row.replyTo.createdAt.toISOString(),
        }
      : null,
    attachments: (row.attachments ?? []).map(toAttachmentDTO),
  };
}