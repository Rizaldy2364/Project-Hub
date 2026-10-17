"use client";

import { CalendarDays, MessageSquare } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn, formatDayMonthWib, wibDayDiff } from "@/lib/utils";
import type { BoardTask } from "@/types";

interface BoardCardProps {
  task: BoardTask;
  onSelectTask: (task: BoardTask) => void;
  canDrag: boolean;
  overlay?: boolean;
}

/** Kartu task di kolom board: judul, label, assignee, komentar, tenggat WIB. */
export function BoardCard({ task, onSelectTask, canDrag, overlay }: BoardCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !canDrag,
  });
  const done = task.status === "DONE";
  const due = dueInfo(task);

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...(canDrag ? attributes : {})}
      {...(canDrag ? listeners : {})}
      onClick={() => {
        if (!overlay) onSelectTask(task);
      }}
      onKeyDown={(e) => {
        if (!overlay && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelectTask(task);
        }
      }}
      tabIndex={overlay ? -1 : 0}
      role="button"
      aria-label={`Task ${task.title}`}
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800",
        !overlay && "hover:border-blue-400 dark:hover:border-blue-500",
        isDragging && "opacity-40",
        overlay && "shadow-xl",
        canDrag && !overlay ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      )}
    >
      <h4
        className={cn(
          "text-sm font-semibold leading-snug",
          done ? "text-slate-400 line-through" : "text-slate-900 dark:text-slate-100"
        )}
      >
        {task.title}
      </h4>
      {task.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {task.labels.slice(0, 2).map((label) => (
            <span
              key={label.id}
              className="rounded-md px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: `${label.color}1a`, color: label.color }}
            >
              #{label.name}
            </span>
          ))}
          {task.labels.length > 2 && (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
              +{task.labels.length - 2}
            </span>
          )}
        </div>
      )}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        {task.assignee ? (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <UserAvatar
              name={task.assignee.name}
              image={task.assignee.avatarUrl}
              size="sm"
              className="h-6 w-6 text-[10px]"
            />
            <span className="truncate text-xs text-slate-500 dark:text-slate-400">
              {task.assignee.name.split(" ")[0]}
            </span>
          </span>
        ) : (
          <span className="text-xs text-slate-400">Tanpa penanggung jawab</span>
        )}
        <span className="inline-flex shrink-0 items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {task.commentCount > 0 && (
            <span className="inline-flex items-center gap-1" aria-label={`${task.commentCount} komentar`}>
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              {task.commentCount}
            </span>
          )}
          {due && (
            <span className={cn("inline-flex items-center gap-1", due.tone)} aria-label={due.ariaLabel}>
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {due.label}
            </span>
          )}
        </span>
      </div>
    </article>
  );
}

export function dueInfo(task: BoardTask): { label: string; ariaLabel: string; tone: string } | null {
  if (!task.dueDate) return null;
  const done = task.status === "DONE";
  const diff = wibDayDiff(new Date(), new Date(task.dueDate));
  const label = formatDayMonthWib(new Date(task.dueDate));
  if (diff < 0 && !done) {
    return {
      label: `Terlambat · ${label}`,
      ariaLabel: `Terlambat, jatuh tempo ${label}`,
      tone: "font-semibold text-red-600 dark:text-red-400",
    };
  }
  if (!done && diff <= 3) {
    return {
      label,
      ariaLabel: `Jatuh tempo ${label}`,
      tone: "font-semibold text-amber-600 dark:text-amber-400",
    };
  }
  return { label, ariaLabel: `Jatuh tempo ${label}`, tone: "" };
}
