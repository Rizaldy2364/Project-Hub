"use client";

import { Users } from "lucide-react";

export function TeamEmpty() {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <Users className="h-5 w-5 text-slate-400" />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
        Tidak ada anggota yang cocok
      </p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Coba ubah kata kunci, filter peran, atau project lain.
      </p>
    </div>
  );
}

export function TeamSkeleton() {
  return (
    <div className="mt-4 space-y-3" aria-label="Memuat anggota">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  );
}

export function TeamError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Coba lagi
      </button>
    </div>
  );
}
