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
import { logActivity } from "@/lib/activity";
import {
  sendMessageSchema,
  messageIdSchema,
  chatReadSchema,
} from "@/lib/validations/message.schema";
import {
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
import { prisma } from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });

// Lampiran yang lebih tua dari 2 jam tidak boleh diikat ke pesan baru.
const ATTACHMENT_MAX_AGE_HOURS = 2;

// KIRIM PESAN — semua anggota boleh kirim; rate limit 30 pesan/menit/user;
// replyToId wajib milik project yang sama dan belum dihapus.
// attachmentIds: lampiran yang sudah diunggah (messageId null) akan diikat ke
// pesan dalam satu transaksi. File-only (tanpa teks) diizinkan.
export async function sendMessageAction(input: {
  projectId: string;
  content?: string;
  replyToId?: string;
  attachmentIds?: string[];
}): Promise<
  { success: true; message: ChatMessage } | { error: unknown; status?: number }
> {
  const guard = await requireProjectMember(input?.projectId ?? "");
  if ("error" in guard) return { error: guard.error, status: guard.status };
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
  const { projectId, content, replyToId, attachmentIds } = parsed.data;

  const finalContent = content ?? "";

  if (replyToId) {
    const target = await findMessageById(projectId, replyToId);
    if (!target || target.deletedAt) {
      return { error: "Pesan yang dibalas tidak ditemukan" };
    }
  }

  // Verifikasi lampiran: milik user ini, project yang sama, belum diikat ke
  // pesan, belum dihapus, dan dibuat dalam 2 jam terakhir.
  let attachmentNames: string[] = [];
  if (attachmentIds && attachmentIds.length > 0) {
    const cutoff = new Date(Date.now() - ATTACHMENT_MAX_AGE_HOURS * 60 * 60 * 1000);
    const attachments = await prisma.attachment.findMany({
      where: {
        id: { in: attachmentIds },
        uploadedById: guard.user.id,
        projectId,
        messageId: null,
        deletedAt: null,
        createdAt: { gte: cutoff },
      },
      select: { id: true, name: true },
    });
    if (attachments.length !== attachmentIds.length) {
      return { error: "Lampiran tidak valid" };
    }
    attachmentNames = attachments.map((a) => a.name);
  }

  // Buat pesan dan ikat lampiran dalam SATU transaksi.
  const created = await prisma.$transaction(async (tx) => {
    // Hanya butuh id untuk mengikat lampiran; select penuh dilakukan setelah
    // lampiran terikat agar relasi attachments tidak kosong.
    const message = await tx.projectMessage.create({
      data: {
        projectId,
        userId: guard.user.id,
        content: finalContent,
        kind: "USER",
        replyToId: replyToId ?? null,
      },
      select: { id: true },
    });

    if (attachmentIds && attachmentIds.length > 0) {
      await tx.attachment.updateMany({
        where: { id: { in: attachmentIds }, messageId: null },
        data: { messageId: message.id },
      });
    }

    return message;
  });

  // Ambil ulang pesan dengan lampiran terikat agar respons ke client tidak kosong
  // (select create di atas memiliki relasi attachments masih kosong).
  const createdWithAttachments = await findMessageById(projectId, created.id);
  if (!createdWithAttachments) {
    return { error: "Gagal membuat pesan" };
  }

  // MENTION — ekstrak token `@[userId]`, verifikasi, satu notifikasi per user.
  try {
    const mentionedIds = extractMentionIds(finalContent);
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
            messageId: createdWithAttachments.id,
          }))
        );
      }
    }
  } catch (error) {
    console.error("[message] gagal notifikasi MENTION:", error);
  }

  // Aktivitas: catat FILE_UPLOADED sekali per pesan yang menyertakan lampiran.
  // Kegagalan logging TIDAK menggagalkan pengiriman pesan.
  if (attachmentIds && attachmentIds.length > 0) {
    const displayNames =
      attachmentNames.length > 3
        ? [...attachmentNames.slice(0, 3), `dan ${attachmentNames.length - 3} lainnya`]
        : attachmentNames;
    try {
      await logActivity({
        userId: guard.user.id,
        projectId,
        taskId: null,
        action: "FILE_UPLOADED",
        meta: {
          count: attachmentIds.length,
          names: displayNames,
        },
      });
    } catch (err) {
      console.error("[message] gagal menulis ActivityLog FILE_UPLOADED:", err);
    }
  }

  revalidatePath("/diskusi");

  return { success: true as const, message: toChatMessageDTO(createdWithAttachments) };
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

  // Ambil kunci file lampiran sebelum soft-delete (untuk hapus di UT).
  const attachmentRows = await prisma.attachment.findMany({
    where: { messageId: parsed.data.messageId, deletedAt: null },
    select: { key: true },
  });

  await softDeleteMessage(parsed.data.messageId);
  await prisma.attachment.updateMany({
    where: { messageId: parsed.data.messageId, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  // Hapus file di UploadThing (best effort, di luar transaksi DB).
  const keys = attachmentRows.map((a) => a.key);
  if (keys.length > 0) {
    void utapi.deleteFiles(keys).catch((err) => {
      console.error("[message] gagal menghapus file UploadThing:", err);
    });
  }

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
