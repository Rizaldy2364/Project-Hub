import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface DashboardHeaderProps {
  name: string;
}

/** Header dashboard: tanggal, sapaan, dan deskripsi singkat. */
export function DashboardHeader({ name }: DashboardHeaderProps) {
  const firstName = name.split(" ")[0];
  const today = new Date();

  return (
    <section>
      <div className="min-w-0">
        <p
          suppressHydrationWarning
          className="text-xs font-medium text-slate-500 dark:text-slate-400"
        >
          {format(today, "EEEE, d MMMM yyyy", { locale: idLocale })}
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          Selamat datang kembali, {firstName}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Kelola semua project, task, dan kolaborasi tim Anda dalam satu tempat.
        </p>
      </div>
    </section>
  );
}