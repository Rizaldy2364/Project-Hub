"use client";

import { useTransition, type MouseEvent } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarDays, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { updateTaskAction } from "@/actions/task.actions";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import type { MyTaskItem } from "@/types";

const statusConfig = {
  TODO: {
    label: "Belum",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  IN_PROGRESS: {
    label: "Dikerjakan",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  DONE: {
    label: "Selesai",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
} as const;

/** Satu baris task di halaman Task Project: checkbox, assignee, prioritas, tenggat, status. */
export function MyTaskRow({ task }: { task: MyTaskItem }) {
  const [isPending, startTransition] = useTransition();
  const done = task.status === "DONE";
  const status = statusConfig[task.status];

  const toggleDone = (event: MouseEvent) => {
    event.stopPropagation();
    if (isPending) return;
    startTransition(async () => {
      const data = new FormData();
      data.set("status", done ? "TODO" : "DONE");
      await updateTaskAction(task.id, data);
    });
  };

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 rounded-xl px-3 py-3 transition-colors hover:bg-slate-50 md:grid-cols-[auto_1fr_140px_110px_90px_110px] md:gap-4 dark:hover:bg-slate-800/50">
      <button
        type="button"
        onClick={toggleDone}
        disabled={isPending}
        aria-label={done ? "Tandai task belum selesai" : "Tandai task selesai"}
        aria-pressed={done}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all disabled:opacity-50",
          done
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-slate-300 text-transparent hover:border-emerald-500 dark:border-slate-600"
        )}
      >
        {done && <Check className="h-3 w-3" />}
      </button>

      <h3
        className={cn(
          "min-w-0 truncate text-sm font-medium",
          done ? "text-slate-400 line-through" : "text-slate-900 dark:text-slate-100"
        )}
      >
        {task.title}
      </h3>

      <div className="col-start-2 flex items-center gap-2 md:col-start-auto">
        {task.assignee ? (
          <>
            <UserAvatar
              name={task.assignee.name}
              image={task.assignee.avatarUrl}
              size="sm"
              className="h-6 w-6 text-[10px]"
            />
            <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
              {task.assignee.name}
            </span>
          </>
        ) : (
          <span className="text-xs text-slate-400">Tanpa assignee</span>
        )}
      </div>

      <div className="col-start-2 md:col-start-auto">
        <PriorityBadge value={task.priority} />
      </div>

      <div className="col-start-2 flex items-center gap-1.5 text-xs text-slate-500 md:col-start-auto dark:text-slate-400">
        <CalendarDays className="h-3.5 w-3.5 opacity-70" />
        {task.dueDate ? (
          <span suppressHydrationWarning>
            {format(new Date(task.dueDate), "d MMM", { locale: idLocale })}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </div>

      <div className="col-start-2 md:col-start-auto">
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold",
            status.className
          )}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
}
