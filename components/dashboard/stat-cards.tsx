import {
  CircleCheck,
  ClipboardList,
  FolderKanban,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

interface StatCardsProps {
  projects: number;
  pendingTasks: number;
  doneTasks: number;
  totalAssignedTasks: number;
  teammates: number;
}

interface StatCard {
  icon: LucideIcon;
  value: string | number;
  label: string;
  iconClassName: string;
}

/** Empat kartu ringkasan di bagian atas dashboard. */
export function StatCards({
  projects,
  pendingTasks,
  doneTasks,
  totalAssignedTasks,
  teammates,
}: StatCardsProps) {
  const cards: StatCard[] = [
    {
      icon: FolderKanban,
      value: projects,
      label: "Project Diikuti",
      iconClassName: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
    },
    {
      icon: ClipboardList,
      value: pendingTasks,
      label: "Task Menunggu",
      iconClassName: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
    },
    {
      icon: CircleCheck,
      value: `${doneTasks}/${totalAssignedTasks}`,
      label: "Task Saya Selesai",
      iconClassName: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    },
    {
      icon: UsersRound,
      value: teammates,
      label: "Rekan Tim",
      iconClassName: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
    },
  ];

  return (
    <section aria-label="Ringkasan" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ icon: Icon, value, label, iconClassName }) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
        >
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClassName}`}
            aria-hidden="true"
          >
            <Icon className="h-4 w-4" />
          </span>
          <p className="mt-4 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      ))}
    </section>
  );
}