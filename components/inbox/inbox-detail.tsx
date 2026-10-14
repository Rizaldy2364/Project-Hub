"use client";

import Link from "next/link";
import { useState } from "react";
import { FolderKanban } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";
import type { InboxNotification } from "@/types";
import { TYPE_META } from "@/components/inbox/inbox-meta";
import { ReplyBox } from "@/components/inbox/inbox-item";
import { formatFullDate, formatInboxTime, taskLink } from "@/lib/inbox-format";
import {
  markNotificationReadAction,
  replyNotificationAction,
} from "@/actions/notification.actions";

const PRIORITY_META = {
  HIGH: { label: "Tinggi", cls: "bg-red-500/10 text-red-600 dark:text-red-400" },
  MEDIUM: { label: "Sedang", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  LOW: { label: "Rendah", cls: "bg-slate-500/10 text-slate-500 dark:text-slate-400" },
} as const;

const STATUS_META = {
  TODO: { label: "Belum", cls: "bg-slate-500/10 text-slate-500 dark:text-slate-400" },
  IN_PROGRESS: { label: "Dikerjakan", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-300" },
  DONE: { label: "Selesai", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
} as const;

interface DetailProps {
  item: InboxNotification;
  onRead: (id: string) => void;
  onReplied: () => void;
}

export function InboxDetail({ item, onRead, onReplied }: DetailProps) {
  const meta = TYPE_META[item.type];
  const [sending, setSending] = useState(false);
  const [marking, setMarking] = useState(false);
  const unread = !item.readAt;
  const showReply =
    item.type === "TASK_ASSIGNED" ||
    item.type === "MENTION" ||
    item.type === "TASK_COMMENT";
  const showTask = item.task !== null && item.type !== "MEMBER_JOINED" && item.type !== "PROJECT_COMPLETED";

  async function handleMarkRead() {
    if (!unread || marking) return;
    setMarking(true);
    const res = await markNotificationReadAction(item.id);
    setMarking(false);
    if (!("error" in res)) onRead(item.id);
  }

  async function handleReply(content: string) {
    if (sending) return;
    setSending(true);
    const formData = new FormData();
    formData.set("content", content);
    const res = await replyNotificationAction(item.id, formData);
    setSending(false);
    if (!("error" in res)) onReplied();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <UserAvatar
          name={item.actor?.name ?? "?"}
          image={item.actor?.avatarUrl ?? null}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-[#E6EAF2]">
            {item.actor?.name ?? "Sistem"}
          </p>
          <p className="text-xs text-slate-500 dark:text-[#8B96AD]">
            {formatInboxTime(item.createdAt)} • di project {item.project?.name ?? "-"}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            unread
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-300"
              : "bg-slate-500/10 text-slate-500 dark:text-slate-400"
          )}
        >
          {unread ? "Belum dibaca" : "Sudah dibaca"}
        </span>
      </div>

      <div>
        <p className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-[#8B96AD]">
          {meta.detailLabel}
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-[#E6EAF2]">
          {item.task?.title ?? item.project?.name ?? "Notifikasi"}
        </h2>
        {item.project && (
          <span className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-[#131A2B] dark:text-[#8B96AD]">
            <FolderKanban className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.project.name}</span>
          </span>
        )}
        {item.comment && (
          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/[0.08] dark:bg-[#0F1524]">
            <div className="flex items-center gap-2">
              <UserAvatar
                name={item.comment.author?.name ?? "?"}
                image={item.comment.author?.avatarUrl ?? null}
                size="sm"
                className="h-6 w-6 text-[9px]"
              />
              <p className="min-w-0 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                {item.comment.author?.name ?? "-"}
              </p>
              <p className="shrink-0 text-[11px] text-slate-400 dark:text-[#8B96AD]">
                {formatInboxTime(item.comment.createdAt)}
              </p>
            </div>
            <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-200">
              {item.comment.content}
            </p>
          </div>
        )}
      </div>

      {showTask && item.task ? (
        <dl className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-white/[0.08] dark:bg-[#0F1524]">
          <div>
            <dt className="text-[11px] text-slate-400 dark:text-[#8B96AD]">Project</dt>
            <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">
              {item.project?.name ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-slate-400 dark:text-[#8B96AD]">Ditugaskan ke</dt>
            <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">
              {item.task.assignee?.name ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-slate-400 dark:text-[#8B96AD]">Prioritas</dt>
            <dd className="mt-1">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  PRIORITY_META[item.task.priority].cls
                )}
              >
                {PRIORITY_META[item.task.priority].label}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-slate-400 dark:text-[#8B96AD]">Status</dt>
            <dd className="mt-1">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  STATUS_META[item.task.status].cls
                )}
              >
                {STATUS_META[item.task.status].label}
              </span>
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[11px] text-slate-400 dark:text-[#8B96AD]">Tenggat</dt>
            <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">
              {item.task.dueDate ? formatFullDate(item.task.dueDate) : "-"}
            </dd>
          </div>
        </dl>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-white/[0.08] dark:bg-[#0F1524]">
          <p className="text-[11px] text-slate-400 dark:text-[#8B96AD]">Project</p>
          <p className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">
            {item.project?.name ?? "-"}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Link
          href={taskLink(item)}
          className="flex h-10 flex-1 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Buka Task
        </Link>
        {unread && (
          <button
            type="button"
            onClick={handleMarkRead}
            disabled={marking}
            className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:border-white/[0.08] dark:text-slate-200 dark:hover:bg-[#1B2438]"
          >
            {marking ? "Menyimpan..." : "Tandai dibaca"}
          </button>
        )}
      </div>

      {showReply && (
        <ReplyBox
          actorName={item.actor?.name ?? "mereka"}
          sending={sending}
          onSend={handleReply}
        />
      )}
    </div>
  );
}