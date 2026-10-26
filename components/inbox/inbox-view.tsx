"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Filter as FilterIcon,
  Inbox as InboxIcon,
  List,
  Circle,
  AtSign,
  Check,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  InboxNotification,
  NotificationTabCounts,
  NotificationTabValue,
} from "@/types";
import { groupLabel } from "@/lib/inbox-format";
import { InboxItem } from "@/components/inbox/inbox-item";
import { InboxDetail } from "@/components/inbox/inbox-detail";
import { useUnreadCount } from "@/components/notifications/unread-provider";
import {
  listNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notification.actions";

const TABS: { key: NotificationTabValue; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "unread", label: "Belum dibaca" },
  { key: "mention", label: "Mention" },
  { key: "task", label: "Tugas" },
  { key: "invite", label: "Undangan" },
];

const TAB_ICONS: Record<NotificationTabValue, typeof List> = {
  all: List,
  unread: Circle,
  mention: AtSign,
  task: Check,
  invite: UserPlus,
};

const EMPTY_MESSAGES: Record<NotificationTabValue, string> = {
  all: "Tidak ada notifikasi",
  unread: "Tidak ada notifikasi yang belum dibaca",
  mention: "Tidak ada mention untukmu",
  task: "Tidak ada notifikasi tugas",
  invite: "Tidak ada undangan project",
};

interface InboxViewProps {
  initialItems: InboxNotification[];
  initialNextCursor: string | null;
  initialCounts: NotificationTabCounts;
  initialTab: NotificationTabValue;
}

