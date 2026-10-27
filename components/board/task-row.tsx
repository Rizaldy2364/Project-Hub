"use client";

import { useTransition, type MouseEvent } from "react";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { updateTaskAction } from "@/actions/task.actions";
import { formatDayMonthWib } from "@/lib/utils";
import { statusLabel } from "@/components/calendar/agenda-card";
import type { BoardTask } from "@/types";

interface TaskRowProps {
  task: BoardTask;
  onClick: () => void;
}

/** Satu baris task di Kanban Board: checkbox selesai, label, status, assignee, tenggat, tombol detail. */
export function TaskRow({ task, onClick }: TaskRowProps) {
  const [isPending, startTransition] = useTransition();
  const done = task.status === "DONE";
  const inProgress = task.status === "IN_PROGRESS";

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
    <div
      className="group grid grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 rounded-xl border-b border-transparent px-3 py-3 transition-colors hover:bg-slate-50 md:flex md:flex-row md:gap-4 md:border-slate-100 dark:hover:bg-slate-800/50 dark:md:border-slate-800/50 last:border-transparent cursor-pointer"
      onClick={onClick}
    >
      <button 
        type="button"
        onClick={toggleDone}
        disabled={isPending}
        aria-label={done ? "Tandai task belum selesai" : "Tandai task selesai"}
        aria-pressed={done}
        className="shrink-0 flex items-center justify-center w-5 h-5 rounded border border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 transition-all disabled:opacity-50"
        data-state={done ? "checked" : "unchecked"}
      >
        {done && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
      </button>

      <div className="col-start-2 min-w-0 flex-1">
        <h3 className={`text-sm font-semibold truncate ${done ? "text-slate-400 line-through" : "text-slate-900 dark:text-slate-100"}`}>
          {task.title}
        </h3>
      </div>

      <div className="col-start-2 flex shrink-0 flex-wrap items-center gap-2 md:col-auto md:gap-4">
        {task.labels.length > 0 && (
          <span className="order-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400 md:order-none">
            {task.labels[0].name}
          </span>
        )}

        <span className={`order-4 w-auto rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wide md:order-none md:w-24 md:py-1.5 md:text-center ${done ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : inProgress ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
          {statusLabel[task.status]}
        </span>

        <div className="order-1 flex basis-full items-center gap-2 md:order-none md:w-36 md:basis-auto">
          {task.assignee ? (
            <>
              <UserAvatar name={task.assignee.name} image={task.assignee.avatarUrl} size="sm" className="w-6 h-6" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{task.assignee.name}</span>
            </>
          ) : (
            <span className="text-xs text-slate-500">Belum ditugaskan</span>
          )}
        </div>

        <div className="order-3 flex w-auto shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500 md:order-none md:w-20 md:justify-end dark:text-slate-400">
          <CalendarDays className="w-3.5 h-3.5 opacity-70" />
          {task.dueDate ? (
            <span>{formatDayMonthWib(new Date(task.dueDate))}</span>
          ) : (
            <span className="text-slate-400" title="Tanpa tenggat">—</span>
          )}
        </div>

        <button 
          type="button"
          onClick={(event) => { event.stopPropagation(); onClick(); }}
          aria-label={`Lihat detail task ${task.title}`}
          className="order-5 ml-auto inline-flex rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 hover:text-slate-900 md:order-none md:ml-0 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
        >
          Detail
        </button>
      </div>
    </div>
  );
}
