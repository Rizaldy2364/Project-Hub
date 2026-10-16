"use client";

import { useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboxNotification } from "@/types";
import { formatInboxTime } from "@/lib/inbox-format";
import { TYPE_META, titleParts, subTitle } from "@/components/inbox/inbox-meta";

interface ItemProps {
  item: InboxNotification;
  selected: boolean;
  onSelect: (item: InboxNotification) => void;
}

export function InboxItem({ item, selected, onSelect }: ItemProps) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  const unread = !item.readAt;

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      data-notification-id={item.id}
      onClick={() => onSelect(item)}
      className={cn(
        "relative flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "border-slate-200 bg-white hover:bg-slate-50",
        "dark:border-white/[0.08] dark:bg-[#0F1524] dark:hover:bg-[#1B2438]",
        unread && "dark:bg-[#131A2B]",
        selected && "border-blue-500/60 dark:border-blue-500/60"
      )}
    >
      {selected && (
        <span
          aria-hidden
          className="absolute bottom-2 left-0 top-2 w-1 rounded-full bg-blue-500"
        />
      )}
      {unread && (
        <span
          aria-hidden
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500"
        />
      )}
      <span
        aria-hidden
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          meta.box
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-sm leading-snug text-slate-900 dark:text-[#E6EAF2]",
            unread ? "font-medium" : "font-normal"
          )}
        >
          {titleParts(item)}
        </span>
        <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-[#8B96AD]">
          {subTitle(item)}
        </span>
      </span>
      <span className="shrink-0 text-[11px] text-slate-400 dark:text-[#8B96AD]">
        {formatInboxTime(item.createdAt)}
      </span>
    </button>
  );
}

export function ReplyBox({
  actorName,
  sending,
  onSend,
}: {
  actorName: string;
  sending: boolean;
  /** Kembalikan true bila server sukses (field dikosongkan); false bila gagal. */
  onSend: (content: string) => Promise<boolean> | boolean;
}) {
  // Controlled agar isi dipertahankan bila kirim gagal; dikosongkan hanya
  // setelah parent mengonfirmasi sukses.
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const sendingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    const content = draft.trim();
    if (!content || sending || busy || sendingRef.current) return;
    sendingRef.current = true;
    setBusy(true);
    try {
      const ok = await onSend(content);
      if (ok) {
        setDraft("");
        // Fokus kembali ke input setelah enabled lagi (disabled = blur).
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    } finally {
      sendingRef.current = false;
      setBusy(false);
    }
  }

  const disabled = sending || busy;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/[0.08] dark:bg-[#0F1524]"
    >
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          // Enter kirim; abaikan saat request masih jalan (cegah dobel).
          if (e.key === "Enter") {
            e.preventDefault();
            if (!disabled) void submit();
          }
        }}
        maxLength={1000}
        disabled={disabled}
        placeholder={`Balas ${actorName}...`}
        aria-label={`Balas ${actorName}`}
        className="h-9 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60 dark:text-[#E6EAF2] dark:placeholder:text-[#8B96AD]"
      />
      <button
        type="submit"
        disabled={disabled || !draft.trim()}
        aria-label={disabled ? "Mengirim balasan..." : "Kirim balasan"}
        title={disabled ? "Mengirim..." : "Kirim balasan"}
        className="flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2 text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
      >
        {disabled ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span className="pr-1 text-xs font-semibold">Mengirim...</span>
          </>
        ) : (
          <Send className="h-4 w-4" aria-hidden />
        )}
      </button>
    </form>
  );
}
