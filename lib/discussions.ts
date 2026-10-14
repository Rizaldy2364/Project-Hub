import { extractMentionIds } from "@/lib/mentions";
import {
  countUnreadChatByProject,
  findLastMessagePerProject,
} from "@/repositories/message.repository";
import { findProjectOptionsByUserId } from "@/repositories/project.repository";
import { prisma } from "@/lib/prisma";
import type { DiscussionSummaryItem } from "@/types";

/**
 * Ringkasan Diskusi untuk semua project yang diikuti user: pesan terakhir
 * (token mention sudah dirender jadi @Nama) + jumlah belum dibaca, urut
 * aktivitas terakhir. Dipakai halaman /diskusi dan GET /api/discussions/summary.
 */
export async function getDiscussionSummaries(
  userId: string
): Promise<DiscussionSummaryItem[]> {
  const [projects, lastMessages, unreadMap] = await Promise.all([
    findProjectOptionsByUserId(userId),
    findLastMessagePerProject(userId),
    countUnreadChatByProject(userId),
  ]);

  // Render token `@[userId]` -> `@Nama` (fallback "@pengguna") untuk pratinjau.
  const mentionIds = new Set<string>();
  for (const msg of lastMessages) {
    for (const id of extractMentionIds(msg.content)) mentionIds.add(id);
  }
  const nameById = new Map<string, string>();
  if (mentionIds.size > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: [...mentionIds] } },
      select: { id: true, name: true },
    });
    for (const user of users) nameById.set(user.id, user.name);
  }
  const renderPreview = (content: string) =>
    content.replace(/@\[([^\]]+)\]/g, (_, id: string) =>
      `@${nameById.get(id) ?? "pengguna"}`
    );

  const lastByProject = new Map(lastMessages.map((m) => [m.projectId, m]));

  const items = projects.map<DiscussionSummaryItem>((project) => {
    const last = lastByProject.get(project.id);
    return {
      projectId: project.id,
      name: project.name,
      lastMessage: last
        ? {
            authorName: last.authorName,
            text:
              last.deletedAt !== null
                ? "Pesan ini dihapus"
                : renderPreview(last.content),
            kind: last.kind === "SYSTEM" ? "SYSTEM" : "USER",
            deleted: last.deletedAt !== null,
            createdAt: last.createdAt.toISOString(),
          }
        : null,
      unreadCount: unreadMap.get(project.id) ?? 0,
    };
  });

  // Urut: aktivitas terakhir dulu; project tanpa pesan ada di belakang, lalu
  // nama A–Z supaya stabil.
  return items.sort((a, b) => {
    const at = a.lastMessage?.createdAt ?? null;
    const bt = b.lastMessage?.createdAt ?? null;
    if (at && bt) {
      if (at !== bt) return at < bt ? 1 : -1;
      return a.name.localeCompare(b.name);
    }
    if (at && !bt) return -1;
    if (!at && bt) return 1;
    return a.name.localeCompare(b.name);
  });
}