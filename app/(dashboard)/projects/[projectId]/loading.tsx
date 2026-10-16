/** Skeleton header + isi untuk semua tab project (route-level loading). */
export default function ProjectLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Memuat project">
      {/* Header skeleton */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800 mb-4" />
        <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-800 mb-2" />
        <div className="h-4 w-64 rounded bg-slate-200 dark:bg-slate-800 mb-4" />
        <div className="flex gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1">
            <div className="h-9 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-10 w-32 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-7 min-w-[120px] rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
          <div className="h-7 w-20 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
          <div className="h-7 w-32 rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
      </section>

      {/* Progress strip skeleton */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="h-6 w-40 rounded-lg bg-slate-200 dark:bg-slate-800 mb-3" />
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div className="h-full w-3/4 bg-slate-300 dark:bg-slate-600" />
        </div>
        <div className="mt-3 flex gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <div className="h-1.5 w-2 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-5 w-16 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </section>

      {/* Tab bar skeleton */}
      <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
        <div className="flex gap-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <section key={i} className="space-y-4">
              <div className="h-6 w-1/3 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-72 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-5 w-full rounded bg-slate-200 dark:bg-slate-800 mb-3" />
              <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
            </section>
          ))}
        </div>
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <section key={i} className="h-72 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      </div>
    </div>
  );
}