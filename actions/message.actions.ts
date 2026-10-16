"use server";

import { revalidatePath } from "next/cache";
import { requireProjectMember } from "@/lib/auth-guards";
import {
  canBeMentioned,
  canPinChatMessage,
  canDeleteChatMessage,
  canSendChatMessage,
} from "@/lib/permissions";
import { checkRateLimit } from "@/lib/rate-limit";
import { extractMentionIds } from "@/lib/mentions";
import {
  sendMessageSchema,
  messageIdSchema,
  chatReadSchema,
} from "@/lib/validations/message.schema";
import {
  createMessage,
  findMessageById,
  findChatMembers,
  pinMessageExclusive,
  unpinMessage,
  softDeleteMessage,
  markChatRead,
} from "@/repositories/message.repository";
import {
  createManyNotifications,
  markChatMentionsRead,
} from "@/repositories/notification.repository";
import { toChatMessageDTO } from "@/lib/selects/message.select";
import type { ChatMessage } from "@/types";

// KIRIM PESAN — semua anggota boleh kirim; rate limit 30 pesan/menit/user;
// replyToId wajib milik project yang sama dan belum dihapus.
export async function sendMessageAction(input: {
  projectId: string;
  content: string;
  replyToId?: string;
}): Promise<
  { success: true; message: ChatMessage } | { error: unknown; status?: number }
> {
  const guard = await requireProjectMember(input?.projectId ?? "");
  if ("error" in guard) return { error: guard.error, status: guard.status };
  // Matriks izin 8.2: semua anggota aktif project boleh mengirim pesan
  // Diskusi; VIEWER hanya membaca.
  if (!canSendChatMessage(guard.membership.role)) {
    return { error: "Kamu hanya bisa melihat project ini", status: 403 as const };
  }

  const rateLimit = checkRateLimit(`chat:${guard.user.id}`, 30, 60_000);
  if (!rateLimit.allowed) {
    return { error: "Terlalu banyak pesan. Tunggu sebentar lalu kirim lagi." };
  }

  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const { projectId, content, replyToId } = parsed.data;

  if (replyToId) {
    const target = await findMessageById(projectId, replyToId);
    if (!target || target.deletedAt) {
      return { error: "Pesan yang dibalas tidak ditemukan" };
    }
  }

  const created = await createMessage({
    projectId,
    userId: guard.user.id,
    content,
    replyToId: replyToId ?? null,
  });

  // MENTION — ekstrak token `@[userId]`, verifikasi masih anggota project yang
  // sama (token client tidak dipercaya) dan bukan VIEWER (canBeMentioned),
  // lalu satu notifikasi per user per pesan. Kegagalan notifikasi TIDAK
  // menggagalkan pesan tersimpan.
  try {
    const mentionedIds = extractMentionIds(content);
    if (mentionedIds.length > 0) {
      const memberRows = await findChatMembers(projectId);
      const mentionableIds = new Set(
        memberRows
          .filter((m) => canBeMentioned(m.role))
          .map((m) => m.userId)
      );
      const targetIds = mentionedIds.filter(
        (id) => mentionableIds.has(id) && id !== guard.user.id
      );
      if (targetIds.length > 0) {
        await createManyNotifications(
          targetIds.map((userId) => ({
            type: "MENTION" as const,
            userId,
            actorId: guard.user.id,
            projectId,
            messageId: created.id,
          }))
        );
      }
    }
  } catch (error) {
    console.error("[message] gagal notifikasi MENTION:", error);
  }

  revalidatePath("/diskusi");
  return { success: true as const, message: toChatMessageDTO(created) };
}

// HAPUS PESAN — soft delete; pembuat pesan sendiri, atau ADMIN untuk moderasi.
export async function deleteMessageAction(input: {
  projectId: string;
  messageId: string;
}): Promise<{ success: true } | { error: unknown; status?: number }> {
  const guard = await requireProjectMember(input?.projectId ?? "");
  if ("error" in guard) return { error: guard.error, status: guard.status };

  const parsed = messageIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Pesan tidak valid" };
  }

  const message = await findMessageById(
    parsed.data.projectId,
    parsed.data.messageId
  );
  if (!message || message.deletedAt) {
    return { error: "Pesan tidak ditemukan" };
  }

  const isOwn = message.user.id === guard.user.id;
  if (!canDeleteChatMessage(guard.membership.role, isOwn)) {
    return {
      error: isOwn
        ? "Kamu hanya bisa menghapus pesan sendiri"
        : "Hanya admin yang boleh menghapus pesan orang lain",
      status: 403 as const,
    };
  }

  await softDeleteMessage(parsed.data.messageId);
  revalidatePath("/diskusi");
  return { success: true as const };
}

// SEMATKAN — hanya ADMIN dan MANAGER; satu pesan tersemat per project,
// pesan lama otomatis dilepas dalam transaksi yang sama.
export async function pinMessageAction(input: {
  projectId: string;
  messageId: string;
}): Promise<{ success: true } | { error: unknown; status?: number }> {
  const guard = await requireProjectMember(input?.projectId ?? "");
  if ("error" in guard) return { error: guard.error, status: guard.status };
  if (!canPinChatMessage(guard.membership.role)) {
    return {
      error: "Hanya admin dan manager yang boleh menyematkan pesan",
      status: 403 as const,
    };
  }

  const parsed = messageIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Pesan tidak valid" };
  }

  const message = await findMessageById(
    parsed.data.projectId,
    parsed.data.messageId
  );
  if (!message || message.deletedAt) {
    return { error: "Pesan tidak ditemukan" };
  }

  await pinMessageExclusive(parsed.data.projectId, parsed.data.messageId);
  revalidatePath("/diskusi");
  return { success: true as const };
}

// LEPAS SEMATAN — role sama dengan menyematkan.
export async function unpinMessageAction(input: {
  projectId: string;
  messageId: string;
}): Promise<{ success: true } | { error: unknown; status?: number }> {
  const guard = await requireProjectMember(input?.projectId ?? "");
  if ("error" in guard) return { error: guard.error, status: guard.status };
  if (!canPinChatMessage(guard.membership.role)) {
    return {
      error: "Hanya admin dan manager yang boleh melepas sematan pesan",
      status: 403 as const,
    };
  }

  const parsed = messageIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Pesan tidak valid" };
  }

  const message = await findMessageById(
    parsed.data.projectId,
    parsed.data.messageId
  );
  if (!message) {
    return { error: "Pesan tidak ditemukan" };
  }

  await unpinMessage(parsed.data.messageId);
  revalidatePath("/diskusi");
  return { success: true as const };
}

// TANDAI CHAT DIBACA — lastReadAt = now(); notifikasi mention chat di project
// ini ikut ditandai dibaca (membuka chat = membaca mention di dalamnya).
export async function markChatReadAction(input: {
  projectId: string;
}): Promise<{ success: true } | { error: unknown; status?: number }> {
  const guard = await requireProjectMember(input?.projectId ?? "");
  if ("error" in guard) return { error: guard.error, status: guard.status };

  const parsed = chatReadSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Project tidak valid" };
  }

  await markChatRead(guard.user.id, parsed.data.projectId);
  await markChatMentionsRead(guard.user.id, parsed.data.projectId);
  revalidatePath("/inbox");
  return { success: true as const };
}
