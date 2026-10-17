"use client";

import { KanbanSquare, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type TaskViewValue = "board" | "list";

interface TaskViewToggleProps {
  value: TaskViewValue;
  onChange: (next: TaskViewValue) => void;
}

const OPTIONS: { value: TaskViewValue; label: string; Icon: typeof List }[] = [
  { value: "board", label: "Board", Icon: KanbanSquare },
  { value: "list", label: "Daftar", Icon: List },
];

/** Segmented control "Board | Daftar" di toolbar tab Task (URL = sumber kebenaran). */
export function TaskViewToggle({ value, onChange }: TaskViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Tampilan task"
      className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800"
    >
      {OPTIONS.map(({ value: option, label, Icon }) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={active}
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
