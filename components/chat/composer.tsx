"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Paperclip, Send, Smile, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { EmojiPicker } from "@/components/chat/emoji-picker";
import { useUploadThing } from "@/lib/uploadthing";
import type { ChatAttachmentUpload, ChatMember, ChatMessage } from "@/types";

interface ComposerProps {
  members: ChatMember[];
  projectId: string;
  /** VIEWER: ganti pil dengan baris redup "hanya bisa melihat". */
  readOnly?: boolean;
  /** Sedang mengirim — spinner di dalam tombol kirim. */
  disabled?: boolean;
  /** Error kirim (mis. rate limit) ditampilkan di area composer. */
  error: string | null;
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  /** Terima konten + lampiran yang sudah diunggah. */
  onSend: (content: string, attachments: ChatAttachmentUpload[]) => void;
}

interface PickedMention {
  id: string;
  name: string;
}

/**
 * Komposer berbentuk pil: baris input rounded (1 baris → auto-grow maks ~5
 * baris, radius menyusut ke ~22px saat multi-baris) + tombol kirim bulat di
 * kanan. Enter kirim / Shift+Enter baru, popup mention saat mengetik "@"
 * (keyboard navigable), pratinjau balasan. VIEWER melihat baris redup saja.
 */
export function Composer({
  members,
  projectId,
  readOnly = false,
  disabled = false,
  error,
  replyTo,
  onCancelReply,
  onSend,
}: ComposerProps) {
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<PickedMention[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachmentUpload[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  /** Wadah pil — radius diatur langsung (penuh saat 1 baris, ~22px multi). */
  const pillRef = useRef<HTMLDivElement>(null);

  const { startUpload, isUploading } = useUploadThing("chatAttachment", {
    onClientUploadComplete: (res) => {
      const uploaded: ChatAttachmentUpload[] = (res ?? []).map((r) => ({
        id: r.serverData!.attachmentId,
        name: r.name,
        url: r.url,
        size: r.size,
        mimeType: r.type,
        isImage: /^image\/(png|jpeg|jpg|webp|gif)$/i.test(r.type),
      }));
      setPendingAttachments((prev) => [...prev, ...uploaded]);
      setUploadError(null);
    },
    onUploadError: (err) => {
      setUploadError(err?.message ?? "Gagal mengunggah file");
    },
  });

  const candidates =
    mentionQuery !== null
      ? members
          .filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase()))
          .slice(0, 6)
      : [];

  // Auto-grow: mulai 1 baris, tumbuh maks ~5 baris (baris 20px). Overflow
  // disembunyikan sampai batas maks (baru muncul scrollbar di situ), dan radius
  // pil menyusut ke ~22px begitu konten melebihi satu baris visual.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const MAX = 116; // ~5 baris
    el.style.height = "auto";
    const raw = el.scrollHeight;
    el.style.height = `${Math.min(raw, MAX)}px`;
    el.style.overflowY = raw > MAX ? "auto" : "hidden";
    if (pillRef.current) {
      pillRef.current.style.borderRadius = raw > 24 ? "22px" : "";
    }
  }, [text]);

  // Gulir item aktif popup mention ke tampilan.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.children[mentionIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ block: "nearest" });
  }, [mentionIndex]);

  function detectMention(value: string, caret: number): string | null {
    // Query = teks setelah "@" terakhir sebelum kursor (tanpa spasi/newline).
    const upto = value.slice(0, caret);
    const at = upto.lastIndexOf("@");
    if (at === -1) return null;
    const before = at > 0 ? upto[at - 1] : "";
    if (before && !/\s/.test(before)) return null; // @ harus diawali spasi/awal
    const query = upto.slice(at + 1);
    if (/[\s\n]/.test(query)) return null;
    return query;
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setText(value);
    const query = detectMention(value, e.target.selectionStart ?? value.length);
    setMentionQuery(query);
    setMentionIndex(0);
  }

  function insertMention(member: ChatMember) {
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? text.length;
    const upto = text.slice(0, caret);
    const at = upto.lastIndexOf("@");
    const after = text.slice(caret);
    const namePart = `@${member.name} `;
    setText(`${upto.slice(0, at)}${namePart}${after}`);
    setPicked((prev) =>
      prev.some((p) => p.id === member.id)
        ? prev
        : [...prev, { id: member.id, name: member.name }]
    );
    setMentionQuery(null);
    // Kembalikan fokus + posisi kursor setelah nama.
    requestAnimationFrame(() => {
      const nextCaret = at + namePart.length;
      el?.focus();
      el?.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function insertEmoji(char: string) {
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? text.length;
    const upto = text.slice(0, caret);
    const after = text.slice(caret);
    setText(`${upto}${char}${after}`);
    setIsEmojiPickerOpen(false);
    // Kembalikan fokus dan posisi kursor setelah emoji.
    requestAnimationFrame(() => {
      const nextCaret = caret + char.length;
      el?.focus();
      el?.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function submit() {
    if (disabled || isUploading) return;
    if (!text.trim() && pendingAttachments.length === 0) return;
    // Konversi "@Nama" yang pernah dipilih menjadi token `@[userId]`.
    // Nama terpanjang dulu agar "@Budi Santoso" tidak dipotong "@Budi".
    let content = text;
    for (const m of [...picked].sort((a, b) => b.name.length - a.name.length)) {
      content = content.split(`@${m.name}`).join(`@[${m.id}]`);
    }
    content = content.trim();
    onSend(content, pendingAttachments);
    setText("");
    setPicked([]);
    setPendingAttachments([]);
    setMentionQuery(null);
    setUploadError(null);
    // Fokus kembali ke textarea komposer (mis. setelah kirim lewat klik tombol).
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && candidates.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => Math.min(candidates.length - 1, i + 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const pickedMember = candidates[mentionIndex];
        if (pickedMember) insertMention(pickedMember);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const canSend = (text.trim().length > 0 || pendingAttachments.length > 0) && !disabled && !isUploading;

  return (
    <div className="relative border-t border-slate-200 bg-white px-5 py-3.5 dark:border-white/[0.08] dark:bg-[#131A2B]">
      {/* Popup mention */}
      {mentionQuery !== null && candidates.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Sebut anggota"
          className="absolute bottom-full left-5 z-20 mb-2 max-h-52 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-white/[0.08] dark:bg-[#131A2B]"
        >
          {candidates.map((m, i) => (
            <li key={m.id} role="option" aria-selected={i === mentionIndex}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // jangan pindah fokus dari textarea
                  insertMention(m);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  i === mentionIndex
                    ? "bg-blue-500/10 text-blue-700 dark:text-[#8FAAFF]"
                    : "text-slate-700 hover:bg-slate-50 dark:text-[#E6EAF2] dark:hover:bg-[#1B2438]"
                )}
              >
                <UserAvatar
                  name={m.name}
                  image={m.avatarUrl}
                  size="sm"
                  className="h-6 w-6 text-[9px]"
                />
                <span className="truncate">{m.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Pratinjau balasan (di atas pil; VIEWER tidak punya kolom balas) */}
      {replyTo && !readOnly && (
        <div className="mb-2 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/[0.08] dark:bg-[#0F1524]">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-[#8B96AD]">
              Membalas {replyTo.author.name}
            </p>
            <p className="truncate text-xs text-slate-600 dark:text-slate-300">
              {replyTo.deleted ? "Pesan ini dihapus" : replyTo.content}
            </p>
          </div>
          <button
            type="button"
            aria-label="Batalkan balasan"
            onClick={onCancelReply}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-[#1B2438] dark:hover:text-[#E6EAF2]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {pendingAttachments.length > 0 && !readOnly && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pendingAttachments.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-white/[0.08] dark:bg-[#0F1524]"
            >
              <span className="max-w-[160px] truncate">{a.name}</span>
              <button
                type="button"
                aria-label={`Hapus ${a.name}`}
                onClick={() =>
                  setPendingAttachments((prev) => prev.filter((x) => x.id !== a.id))
                }
                className="text-slate-400 hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadError && (
        <p role="alert" className="mb-2 text-xs text-red-600 dark:text-red-400">
          {uploadError}
        </p>
      )}

      {readOnly ? (
        /* VIEWER: tanpa kolom input — chat tetap bisa dibaca. */
        <p className="py-2 text-center text-sm text-slate-500 dark:text-[#8B96AD]">
          Kamu hanya bisa melihat percakapan ini
        </p>
      ) : (
        <div className="flex items-end gap-2.5">
          {/* Pil input: 1 baris (radius penuh) → auto-grow maks ~5 baris
              (radius ~22px). Tanpa scrollbar sampai batas maks. */}
          <div
            ref={pillRef}
            className="flex items-center min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 transition-shadow focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/30 dark:border-white/[0.08] dark:bg-[#0F1524]"
          >
            {/* Tombol lampiran */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip"
              className="sr-only"
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length === 0) return;
                setUploadError(null);
                await startUpload(files, { projectId });
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || disabled}
              aria-label="Lampirkan file"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-white/[0.5] hover:text-blue-600 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-[#8FAAFF] transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Paperclip className="h-4 w-4" aria-hidden />
              )}
            </button>
            {/* Tombol emoji di pojok kiri pil input */}
            <span className="relative inline-block">
              <button
                ref={emojiButtonRef}
                type="button"
                onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
                aria-label="Emoji"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-white/[0.5] hover:text-blue-600 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-[#8FAAFF] transition-colors"
              >
                <Smile className="h-4 w-4" />
              </button>
              {/* Card emoji — diposisikan absolut di atas ikon emoji seperti di WhatsApp */}
              {isEmojiPickerOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute bottom-full left-0 mb-3 w-[320px] max-w-[calc(100vw-2.5rem)] sm:w-[352px] z-50 pointer-events-auto"
                >
                  <EmojiPicker
                    open={isEmojiPickerOpen}
                    onClose={() => setIsEmojiPickerOpen(false)}
                    onEmojiSelect={insertEmoji}
                    triggerRef={emojiButtonRef}
                  />
                </div>
              )}
            </span>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={2000}
              placeholder="Tulis pesan... ketik @ untuk menyebut anggota project"
              aria-label="Tulis pesan"
              className="flex-1 min-w-0 resize-none overflow-y-hidden bg-transparent text-sm leading-5 text-slate-900 outline-none placeholder:text-slate-400 focus-visible:outline-none dark:text-[#E6EAF2] dark:placeholder:text-[#8B96AD]"
            />
          </div>
          {/* Tombol kirim bulat terpisah (42px) — spinner saat mengirim,
              redup/disabled saat teks kosong atau hanya spasi. */}
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label="Kirim pesan"
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#3B66EE] text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"
          >
            {disabled ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <Send className="h-[18px] w-[18px]" aria-hidden />
            )}
          </button>
        </div>
      )}

      {/* Error kirim (mis. rate limit) — di bawah pil. */}
      {error && (
        <p
          role="alert"
          className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
