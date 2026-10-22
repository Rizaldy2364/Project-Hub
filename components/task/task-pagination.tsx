"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskPaginationProps {
  total: number;
  pageSize: 10 | 25 | 50;
  safePage: number;
  from: number;
  to: number;
  totalPages: number;
  pageNumbers: number[];
  pushQuery: (next: Record<string, string>) => void;
}

export function TaskPagination(p: TaskPaginationProps) {
  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Menampilkan {p.from}–{p.to} dari {p.total} task
      </p>
      <div className="flex items-center gap-2">
        <label className="relative inline-flex items-center">
          <select
            value={String(p.pageSize)}
            onChange={(e) =>
              p.pushQuery({ pageSize: e.target.value, page: "1" })
            }
            aria-label="Jumlah per halaman"
            className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="10">10 per halaman</option>
            <option value="25">25 per halaman</option>
            <option value="50">50 per halaman</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-400" />
        </label>
        <button
          type="button"
          disabled={p.safePage <= 1}
          onClick={() => p.pushQuery({ page: String(p.safePage - 1) })}
          aria-label="Halaman sebelumnya"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {p.pageNumbers.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => p.pushQuery({ page: String(n) })}
            aria-label={`Halaman ${n}`}
            aria-current={n === p.safePage ? "page" : undefined}
            className={cn(
              "h-9 min-w-9 rounded-xl px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              n === p.safePage
                ? "bg-blue-600 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          disabled={p.safePage >= p.totalPages}
          onClick={() => p.pushQuery({ page: String(p.safePage + 1) })}
          aria-label="Halaman berikutnya"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}