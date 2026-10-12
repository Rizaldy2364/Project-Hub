"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { MyTaskRow } from "@/components/tasks/my-task-row";
import type { MyTaskItem, MyTasksProjectGroup } from "@/types";

/** Satu grup project collapsible: header + progress + daftar task. */
export function ProjectGroup({
  group,
  open,
  onToggle,
}: {
  group: MyTasksProjectGroup;
  open: boolean;
  onToggle: () => void;
}) {
  const percent =
    group.taskTotal === 0 ? 0 : Math.round((group.taskDone / group.taskTotal) * 100);
  const avatars = group.tasks
    .map((t: MyTaskItem) => t.assignee)
    .filter((a): a is NonNullable<typeof a> => !!a)
    .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i)
    .slice(0, 2);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
            {group.name}
          </span>
          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
            {group.description || "Belum ada deskripsi"}
          </span>
        </span>
        <span className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
          {group.taskTotal} task
        </span>
        <span className="w-10 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">
          {percent}%
        </span>
        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <span
            className="block h-full rounded-full bg-emerald-500"
            style={{ width: `${percent}%` }}
          />
        </span>
        <span className="flex items-center">
          {avatars.map((a, i) => (
            <UserAvatar
              key={a.id}
              name={a.name}
              image={a.avatarUrl}
              size="sm"
              className={cn(
                "h-6 w-6 text-[10px] ring-2 ring-white dark:ring-slate-900",
                i > 0 && "-ml-2"
              )}
            />
          ))}
        </span>
      </button>
      {open && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          <div className="hidden grid-cols-[auto_1fr_140px_110px_90px_110px] gap-4 px-6 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 md:grid">
            <span className="w-5" />
            <span>Task</span>
            <span>Ditugaskan</span>
            <span>Prioritas</span>
            <span>Tenggat</span>
            <span>Status</span>
          </div>
          <div className="px-2 pb-2">
            {group.tasks.map((task) => (
              <MyTaskRow key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
