"use client";

import { KanbanSquare, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type TaskViewValue = "board" | "list";

interface TaskViewToggleProps {
  value: TaskViewValue;
  onChange: (next: TaskViewValue) => void;
}

const OPTIONS: { value: TaskViewValue; label: string; Icon: typeof List }[] = [
  { value: "board", label: "Tampilan board", Icon: KanbanSquare },
  { value: "list", label: "Tampilan list", Icon: List },
];

/** Segmented control "Board | Daftar" — mengikuti style toggle view di dashboard. */
export function TaskViewToggle({ value, onChange }: TaskViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Tampilan task"
      className="flex rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900"
    >
      {OPTIONS.map(({ value: option, label, Icon }) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={() => onChange(option)}
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
