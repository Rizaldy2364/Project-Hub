"use client";

import { useMemo, useState } from "react";
import { Activity as ActivityIcon } from "lucide-react";
import { listActivityPageAction } from "@/actions/activity.actions";
import { ActivityItemCard } from "@/components/activity/activity-item";
import type {
  ActivityItem,
  ActivityRangeValue,
  ActivityTypeFilterValue,
} from "@/types";

const TIME_ZONE = "Asia/Jakarta";

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

function dayKey(iso: string): string {
  return dayKeyFmt.format(new Date(iso));
}

/** "HARI INI, 12 OKT" / "KEMARIN, 11 OKT" / "8 OKT" — zona Asia/Jakarta. */
function groupLabel(iso: string): string {
  const now = new Date();
  const key = dayKey(iso);
  const today = dayKey(now.toISOString());
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000).toISOString());
  const datePart = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
  })
    .format(new Date(iso))
    .toUpperCase();
  if (key === today) return `HARI INI, ${datePart}`;
  if (key === yesterday) return `KEMARIN, ${datePart}`;
  return datePart;
}

interface ActivityFeedProps {
  initialItems: ActivityItem[];
  initialNextCursor: string | null;
  filters: {
    type: ActivityTypeFilterValue;
    project: string;
    member: string;
    range: ActivityRangeValue;
  };
}

export function ActivityFeed({ initialItems, initialNextCursor, filters }: ActivityFeedProps) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, ActivityItem[]>();
    for (const item of items) {
      const label = groupLabel(item.createdAt);
      const arr = map.get(label);
      if (arr) arr.push(item);
      else map.set(label, [item]);
    }
    return [...map.entries()].map(([label, groupItems]) => ({ label, items: groupItems }));
  }, [items]);

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    const res = await listActivityPageAction({ ...filters, cursor: nextCursor });
    setLoadingMore(false);
    if ("error" in res) {
      setError("Gagal memuat aktivitas. Coba lagi.");
      return;
    }
    setItems((prev) => [...prev, ...res.items]);
    setNextCursor(res.nextCursor);
  }

  return (
    <section
      aria-label="Feed aktivitas"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[.08] dark:bg-[#131A2B]"
    >
      <div className="max-h-[650px] overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-[#0F1524]">
              <ActivityIcon className="h-5 w-5 text-slate-400" aria-hidden />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Belum ada aktivitas
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-[#8B96AD]">
              Kejadian di project yang kamu ikuti akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="px-1 text-[11px] font-bold tracking-wider text-slate-400 dark:text-[#8B96AD]">
                  {group.label}
                </p>
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => (
                    <ActivityItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
        >
          {error}{" "}
          <button
            type="button"
            onClick={handleLoadMore}
            className="font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Coba lagi
          </button>
        </div>
      )}

      {nextCursor && items.length > 0 && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="mt-4 h-10 w-full rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:border-white/[.08] dark:text-slate-300 dark:hover:bg-[#1B2438]"
        >
          {loadingMore ? "Memuat..." : "Muat lebih banyak"}
        </button>
      )}
    </section>
  );
}
