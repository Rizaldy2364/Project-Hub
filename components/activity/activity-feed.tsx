"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Activity as ActivityIcon,
  CircleCheck,
  CirclePlus,
  Flag,
  MessageSquare,
  PencilLine,
  Paperclip,
  Shield,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { listActivityPageAction } from "@/actions/activity.actions";
import type {
  ActivityItem,
  ActivityRangeValue,
  ActivityTypeFilterValue,
} from "@/types";

const TIME_ZONE = "Asia/Jakarta";

const ACTION_STYLE: Record<
  ActivityItem["action"],
  { icon: typeof Flag; className: string }
> = {
  PROJECT_CREATED: {
    icon: Flag,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-[#4ADE80]",
  },
  TASK_CREATED: {
    icon: CirclePlus,
    className: "bg-blue-500/10 text-blue-600 dark:text-[#8FAAFF]",
  },
  TASK_UPDATED: {
    icon: PencilLine,
    className: "bg-amber-500/10 text-amber-600 dark:text-[#FBBF24]",
  },
  TASK_COMPLETED: {
    icon: CircleCheck,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-[#4ADE80]",
  },
  COMMENT_ADDED: {
    icon: MessageSquare,
    className: "bg-purple-500/10 text-purple-600 dark:text-[#C4B5FD]",
  },
  FILE_UPLOADED: {
    icon: Paperclip,
    className: "bg-sky-500/10 text-sky-600 dark:text-[#7DD3FC]",
  },
  MEMBER_JOINED: {
    icon: UserPlus,
    className: "bg-teal-500/10 text-teal-600 dark:text-[#5EEAD4]",
  },
  MEMBER_ROLE_CHANGED: {
    icon: Shield,
    className: "bg-amber-500/10 text-amber-600 dark:text-[#FBBF24]",
  },
  MEMBER_REMOVED: {
    icon: UserMinus,
    className: "bg-rose-500/10 text-rose-600 dark:text-[#FDA4AF]",
  },
};

const STATUS_LABEL: Record<string, string> = {
  TODO: "Belum",
  IN_PROGRESS: "Dikerjakan",
  DONE: "Selesai",
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

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

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

function metaStr(meta: Record<string, unknown> | null, key: string): string | undefined {
  const v = meta?.[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function Bold({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-slate-900 dark:text-white">{children}</span>;
}

function ActivitySentence({ item }: { item: ActivityItem }) {
  const actor = <Bold>{item.actor.name}</Bold>;
  const title = metaStr(item.meta, "title");
  const projectName = metaStr(item.meta, "projectName") ?? item.project.name;
  const targetName = metaStr(item.meta, "targetName") ?? "Anggota";
  const to = metaStr(item.meta, "to");

  switch (item.action) {
    case "PROJECT_CREATED":
      return (
        <>
          {actor} membuat project <Bold>{title ?? item.project.name}</Bold>
        </>
      );
    case "TASK_CREATED":
      return (
        <>
          {actor} membuat task <Bold>{title ?? "task"}</Bold>
        </>
      );
    case "TASK_COMPLETED":
      return (
        <>
          {actor} menyelesaikan task <Bold>{title ?? "task"}</Bold>
        </>
      );
    case "TASK_UPDATED":
      if (to && to in STATUS_LABEL) {
        return (
          <>
            {actor} mengubah status task <Bold>{title ?? "task"}</Bold> menjadi{" "}
            {STATUS_LABEL[to]}
          </>
        );
      }
      return (
        <>
          {actor} mengubah task <Bold>{title ?? "task"}</Bold>
        </>
      );
    case "COMMENT_ADDED":
      return (
        <>
          {actor} berkomentar di task <Bold>{title ?? "task"}</Bold>
        </>
      );
    case "FILE_UPLOADED":
      return <>{actor} mengunggah file</>;
    case "MEMBER_JOINED":
      return (
        <>
          {actor} bergabung ke project <Bold>{projectName}</Bold> lewat kode gabung
        </>
      );
    case "MEMBER_ROLE_CHANGED":
      return (
        <>
          {actor} mengubah peran <Bold>{targetName}</Bold> menjadi{" "}
          {ROLE_LABEL[to ?? ""] ?? to ?? "Member"}
        </>
      );
    case "MEMBER_REMOVED":
      return (
        <>
          {actor} menghapus <Bold>{targetName}</Bold> dari project{" "}
          <Bold>{projectName}</Bold>
        </>
      );
    default:
      return <>{actor} melakukan aksi</>;
  }
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
                  {group.items.map((item) => {
                    const style = ACTION_STYLE[item.action] ?? ACTION_STYLE.TASK_UPDATED;
                    const Icon = style.icon;
                    return (
                      <article
                        key={item.id}
                        className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-[#1B2438]"
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                            style.className
                          )}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                            <ActivitySentence item={item} />
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <Link
                              href={`/projects/${item.project.id}`}
                              className="max-w-[200px] truncate rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-[#0F1524] dark:text-[#8B96AD] dark:hover:bg-[#1B2438]"
                            >
                              {item.project.name}
                            </Link>
                            <span className="text-xs text-slate-400 dark:text-[#8B96AD]">
                              {formatTime(item.createdAt)}
                            </span>
                          </div>
                        </div>
                        <UserAvatar
                          name={item.actor.name}
                          image={item.actor.avatarUrl}
                          size="sm"
                          className="shrink-0"
                        />
                      </article>
                    );
                  })}
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
