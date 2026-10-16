"use client";

import { useEffect, useRef, useState } from "react";
import { AtSign, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { ChatMember, ChatMessage } from "@/types";

interface ComposerProps {
  members: ChatMember[];
  /** Nama project untuk placeholder ("Tulis pesan ke {nama}..."). */
  projectName: string;
  disabled?: boolean;
  /** Error kirim (mis. rate limit) ditampilkan di area composer. */
  error: string | null;
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  /** Terima konten yang token mention-nya sudah dikonversi `@[userId]`. */
  onSend: (content: string) => void;
}

interface PickedMention {
  id: string;
  name: string;
}

/**
 * Area input pesan: auto-grow (maks ~5 baris), Enter kirim / Shift+Enter baru,
 * popup mention saat mengetik "@" (keyboard navigable), pratinjau balasan.
 */
export function Composer({
  members,
  projectName,
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const candidates =
    mentionQuery !== null
      ? members
          .filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase()))
          .slice(0, 6)
      : [];

  // Auto-grow: mulai 1 baris, tumbuh maks ~5 baris (baris 20px). Overflow
  // disembunyikan sampai batas maks, baru muncul scrollbar di situ.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const MAX = 116; // ~5 baris
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, MAX);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > MAX ? "auto" : "hidden";
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

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    // Konversi "@Nama" yang pernah dipilih menjadi token `@[userId]`.
    // Nama terpanjang dulu agar "@Budi Santoso" tidak dipotong "@Budi".
    let content = text;
    for (const m of [...picked].sort((a, b) => b.name.length - a.name.length)) {
      content = content.split(`@${m.name}`).join(`@[${m.id}]`);
    }
    content = content.trim();
    if (!content) return;
    onSend(content);
    setText("");
    setPicked([]);
    setMentionQuery(null);
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

  /** Tombol "@" pada toolbar: sisipkan "@" di kursor lalu buka popup mention. */
  function openMentionPicker() {
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? text.length;
    // @ harus diawali spasi/awal teks agar deteksi mention tetap valid.
    const sep = caret > 0 && !/\s/.test(text[caret - 1]) ? " @" : "@";
    const next = `${text.slice(0, caret)}${sep}${text.slice(caret)}`;
    setText(next);
    setMentionQuery("");
    setMentionIndex(0);
    requestAnimationFrame(() => {
      const pos = caret + sep.length;
      el?.focus();
      el?.setSelectionRange(pos, pos);
    });
  }

  const canSend = text.trim().length > 0 && !disabled;

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

      {/* Pratinjau balasan (di atas kotak) */}
      {replyTo && (
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

      {/* Kotak input: textarea + toolbar, radius 14px, padding 10px 12px */}
      <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/[0.08] dark:bg-[#0F1524]">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={2000}
          placeholder={`Tulis pesan ke ${projectName || "project"}... gunakan @ untuk menyebut anggota`}
          aria-label="Tulis pesan"
          className="block w-full resize-none overflow-y-hidden bg-transparent text-sm leading-5 text-slate-900 outline-none placeholder:text-slate-400 focus-visible:outline-none dark:text-[#E6EAF2] dark:placeholder:text-[#8B96AD]"
        />
        <div className="mt-2 flex items-center gap-1">
          <button
            type="button"
            onClick={openMentionPicker}
            aria-label="Sebut anggota"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-[#8B96AD] dark:hover:bg-[#1B2438] dark:hover:text-[#E6EAF2]"
          >
            <AtSign className="h-4 w-4" />
          </button>
          <span className="hidden text-[11px] text-slate-400 sm:block dark:text-[#8B96AD]">
            Enter kirim · Shift+Enter baris baru
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            className="ml-auto h-9 shrink-0 rounded-[10px] bg-[#3B66EE] px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"
          >
            Kirim
          </button>
        </div>
      </div>

      {/* Error kirim (mis. rate limit) — di bawah kotak. */}
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
