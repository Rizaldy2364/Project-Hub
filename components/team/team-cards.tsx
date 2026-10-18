export function TeamHeader({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-sm text-slate-500 dark:text-[#8B96AD]">
        Kelola anggota dan peran di project ini.
      </p>
    );
  }
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
        Tim &amp; Anggota
      </h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-[#8B96AD]">
        Kelola anggota dan peran untuk setiap project.
      </p>
    </div>
  );
}
