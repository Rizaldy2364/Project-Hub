"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BoardTaskStatus } from "@/types";

export type TaskViewValue = "board" | "list";

export const TASK_VIEW_STORAGE_KEY = "projecthub:task-view";

const VIEW_OPTIONS: { value: TaskViewValue; label: string; Icon: typeof LayoutGrid }[] = [
  { value: "board", label: "Board", Icon: LayoutGrid },
  { value: "list", label: "Daftar", Icon: List },
];

interface TaskViewToggleProps {
  view: TaskViewValue;
  onChange: (view: TaskViewValue) => void;
}

/** Segmented control "Board | Daftar" — URL (?view=) adalah sumber kebenaran. */
export function TaskViewToggle({ view, onChange }: TaskViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Tampilan task"
      className="inline-flex h-10 shrink-0 items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/60"
    >
      {VIEW_OPTIONS.map(({ value, label, Icon }) => {
        const active = view === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              active
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export type { BoardTaskStatus };
