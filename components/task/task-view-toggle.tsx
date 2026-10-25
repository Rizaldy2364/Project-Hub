"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BoardTaskStatus } from "@/types";

export type TaskViewValue = "board" | "list";

export const TASK_VIEW_STORAGE_KEY = "projecthub:task-view";

const VIEW_OPTIONS: { value: TaskViewValue; label: string; Icon: typeof LayoutGrid }[] = [
  { value: "board", label: "Tampilan board", Icon: LayoutGrid },
  { value: "list", label: "Tampilan list", Icon: List },
];

interface TaskViewToggleProps {
  view: TaskViewValue;
  onChange: (view: TaskViewValue) => void;
}

/** Segmented control "Board | Daftar" — mengikuti style toggle view di dashboard. */
export function TaskViewToggle({ view, onChange }: TaskViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Tampilan task"
      className="flex shrink-0 rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900"
    >
      {VIEW_OPTIONS.map(({ value, label, Icon }) => {
        const active = view === value;
        return (
          <button
            key={value}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={() => onChange(value)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              active
                ? "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}

export type { BoardTaskStatus };
