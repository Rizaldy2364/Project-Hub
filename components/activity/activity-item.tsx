import type { ReactNode } from "react";
import Link from "next/link";
import {
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
import type { ActivityItem } from "@/types";

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
    case "FILE_UPLOADED": {
      const count = typeof item.meta?.count === "number" ? item.meta.count : null;
      return (
        <>
          {actor} mengunggah {count !== null ? `${count} ` : ""}file di diskusi
        </>
      );
    }
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

interface ActivityItemCardProps {
  item: ActivityItem;
  /** Chip tautan project — matikan di konteks satu project (kartu Ringkasan). */
  showProjectLink?: boolean;
}

/** Satu baris feed aktivitas. Dipakai ActivityFeed (tab Aktivitas) dan kartu
 * "Aktivitas terbaru" di Ringkasan — bisa dirender dari server maupun client. */
export function ActivityItemCard({ item, showProjectLink = true }: ActivityItemCardProps) {
  const style = ACTION_STYLE[item.action] ?? ACTION_STYLE.TASK_UPDATED;
  const Icon = style.icon;
  return (
    <article className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-[#1B2438]">
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
          {showProjectLink && (
            <Link
              href={`/projects/${item.project.id}`}
              className="max-w-[200px] truncate rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-[#0F1524] dark:text-[#8B96AD] dark:hover:bg-[#1B2438]"
            >
              {item.project.name}
            </Link>
          )}
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
}