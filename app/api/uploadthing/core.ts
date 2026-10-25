import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { UTApi } from "uploadthing/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { updateUser } from "@/repositories/user.repository";
import { findProjectMember } from "@/repositories/project.repository";
import { canSendChatMessage } from "@/lib/permissions";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAttachment } from "@/repositories/attachment.repository";
import { prisma } from "@/lib/prisma";

const f = createUploadthing();

const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });

// ===== Allowlist lampiran chat (MIME type + ekstensi) =====
// Diizinkan: gambar (png/jpg/jpeg/webp/gif), pdf, txt, csv, docx, xlsx, pptx, zip.
// Ditolak: svg, html/htm, js, mjs, ts, exe, bat, cmd, sh, ps1, jar, msi, apk
// dan apa pun di luar allowlist.
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.sheet",
  "application/zip",
]);

const ALLOWED_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "pdf",
  "txt",
  "csv",
  "docx",
  "xlsx",
  "pptx",
  "zip"],
);

function getFileExtension(name: string): string | null {
  const dot = name.lastIndexOf(".");
  if (dot === -1 || dot === 0 || dot === name.length - 1) return null;
  return name.slice(dot + 1).toLowerCase();
}

function isAllowedFile(file: { name: string; type: string; size: number }): boolean {
  const ext = getFileExtension(file.name);
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) return false;
  if (!ALLOWED_MIME_TYPES.has(file.type)) return false;
  return file.size <= 8 * 1024 * 1024; // 8 MB
}

/** Sapih nama file: hapus pemisah path & karakter kontrol, maks 120 karakter. */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[\/\\:*?\"<>||\x00-\x1f]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export const ourFileRouter = {
  profileImageUploader: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session) throw new UploadThingError("Unauthorized");

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await updateUser(metadata.userId, { avatarUrl: file.url });
      return { avatarUrl: file.url };
    }),

  // Lampiran chat Diskusi (project message). Input: { projectId }.
  chatAttachment: f({
    blob: { maxFileSize: "8MB", maxFileCount: 5 },
  })
    .input(
      z.object({
        projectId: z.string().cuid(),
      })
    )
    .middleware(async ({ files, input }) => {
      const session = await auth();
      if (!session) throw new UploadThingError("Unauthorized");

      const { projectId } = input;

      // Project harus ada dan belum soft-delete.
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { deletedAt: true },
      });
      if (!project || project.deletedAt !== null) {
        throw new UploadThingError("Project tidak ditemukan atau sudah dihapus");
      }

      // Wajib anggota project.
      const membership = await findProjectMember(session.user.id, projectId);
      if (!membership) {
        throw new UploadThingError("Kamu bukan member project ini");
      }

      // Izin kirim pesan/lampiran: ADMIN, MANAGER, MEMBER (bukan VIEWER).
      if (!canSendChatMessage(membership.role)) {
        throw new UploadThingError("Kamu tidak boleh mengirim lampiran di project ini");
      }

      // Rate limit: 20 file per menit per user.
      const rateLimit = checkRateLimit(
        `chat-attach:${session.user.id}`,
        20,
        60_000
      );
      if (!rateLimit.allowed) {
        throw new UploadThingError(
          "Terlalu banyak lampiran. Tunggu sebentar lalu coba lagi."
        );
      }

      // Validasi daftar file (client-side dihormati, server tetap menegakkan).
      for (const file of files) {
        if (!isAllowedFile(file)) {
          throw new UploadThingError(`Tipe file tidak diizinkan: ${file.name}`);
        }
      }

      return {
        userId: session.user.id,
        projectId,
        files,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Validasi ulang setiap file di sisi server (selalu, tidak andal ke klien).
      if (!isAllowedFile(file)) {
        try {
          await utapi.deleteFiles(file.key);
        } catch (err) {
          console.error("[uploadthing] gagal menghapus file tidak diizinkan:", err);
        }
        return;
      }

      // Bataskan maks 5 file per request.
      const allFiles = (metadata.files as { name: string; type: string; size: number }[] | undefined) ?? [];
      if (allFiles.length > 5) {
        try {
          await utapi.deleteFiles(file.key);
        } catch (err) {
          console.error("[uploadthing] gagal menghapus file melebihi batas:", err);
        }
        return;
      }

      const attachment = await createAttachment({
        projectId: metadata.projectId,
        messageId: null, // "pending" — belum diikat ke pesan
        uploadedById: metadata.userId,
        name: sanitizeFileName(file.name),
        url: file.url,
        key: file.key,
        size: file.size,
        mimeType: file.type,
      });

      return { attachmentId: attachment.id };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
