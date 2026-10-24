"use client";

import { Plus, Search } from "lucide-react";
import { TaskRow } from "@/components/board/task-row";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { BoardTask } from "@/types";

interface BoardViewProps {
  /** Sudah difilter oleh shell; ditampilkan apa adanya. */
  tasks: BoardTask[];
  onSelectTask: (task: BoardTask) => void;
  /** Saat true, tampilkan skeleton loader alih-apas daftar kosong. */
  loading?: boolean;
  /** true hanya untuk ADMIN/MANAGER (canCreateTask) — baris tambah dirender. */
  canCreateTask?: boolean;
  /** Buka modal buat task (status "Belum"). */
  onAddTask?: () => void;
  /** Elemen (mis. pagination) yang di-render di dalam card sebagai anak terakhir. */
  footer?: ReactNode;
}

/** Daftar task (view "Daftar"): filter sudah diterapkan shell, ini hanya merender. */
export function BoardView({
  tasks,
  onSelectTask,
  loading = false,
  canCreateTask = false,
  onAddTask,
  footer,
}: BoardViewProps) {
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

  // Baris tambah di daftar paling bawah (langsung di atas footer pagination), juga
  // pada keadaan kosong. Satu-satunya tombol tambah di view Daftar; hanya untuk
  // ADMIN/MANAGER, tidak dirender untuk MEMBER/VIEWER.
  const addRow = canCreateTask && onAddTask ? (
    <button
      type="button"
      onClick={onAddTask}
      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-xs font-semibold text-slate-500 transition-colors hover:border-blue-500 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
    >
      <Plus className="h-3.5 w-3.5" aria-hidden />
      Tambah task
    </button>
  ) : null;

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
        {/* Baris tambah di daftar paling bawah (langsung di atas footer pagination),
            juga pada keadaan kosong. Hanya untuk ADMIN/MANAGER. */}
        {addRow && (
          <div className="px-4 py-3">{addRow}</div>
        )}
        {/* Footer pagination (mis. view Daftar) — anak terakhir card; sudut
            bawah card yang rounded-2xl + overflow-hidden memotongnya. */}
        {footer}
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
      <Icon
        className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs font-semibold text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30",
          "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
