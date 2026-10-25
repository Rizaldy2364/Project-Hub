"use client";

import { useState } from "react";
import { Clock, File, Image as ImageIcon, Pin, PinOff, Reply, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { splitMentions } from "@/lib/mentions";
import { formatChatTime, senderColorClass } from "@/components/chat/chat-utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ChatMember, ChatMessage } from "@/types";

interface MessageBubbleProps {
  message: ChatMessage;
  own: boolean;
  /** Tampilkan nama + avatar (pesan pertama dari grup berurutan). */
  showHeader: boolean;
  /** Tanda centang: pesan sudah dilihat anggota lain (read-receipt). */
  readByOthers: boolean;
  canPin: boolean;
  canDelete: boolean;
  members: ChatMember[];
  highlighted?: boolean;
  onReply: (message: ChatMessage) => void;
  onPinToggle: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  /** Kirim ulang pesan gagal (optimistic tetap di daftar, teks tidak hilang). */
  onRetry?: (message: ChatMessage) => void;
  /** Buang pesan gagal dari daftar. */
  onDiscard?: (message: ChatMessage) => void;
}

/** Render teks pesan; token `@[userId]` menjadi @Nama (fallback @pengguna). */
function MessageContent({
  content,
  members,
}: {
  content: string;
  members: ChatMember[];
}) {
  const nameById = new Map(members.map((m) => [m.id, m.name]));
  return (
    <span className="whitespace-pre-wrap break-words">
      {splitMentions(content).map((part, i) =>
        part.type === "mention" ? (
          <span
            key={i}
            className="rounded bg-blue-500/20 px-0.5 font-semibold text-blue-700 dark:text-[#8FAAFF]"
          >
            {`@${nameById.get(part.userId) ?? "pengguna"}`}
          </span>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </span>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessageBubble({
  message,
  own,
  showHeader,
  readByOthers,
  canPin,
  canDelete,
  members,
  highlighted = false,
  onReply,
  onPinToggle,
  onDelete,
  onRetry,
  onDiscard,
}: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Pesan terhapus: jejak "Pesan ini dihapus" tanpa isi, aksi disembunyikan.
  if (message.deleted) {
    return (
      <div
        data-message-id={message.id}
        className={cn(
          "group relative flex",
          own ? "justify-end" : "justify-start",
          highlighted && "rounded-xl bg-amber-500/10 ring-2 ring-amber-400/60"
        )}
      >
        <div className="max-w-[75%] rounded-2xl bg-slate-100 px-3 py-1.5 text-sm italic text-slate-500 dark:bg-[#1B2438] dark:text-[#8B96AD]">
          Pesan ini dihapus
        </div>
      </div>
    );
  }

  return (
    <div
      data-message-id={message.id}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group relative flex items-end gap-2",
        own ? "justify-end" : "justify-start",
        highlighted && "rounded-xl bg-amber-500/10 ring-2 ring-amber-400/60"
      )}
    >
      {!own && (
        <div className="w-7 shrink-0 self-start">
          {showHeader && (
            <UserAvatar
              name={message.author.name}
              image={message.author.avatarUrl}
              size="sm"
              className="h-7 w-7 text-[10px]"
            />
          )}
        </div>
      )}

      {/* Action bar hover/focus — ikon saja, tanpa dropdown. */}
      <div
        className={cn(
          "absolute -top-3 z-10 flex items-center gap-0.5 rounded-full border border-slate-200 bg-white p-0.5 shadow-sm transition-opacity dark:border-white/[0.08] dark:bg-[#131A2B]",
          own ? "right-0" : "left-9",
          hovered ? "opacity-100" : "pointer-events-none opacity-0",
          "focus-within:opacity-100"
        )}
      >
        <button
          type="button"
          aria-label="Balas"
          onClick={() => onReply(message)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-[#8B96AD] dark:hover:bg-[#1B2438] dark:hover:text-[#E6EAF2]"
        >
          <Reply className="h-3.5 w-3.5" />
        </button>
        {canPin && (
          <button
            type="button"
            aria-label={message.pinned ? "Lepas sematan" : "Sematkan"}
            onClick={() => onPinToggle(message)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-[#8B96AD] dark:hover:bg-[#1B2438] dark:hover:text-[#E6EAF2]"
          >
            {message.pinned ? (
              <PinOff className="h-3.5 w-3.5" />
            ) : (
              <Pin className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        {canDelete && (
          <ConfirmDialog
            title="Hapus pesan?"
            message="Pesan ini akan ditandai terhapus untuk semua anggota project."
            confirmLabel="Hapus"
            cancelLabel="Batal"
            confirmClassName="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            action={() => onDelete(message)}
          >
            <button
              type="button"
              aria-label="Hapus"
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-[#8B96AD] dark:hover:bg-red-500/10 dark:hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </ConfirmDialog>
        )}
      </div>

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
          own
            ? "rounded-br-md bg-[#3B66EE] text-white"
            : "rounded-bl-md bg-slate-100 text-slate-900 dark:bg-[#1B2438] dark:text-[#E6EAF2]",
          message.pending && "opacity-70"
        )}
      >
        {!own && showHeader && (
          <p
            className={cn(
              "mb-0.5 text-xs font-semibold",
              senderColorClass(message.author.id)
            )}
          >
            {message.author.name}
          </p>
        )}

        {/* Kutipan balasan */}
        {message.replyTo && (
          <div
            className={cn(
              "mb-1 rounded-md border-l-2 py-0.5 pl-2 text-xs",
              own
                ? "border-white/60 bg-white/10 text-white/90"
                : "border-blue-400 bg-black/5 text-slate-600 dark:border-[#8FAAFF] dark:bg-white/5 dark:text-[#8B96AD]"
            )}
          >
            <p className="font-semibold">
              {message.replyTo.deleted
                ? "Pesan ini dihapus"
                : message.replyTo.authorName}
            </p>
            <p className="line-clamp-2">
              {message.replyTo.deleted
                ? "Pesan ini dihapus"
                : message.replyTo.content}
            </p>
          </div>
        )}

        {/* Lampiran (foto / file) ditampilkan di atas teks */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2">
            {/* Gambar: 1 kolom bila hanya 1 gambar, atau 2 kolom bila lebih */}
            {message.attachments.some((a) => a.isImage) && (
              <div
                className={cn(
                  "gap-1.5",
                  message.attachments.filter((a) => a.isImage).length === 1
                    ? "grid grid-cols-1"
                    : "grid grid-cols-2"
                )}
              >
                {message.attachments
                  .filter((a) => a.isImage)
                  .map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setLightboxUrl(a.url)}
                      className="overflow-hidden rounded-lg"
                    >
                      <img
                        src={a.url}
                        alt={a.name}
                        className={cn(
                          "w-full object-cover",
                          message.attachments.filter((a) => a.isImage).length === 1
                            ? "max-h-60"
                            : "h-32"
                        )}
                        loading="lazy"
                      />
                    </button>
                  ))}
              </div>
            )}
            {/* File non-gambar */}
            {message.attachments
              .filter((a) => !a.isImage)
              .map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                    own
                      ? "border-white/20 bg-white/10 hover:bg-white/20 text-white"
                      : "border-slate-200 bg-white/60 hover:bg-white text-slate-800 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-100"
                  )}
                >
                  <File className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{a.name}</span>
                  <span className="shrink-0 text-[10px] opacity-70">
                    {formatFileSize(a.size)}
                  </span>
                </a>
              ))}
          </div>
        )}

        {/* Teks pesan berada di bawah lampiran */}
        {message.content && (
          <div
            className={cn(
              message.attachments && message.attachments.length > 0 && "mt-1.5"
            )}
          >
            <MessageContent content={message.content} members={members} />
            <span
              className={cn(
                "ml-2 inline-flex translate-y-[2px] items-center gap-1 text-xs leading-none",
                own ? "text-white/80" : "text-slate-400 dark:text-[#8B96AD]"
              )}
            >
              {formatChatTime(message.createdAt)}
              {own && message.kind === "USER" && message.pending && (
                <span
                  role="img"
                  aria-label="Mengirim"
                  className="inline-flex items-center gap-0.5"
                >
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                </span>
              )}
              {own && message.kind === "USER" && !message.pending && !message.failed && (
                <span role="img" aria-label={readByOthers ? "Dibaca" : "Terkirim"}>
                  {readByOthers ? "✓✓" : "✓"}
                </span>
              )}
              {own && message.kind === "USER" && message.failed && (
                <span role="img" aria-label="Gagal terkirim">
                  !
                </span>
              )}
            </span>
          </div>
        )}

        {/* Timestamp jika pesan hanya berupa lampiran tanpa teks */}
        {!message.content && (
          <div className="mt-1 flex justify-end">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs leading-none",
                own ? "text-white/80" : "text-slate-400 dark:text-[#8B96AD]"
              )}
            >
              {formatChatTime(message.createdAt)}
              {own && message.kind === "USER" && message.pending && (
                <span
                  role="img"
                  aria-label="Mengirim"
                  className="inline-flex items-center gap-0.5"
                >
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                </span>
              )}
              {own && message.kind === "USER" && !message.pending && !message.failed && (
                <span role="img" aria-label={readByOthers ? "Dibaca" : "Terkirim"}>
                  {readByOthers ? "✓✓" : "✓"}
                </span>
              )}
              {own && message.kind === "USER" && message.failed && (
                <span role="img" aria-label="Gagal terkirim">
                  !
                </span>
              )}
            </span>
          </div>
        )}

        {lightboxUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              type="button"
              aria-label="Tutup"
              className="absolute right-4 top-4 text-white"
              onClick={() => setLightboxUrl(null)}
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={lightboxUrl}
              alt="Lampiran"
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        {message.failed && (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs leading-none">
            <span role="alert" className="font-semibold text-red-600 dark:text-red-400">
              Gagal terkirim
            </span>
            <button
              type="button"
              onClick={() => onRetry?.(message)}
              className="font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300 dark:hover:text-blue-200"
            >
              Coba lagi
            </button>
            <button
              type="button"
              onClick={() => onDiscard?.(message)}
              aria-label="Hapus pesan gagal"
              className="font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-[#8B96AD] dark:hover:text-[#E6EAF2]"
            >
              Hapus
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
