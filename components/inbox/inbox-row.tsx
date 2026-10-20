"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { InboxNotification } from "@/types";
import { formatInboxTime, dueLabel } from "@/lib/inbox-format";
import { isChatMention, projectDisplayName, TYPE_META, titleParts, subTitle } from "@/components/inbox/inbox-meta";

/**
 * Baris notifikasi yang dipakai di Inbox panel (halaman + bell dropdown).
 * Membagi tanggung jawab: skema/box icon → inbox-meta; teks judul/sub → same
 * module; tata letak & emphasis (kuning/ungu bg, biru dot) → ini.
 *
 * Tidak ada tombol balas, tombol baca detail, atau navigasi.
 */
export interface InboxRowProps {
  item: InboxNotification;
  compact?: boolean;
}

function UnreadPill({ unread }: { unread: boolean }) {
  if (!unread) return null;
  return <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />;
}

function BoxIcon({ item }: { item: InboxNotification }) {
  const meta = TYPE_META[item.type];
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
        meta.box
      )}
    >
      <meta.icon className="h-4 w-4" />
    </span>
  );
}

export function InboxRow({ item, compact = false }: InboxRowProps) {
  const meta = TYPE_META[item.type];
  const unread = !item.readAt;

  return (
    <article
      data-notification-id={item.id}
      aria-label={
        compact
          ? `${meta.label} ${unread ? "belum dibaca" : "dibaca"} • ${
              item.task?.title || projectDisplayName(item) || "—"
            }`
          : undefined
      }
      className={cn(
        "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0F1524]",
        unread
          ? "dark:bg-[#131A2B]"
          : "hover:bg-slate-50 dark:hover:bg-[#1B2438]",
        compact && "px-2 py-2"
      )}
    >
      <BoxIcon item={item} />

      <div className={cn("min-w-0 flex-1", compact && "text-sm")}>
        <div
          className={cn(
            "flex items-start gap-2",
            compact ? "justify-between" : "justify-between"
          )}
        >
          <p
            className={cn(
              "truncate text-left",
              compact
                ? "text-sm leading-snug font-medium text-[#E6EAF2]"
                : "text-sm leading-snug text-slate-900 dark:text-[#E6EAF2]",
              unread ? "font-medium" : "font-normal"
            )}
          >
            {titleParts(item)}
          </p>
          <span
            aria-hidden
            className="shrink-0 text-[11px] text-slate-400 dark:text-[#8B96AD]"
          >
            {formatInboxTime(item.createdAt)}
          </span>
        </div>

        {!compact && (
          <p
            className="mt-0.5 truncate text-xs text-slate-500 dark:text-[#8B96AD]"
            title={subTitle(item)}
          >
            {subTitle(item)}
          </p>
        )}
      </div>

      <UnreadPill unread={unread} />
    </article>
  );
}

/**
 * Shape ringkas untuk panel dropdown (max 8 baris, tanpa card detail + balas).
 */
export interface InboxRowPreview {
  id: string;
  type: InboxNotification["type"];
  readAt: InboxNotification["readAt"];
  createdAt: InboxNotification["createdAt"];
  title: ReactNode;
  sub: string;
  project: string;
  unread: boolean;
  deleted: boolean;
}
