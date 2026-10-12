export function TeamHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
        Tim &amp; Anggota
      </h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-[#8B96AD]">
        Kelola anggota, peran, dan undangan untuk setiap project.
      </p>
    </div>
  );
}

export function RoleRightsCard() {
  const cols = [
    {
      title: "Admin",
      items: [
        "Mengelola project dan pengaturannya",
        "Mengundang dan menghapus anggota",
        "Memberi atau mencabut peran Wakil Admin",
        "Membuat, menugaskan, dan menghapus task",
      ],
    },
    {
      title: "Wakil Admin",
      items: [
        "Membuat dan menugaskan task menggantikan Admin",
        "Mengedit task di project",
        "Tidak bisa mengubah peran atau menghapus anggota",
      ],
    },
    {
      title: "Member",
      items: [
        "Mengerjakan task yang ditugaskan",
        "Mengubah status dan berkomentar di task",
        "Melihat anggota dan progres project",
      ],
    },
  ];
  return (
    <section
      aria-label="Hak akses peran"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Hak akses peran
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Peran Wakil Admin hanya bisa diberikan atau dicabut oleh Admin, dan hanya untuk Member project.
        </p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {cols.map((col) => (
          <div
            key={col.title}
            className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/[0.06] dark:bg-[#0F1524]"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#E6EAF2]">
              {col.title}
            </h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {col.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}