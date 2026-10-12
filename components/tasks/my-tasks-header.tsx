/** Header halaman Task Project: judul + deskripsi. */
export function MyTasksHeader({ total }: { total: number }) {
  return (
    <section>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Task Project
          </h1>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            {total} task
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Semua task dikelompokkan per project. Klik nama project untuk melihat
          task dan penanggung jawabnya.
        </p>
      </div>
    </section>
  );
}
