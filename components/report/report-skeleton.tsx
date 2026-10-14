/** Skeleton halaman /laporan — dipakai route-level loading.tsx. */
export function ReportPageSkeleton() {
  return (
    <div
      className="mx-auto max-w-[1400px] animate-pulse space-y-6"
      aria-label="Memuat laporan"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-80 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 w-36 rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>

      {/* KPI 2x2 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-slate-200 bg-white dark:border-white/[.08] dark:bg-[#131A2B]"
          />
        ))}
      </div>

      {/* Baris 2 */}
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="h-72 rounded-2xl border border-slate-200 bg-white dark:border-white/[.08] dark:bg-[#131A2B]" />
        <div className="h-72 rounded-2xl border border-slate-200 bg-white dark:border-white/[.08] dark:bg-[#131A2B]" />
      </div>

      {/* Baris 3 */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-[380px] rounded-2xl border border-slate-200 bg-white dark:border-white/[.08] dark:bg-[#131A2B]" />
        <div className="h-[380px] rounded-2xl border border-slate-200 bg-white dark:border-white/[.08] dark:bg-[#131A2B]" />
      </div>

      {/* Baris 4 */}
      <div className="h-64 rounded-2xl border border-slate-200 bg-white dark:border-white/[.08] dark:bg-[#131A2B]" />
    </div>
  );
}
