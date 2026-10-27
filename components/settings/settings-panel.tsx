"use client";

import { cn } from "@/lib/utils";

/**
 * Kartu section Pengaturan: <section id=… aria-labelledby=…> dengan header
 * (judul 18px bold + deskripsi satu baris + aksi opsional), baris pengaturan,
 * dan footer bar opsional. Halaman Pengaturan merender SEMUA section sekaligus
 * dalam satu halaman panjang; `id` dipakai scroll-anchoring menu (SettingsNav),
 * dan judulnya bisa difokus (tabindex -1) dari menu.
 */
export function SettingsPanel({
  id,
  title,
  description,
  headerAction,
  children,
  footer,
  danger = false,
}: {
  id: string;
  title: string;
  description: string;
  /** Kontrol di kanan header (mis. tombol "Label baru"). */
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  /** Footer bar (tombol Batal/Simpan) di bawah kartu. */
  footer?: React.ReactNode;
  /** Section zona berbahaya: border merah tipis + header bertint merah. */
  danger?: boolean;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        "flex w-full min-w-0 max-w-full scroll-mt-[124px] flex-col overflow-hidden rounded-2xl border bg-white shadow-sm lg:scroll-mt-20 dark:bg-[#131A2B]",
        danger
          ? "border-red-500/35"
          : "border-slate-200 dark:border-white/[0.08]"
      )}
    >
      <header
        className={cn(
          "flex flex-wrap items-start justify-between gap-3 rounded-t-2xl border-b border-slate-200 px-4 py-5 sm:px-7 dark:border-white/[0.08]",
          danger && "bg-red-500/[0.04]"
        )}
      >
        <div className="min-w-0">
          <h2
            id={`${id}-title`}
            data-section-heading
            tabIndex={-1}
            className={cn(
              "text-lg font-bold text-slate-900 outline-none dark:text-[#E6EAF2]",
              danger && "text-red-700 dark:text-red-400"
            )}
          >
            {title}
          </h2>
          <p className="mt-1 break-words text-sm text-slate-500 dark:text-[#8B96AD]">
            {description}
          </p>
        </div>
        {headerAction}
      </header>
      <div className="flex-1">{children}</div>
      {footer && (
        <footer className="flex flex-wrap items-center justify-end gap-3 rounded-b-2xl border-t border-slate-200 px-4 py-4 sm:px-7 dark:border-white/[0.08]">
          {footer}
        </footer>
      )}
    </section>
  );
}

/**
 * Baris pengaturan pola grid label 240px / kontrol 1fr (gap 24px, padding
 * 20px 28px, pemisah antar baris). Di layar sempit menumpuk jadi satu kolom.
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
        "grid min-w-0 grid-cols-1 gap-4 border-b border-slate-100 px-4 py-5 last:border-b-0 sm:px-7 md:grid-cols-[240px_1fr] md:gap-6 dark:border-white/[0.06]",
        className
      )}
    >
      <div className="min-w-0">
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
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-[#8B96AD]">
            {help}
          </p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
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
