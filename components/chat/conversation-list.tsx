"use client";

import { cn } from "@/lib/utils";
import {
  conversationPreview,
  listTimeLabel,
  projectAvatarClass,
  projectInitial,
} from "@/components/chat/chat-utils";
import { Search } from "lucide-react";
import type { DiscussionSummaryItem } from "@/types";

export type DiscussionFilter = "all" | "unread";

interface ConversationListProps {
  items: DiscussionSummaryItem[];
  selectedId: string | null;
  filter: DiscussionFilter;
  query: string;
  loading: boolean;
  error: string | null;
  onFilterChange: (filter: DiscussionFilter) => void;
  onQueryChange: (query: string) => void;
  onSelect: (projectId: string) => void;
  onRetry: () => void;
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#3B66EE] px-1.5 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/**
 * Daftar percakapan (pane kiri /diskusi): pencarian, filter Semua/Belum
 * dibaca, badge unread, dan status skeleton/empty/error.
 */
export function ConversationList({
  items,
  selectedId,
  filter,
  query,
  loading,
  error,
  onFilterChange,
  onQueryChange,
  onSelect,
  onRetry,
}: ConversationListProps) {
  // Jumlah project (bukan jumlah pesan) untuk label pil, sesuai mockup.
  const unreadProjects = items.filter((item) => item.unreadCount > 0).length;

  const filtered = items.filter((item) => {
    if (filter === "unread" && item.unreadCount === 0) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      if (!item.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-4 dark:border-white/[0.08]">
        <h1 className="text-lg font-bold text-slate-900 dark:text-[#E6EAF2]">
          Diskusi
        </h1>
        <div className="relative mt-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Cari project..."
            aria-label="Cari project"
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/[0.08] dark:bg-[#0F1524] dark:text-[#E6EAF2] dark:placeholder:text-[#8B96AD]"
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#1B2438] dark:text-[#8B96AD] dark:hover:bg-[#24304a]"
            )}
          >
            Semua {items.length}
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("unread")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              filter === "unread"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#1B2438] dark:text-[#8B96AD] dark:hover:bg-[#24304a]"
            )}
          >
            Belum dibaca {unreadProjects}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <ul
            className="space-y-1 p-2"
            aria-busy="true"
            aria-label="Memuat percakapan"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl p-2">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-slate-200 dark:bg-[#1B2438]" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-3 w-28 animate-pulse rounded bg-slate-200 dark:bg-[#1B2438]" />
                  <div className="h-2.5 w-40 animate-pulse rounded bg-slate-200 dark:bg-[#1B2438]" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <p className="text-sm text-slate-500 dark:text-[#8B96AD]">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Coba lagi
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Kamu belum punya project
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-[#8B96AD]">
              Buat atau gabung project dulu untuk mulai berdiskusi.
            </p>
          </div>
        )}

        {!loading && !error && items.length > 0 && filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-500 dark:text-[#8B96AD]">
            {filter === "unread"
              ? "Tidak ada percakapan yang belum dibaca."
              : "Tidak ada project yang cocok."}
          </p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <ul
            className="space-y-1 p-2"
            role="listbox"
            aria-label="Daftar percakapan"
          >
            {filtered.map((item) => {
              const selected = item.projectId === selectedId;
              return (
                <li key={item.projectId}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => onSelect(item.projectId)}
                    className={cn(
                      "relative flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      selected
                        ? "bg-blue-500/10 dark:bg-[#1B2438]"
                        : "hover:bg-slate-100 dark:hover:bg-[#1B2438]/60"
                    )}
                  >
                    {selected && (
                      <span
                        aria-hidden
                        className="absolute bottom-2 left-0 top-2 w-1 rounded-full bg-[#3B66EE]"
                      />
                    )}
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white",
                        projectAvatarClass(item.projectId)
                      )}
                    >
                      {projectInitial(item.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900 dark:text-[#E6EAF2]">
                          {item.name}
                        </span>
                        {item.lastMessage && (
                          <span className="shrink-0 text-[11px] text-slate-400 dark:text-[#8B96AD]">
                            {listTimeLabel(item.lastMessage.createdAt)}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-slate-500 dark:text-[#8B96AD]">
                          {conversationPreview(item.lastMessage)}
                        </span>
                        <UnreadBadge count={item.unreadCount} />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
