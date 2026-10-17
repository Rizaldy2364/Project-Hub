"use client";

import { useMemo } from "react";
import { Search } from "lucide-react";
import { TaskRow } from "@/components/board/task-row";
import { cn } from "@/lib/utils";
import type { BoardTask } from "@/types";

interface BoardViewProps {
  /** Sudah difilter oleh shell; ditampilkan apa adanya. */
  tasks: BoardTask[];
  onSelectTask: (task: BoardTask) => void;
  /** Saat true, tampilkan skeleton loader alih-apas daftar kosong. */
  loading?: boolean;
}

/** Daftar task (view "Daftar"): filter sudah diterapkan shell, ini hanya merender. */
export function BoardView({ tasks, onSelectTask, loading = false }: BoardViewProps) {
  if (loading) {
    return (
      <section className="mt-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="p-2 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-xl animate-pulse bg-slate-200 dark:bg-slate-800/50" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Task List" className="mt-6">
      <div className="rounded-2xl bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-200 overflow-hidden shadow-sm dark:shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="p-2">
          {tasks.length ? (
            tasks.map((task) => (
              <TaskRow key={task.id} task={task} onClick={() => onSelectTask(task)} />
            ))
          ) : (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Belum ada task
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/** Select filter (digunakan kembali toolbar shell). */
export interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  icon: typeof Search;
  label: string;
  options: { value: string; label: string }[];
}

export function FilterSelect({ value, onChange, icon: Icon, label, options }: FilterSelectProps) {
  return (
    <label className="relative shrink-0">
      <Icon className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs font-semibold text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30",
          "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        )}
      >
        <option value="" disabled>{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <span className="sr-only">{label}</span>
    </label>
  );
}
