import type { ReactNode } from "react";

interface ReportCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Konten tambahan di kanan header (mis. legend). */
  headerExtra?: ReactNode;
  className?: string;
}

/** Kartu standar halaman /laporan (border & tema mengikuti app). */
export function ReportCard({
  title,
  subtitle,
  children,
  headerExtra,
  className,
}: ReportCardProps) {
  return (
    <section
      className={`flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[.08] dark:bg-[#131A2B] ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        {headerExtra}
      </div>
      <div className="mt-4 flex-1">{children}</div>
    </section>
  );
}

/** Empty state per kartu. */
export function ReportCardEmpty() {
  return (
    <p className="flex h-full min-h-32 items-center justify-center text-center text-xs text-slate-400 dark:text-slate-500">
      Belum ada data untuk ditampilkan
    </p>
  );
}
