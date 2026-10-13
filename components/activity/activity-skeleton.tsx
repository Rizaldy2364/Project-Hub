/** Skeleton halaman /aktivitas — dipakai route-level loading.tsx. */
export function ActivityPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6" aria-label="Memuat aktivitas">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-72 rounded bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
        ))}
        <div className="ml-auto h-10 w-72 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/[.08] dark:bg-[#131A2B]">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-[#0F1524]" />
          ))}
        </div>
        <div className="space-y-6">
          <div className="h-60 rounded-2xl border border-slate-200 bg-white dark:border-white/[.08] dark:bg-[#131A2B]" />
          <div className="h-60 rounded-2xl border border-slate-200 bg-white dark:border-white/[.08] dark:bg-[#131A2B]" />
        </div>
      </div>
    </div>
  );
}
