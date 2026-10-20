"use client";

import { cn } from "@/lib/utils";

/**
 * Kartu panel Pengaturan: header (judul + deskripsi satu baris), lalu isi.
 * Dipakai tepat SATU kali per halaman (bagian aktif).
 */
export function SettingsPanel({
  title,
  description,
  headerAction,
  children,
  footer,
  danger = false,
}: {
  title: string;
  description: string;
  /** Kontrol di kanan header (mis. tombol "Label baru"). */
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  /** Footer bar (tombol Batal/Simpan) dirender sticky di bawah kartu. */
  footer?: React.ReactNode;
  /** Panel zona berbahaya: border merah tipis. */
  danger?: boolean;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-2xl border bg-white shadow-sm dark:bg-[#131A2B]",
        danger
          ? "border-red-300 dark:border-red-500/40"
          : "border-slate-200 dark:border-white/[0.08]"
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/[0.08]">
        <div className="min-w-0">
          <h2
            className={cn(
              "text-base font-bold text-slate-900 dark:text-[#E6EAF2]",
              danger && "text-red-700 dark:text-red-400"
            )}
          >
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-[#8B96AD]">
            {description}
          </p>
        </div>
        {headerAction}
      </header>
      <div className="flex-1 px-5 py-2">{children}</div>
      {footer && (
        <footer className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-white/[0.08] dark:bg-[#131A2B]/95">
          {footer}
        </footer>
      )}
    </section>
  );
}

/**
 * Baris pengaturan pola label-kiri / kontrol-kanan. Di layar sempit menumpuk.
 */
export function SettingRow({
  label,
  help,
  children,
  htmlFor,
  className,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between dark:border-white/[0.06]",
        className
      )}
    >
      <div className="min-w-0 sm:max-w-xs">
        {htmlFor ? (
          <label
            htmlFor={htmlFor}
            className="block text-sm font-semibold text-slate-900 dark:text-[#E6EAF2]"
          >
            {label}
          </label>
        ) : (
          <p className="block text-sm font-semibold text-slate-900 dark:text-[#E6EAF2]">
            {label}
          </p>
        )}
        {help && (
          <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-[#8B96AD]">
            {help}
          </p>
        )}
      </div>
      <div className="min-w-0 sm:flex-1 sm:text-right">{children}</div>
    </div>
  );
}

/** Input teks standar panel pengaturan. */
export function settingsInputClass(error?: boolean) {
  return cn(
    "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 sm:max-w-md dark:bg-[#0F1524] dark:text-[#E6EAF2] dark:placeholder:text-[#8B96AD]",
    error
      ? "border-red-400 dark:border-red-500/60"
      : "border-slate-200 dark:border-white/[0.08]"
  );
}