export function InboxView({
  initialItems,
  initialNextCursor,
  initialCounts,
  initialTab,
}: InboxViewProps) {
  const [tab, setTab] = useState<NotificationTabValue>(initialTab);
  const [items, setItems] = useState<InboxNotification[]>(initialItems);
  const [counts, setCounts] = useState<NotificationTabCounts>(initialCounts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialItems[0]?.id ?? null
  );
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  // Badge lonceng & sidebar memakai provider yang sama — segarkan setelah
  // notifikasi ditandai dibaca agar angka turun bersama.
  const { refresh: refreshUnread } = useUnreadCount();

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId]
  );

  const groups = useMemo(() => {
    const order = ["HARI INI", "KEMARIN", "LEBIH LAMA"];
    const map = new Map<string, InboxNotification[]>();
    for (const item of items) {
      const label = groupLabel(item.createdAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(item);
    }
    return order
      .filter((label) => map.has(label))
      .map((label) => ({ label, items: map.get(label)! }));
  }, [items]);

  const loadTab = useCallback(async (nextTab: NotificationTabValue) => {
    setLoading(true);
    setError(null);
    const res = await listNotificationsAction(nextTab);
    setLoading(false);
    if ("error" in res) {
      setError("Gagal memuat notifikasi. Coba lagi.");
      return;
    }
    setItems(res.items);
    setNextCursor(res.nextCursor);
    setSelectedId(res.items[0]?.id ?? null);
    setDetailOpen(false);
  }, []);

  async function handleTab(nextTab: NotificationTabValue) {
    if (nextTab === tab) return;
    setTab(nextTab);
    await loadTab(nextTab);
  }

  const handleSelect = useCallback(
    async (item: InboxNotification) => {
      setSelectedId(item.id);
      setDetailOpen(true);
      if (item.readAt) return;
      // Optimistic update + rollback jika gagal.
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, readAt: new Date().toISOString() } : i
        )
      );
      setCounts((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      const res = await markNotificationReadAction(item.id);
      if ("error" in res) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, readAt: null } : i))
        );
        setCounts((prev) => ({ ...prev, unread: prev.unread + 1 }));
      }
      void refreshUnread(); // selaraskan badge lonceng/sidebar
    },
    [refreshUnread]
  );

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const res = await listNotificationsAction(tab, nextCursor);
    setLoadingMore(false);
    if ("error" in res) {
      setError("Gagal memuat halaman berikutnya. Coba lagi.");
      return;
    }
    setItems((prev) => [...prev, ...res.items]);
    setNextCursor(res.nextCursor);
  }

  async function handleMarkAll() {
    if (markingAll || counts.unread === 0) return;
    setMarkingAll(true);
    const res = await markAllNotificationsReadAction();
    setMarkingAll(false);
    if ("error" in res) {
      setError("Gagal menandai semua dibaca. Coba lagi.");
      return;
    }
    const now = new Date().toISOString();
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? now })));
    setCounts((prev) => ({ ...prev, unread: 0 }));
    void refreshUnread(); // selaraskan badge lonceng/sidebar
  }

  function markOneRead(id: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, readAt: i.readAt ?? new Date().toISOString() } : i
      )
    );
    setCounts((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    void refreshUnread(); // selaraskan badge lonceng/sidebar
  }

  // Navigasi keyboard: panah atas/bawah memilih item, Enter membuka detail.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Enter") return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (items.length === 0) return;
      const idx = items.findIndex((i) => i.id === selectedId);
      if (e.key === "Enter") {
        if (selected) void handleSelect(selected);
        return;
      }
      e.preventDefault();
      const next =
        e.key === "ArrowDown"
          ? items[Math.min(items.length - 1, (idx === -1 ? -1 : idx) + 1)]
          : items[Math.max(0, (idx === -1 ? items.length : idx) - 1)];
      if (next) void handleSelect(next);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, selectedId, selected, handleSelect]);

  function countFor(key: NotificationTabValue): number {
    return counts[key];
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
            Inbox
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-[#8B96AD]">
            Notifikasi task, mention, pengingat, dan undangan project.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={markingAll || counts.unread === 0}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            {markingAll ? "Menyimpan..." : "Tandai semua dibaca"}
          </button>
          
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section
          aria-label="Daftar notifikasi"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Desktop: horizontal tab pills */}
          <div
            className="hidden sm:flex flex-wrap gap-2"
            role="tablist"
            aria-label="Filter notifikasi"
          >
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => handleTab(key)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  tab === key
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                )}
              >
                {label} <span className="opacity-80">{countFor(key)}</span>
              </button>
            ))}
          </div>

          {/* Mobile: filter dropdown button */}
          <div className="sm:hidden">
            <button
              type="button"
              onClick={() => setFilterOpen((prev) => !prev)}
              aria-expanded={filterOpen}
              aria-label="Filter notifikasi"
              className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800/50"
            >
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Filter {TABS.find((t) => t.key === tab)?.label}</span>
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  {countFor(tab)}
                </span>
              </div>
              {filterOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {/* Mobile: filter options column */}
            {filterOpen && (
              <div className="mt-2 space-y-1 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {TABS.map(({ key, label }) => {
                  const Icon = TAB_ICONS[key];
                  const isSelected = tab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => {
                        void handleTab(key);
                        setFilterOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                        isSelected
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                          : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{label}</span>
                      </div>
                      <span className="text-xs opacity-70">{countFor(key)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => loadTab(tab)}
                className="mt-2 font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Coba lagi
              </button>
            </div>
          )}

          {loading ? (
            <div className="mt-4 space-y-3" aria-label="Memuat notifikasi">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <InboxIcon className="h-5 w-5 text-slate-400" />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {EMPTY_MESSAGES[tab]}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Notifikasi baru akan muncul di sini.
              </p>
            </div>
          ) : (
            <div ref={listRef} role="listbox" aria-label="Notifikasi" className="mt-4 space-y-5">
              {groups.map((group) => (
                <div key={group.label} className="space-y-2">
                  <p className="px-1 text-[11px] font-bold tracking-wider text-slate-400 dark:text-[#8B96AD]">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                    <InboxItem
                      key={item.id}
                      item={item}
                      selected={item.id === selectedId}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              ))}
              {nextCursor && (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="h-10 w-full rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {loadingMore ? "Memuat..." : "Muat lebih banyak"}
                </button>
              )}
            </div>
          )}
        </section>

        <aside aria-label="Detail notifikasi" className="lg:sticky lg:top-20 lg:self-start">
          <div className="hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:block dark:border-slate-800 dark:bg-slate-900">
            {selected ? (
              <InboxDetail
                item={selected}
                onRead={markOneRead}
                onReplied={() => loadTab(tab)}
              />
            ) : (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Pilih notifikasi untuk melihat detail.
              </p>
            )}
          </div>

          {detailOpen && selected && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                aria-hidden
                onClick={() => setDetailOpen(false)}
                className="absolute inset-0 bg-black/50"
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Detail notifikasi"
                className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <button
                  type="button"
                  onClick={() => setDetailOpen(false)}
                  className="mb-3 text-xs font-semibold text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300"
                >
                  Kembali ke daftar
                </button>
                <InboxDetail
                  item={selected}
                  onRead={markOneRead}
                  onReplied={() => loadTab(tab)}
                />
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
