"use client";

import { useTransition, type MouseEvent } from "react";
import { format } from "date-fns";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { updateTaskAction } from "@/actions/task.actions";
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
      className="group flex flex-col md:flex-row md:items-center gap-3 md:gap-4 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors border-b border-transparent md:border-slate-100 dark:md:border-slate-800/50 last:border-transparent cursor-pointer"
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

      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-semibold truncate ${done ? "text-slate-400 line-through" : "text-slate-900 dark:text-slate-100"}`}>
          {task.title}
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:gap-4 shrink-0">
        {task.labels.length > 0 && (
          <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {task.labels[0].name}
          </span>
        )}

        <span className={`w-24 text-center px-2.5 py-1.5 text-[10px] font-bold rounded-md tracking-wide ${done ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : inProgress ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
          {done ? "DONE" : inProgress ? "IN PROGRESS" : "TO DO"}
        </span>

        <div className="flex items-center gap-2 w-36">
          {task.assignee ? (
            <>
              <UserAvatar name={task.assignee.name} image={task.assignee.avatarUrl} size="sm" className="w-6 h-6" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{task.assignee.name}</span>
            </>
          ) : (
            <span className="text-xs text-slate-500">Unassigned</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 w-20 justify-end shrink-0">
          <CalendarDays className="w-3.5 h-3.5 opacity-70" />
          {task.dueDate ? (
            <span>{format(new Date(task.dueDate), "dd MMM")}</span>
          ) : (
            <span className="text-slate-400" title="Tanpa tenggat">—</span>
          )}
        </div>

        <button 
          type="button"
          onClick={(event) => { event.stopPropagation(); onClick(); }}
          aria-label={`Lihat detail task ${task.title}`}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
        >
          Detail
        </button>
      </div>
    </div>
  );
}
