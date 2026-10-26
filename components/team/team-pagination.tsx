"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  /** Kata benda untuk teks ringkasan dan aria-label, mis. "task" atau "anggota". */
  label: string;
  total: number;
  pageSize: 10 | 25 | 50;
  safePage: number;
  from: number;
  to: number;
  totalPages: number;
  pushQuery: (next: Record<string, string>) => void;
}

/**
 * Footer pagination tunggal yang dipakai bersama tabel anggota (Anggota tab &
 * /tim) dan daftar task (view Daftar di tab Task project).
 *
 * Tidak ada tombol nomor halaman — hanya [‹] [halaman saat ini] [›].
 * Indikator halaman bukan tombol (bukan interaktif, tidak dapat difokuskan).
 */
export function Pagination(p: PaginationProps) {
  const kosong = p.total === 0;
  return (
    <nav aria-label={`Paginasi ${p.label}`}>
      <div
        className={cn(
          "border-t border-slate-100 bg-transparent px-4 py-4 sm:px-6",
          "dark:border-[rgba(255,255,255,.08)]"
        )}
      >
        {/* Desktop: teks ringkasan */}
        <p
          aria-live="polite"
          className="hidden text-[13px] text-slate-500 lg:block dark:text-slate-400 mb-3"
        >
          {kosong
            ? `Tidak ada ${p.label}`
            : `Menampilkan ${p.from}–${p.to} dari ${p.total} ${p.label}`}
        </p>

        {/* Kontrol pagination: page-size kiri, navigasi kanan */}
        <div className="flex items-center justify-between gap-3">
          <label className="relative inline-flex items-center">
            <select
              value={String(p.pageSize)}
              onChange={(e) =>
                p.pushQuery({ pageSize: e.target.value, page: "1" })
              }
              aria-label="Jumlah per halaman"
              className={cn(
                "h-10 rounded-xl appearance-none pl-3 pr-8 text-[13px] font-medium outline-none",
                "border border-slate-200 bg-white text-slate-700",
                "dark:border-[rgba(255,255,255,.12)] dark:bg-slate-900 dark:text-slate-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B66EE]"
              )}
            >
              <option value="10">10 per halaman</option>
              <option value="25">25 per halaman</option>
              <option value="50">50 per halaman</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-400"
              aria-hidden
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={p.safePage <= 1}
              onClick={() => p.pushQuery({ page: String(p.safePage - 1) })}
              aria-label="Halaman sebelumnya"
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                "border border-slate-200 bg-transparent text-slate-600",
                "dark:border-[rgba(255,255,255,.12)] dark:text-slate-400",
                "transition-colors",
                "hover:bg-white/5 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B66EE]",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-current"
              )}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <div
              aria-label={`Halaman ${p.safePage} dari ${p.totalPages}`}
              className="h-10 w-10 rounded-xl bg-[#3B66EE] flex items-center justify-center text-sm font-semibold text-white"
            >
              {p.safePage}
            </div>
            <button
              type="button"
              disabled={p.safePage >= p.totalPages}
              onClick={() => p.pushQuery({ page: String(p.safePage + 1) })}
              aria-label="Halaman berikutnya"
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                "border border-slate-200 bg-transparent text-slate-600",
                "dark:border-[rgba(255,255,255,.12)] dark:text-slate-400",
                "transition-colors",
                "hover:bg-white/5 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B66EE]",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-current"
              )}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
