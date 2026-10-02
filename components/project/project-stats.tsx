import {
  CircleCheck,
  FolderKanban,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

interface ProjectStatsProps {
  total: number;
  adminCount: number;
  memberCount: number;
  completedCount: number;
}

interface ProjectStat {
  icon: LucideIcon;
  value: number;
  label: string;
  description: string;
  iconClassName: string;
}

/** Empat kartu ringkasan di halaman Project Saya. */
export function ProjectStats({
  total,
  adminCount,
  memberCount,
  completedCount,
}: ProjectStatsProps) {
  const cards: ProjectStat[] = [
    {
      icon: FolderKanban,
      value: total,
      label: "Total Project",
      description: "Yang kamu ikuti",
      iconClassName:
        "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
    },
    {
      icon: ShieldCheck,
      value: adminCount,
      label: "Sebagai Admin",
      description: "Project yang kamu kelola",
      iconClassName:
        "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
    },
    {
      icon: UsersRound,
      value: memberCount,
      label: "Sebagai Member",
      description: "Diundang oleh admin lain",
      iconClassName:
        "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
    },
    {
      icon: CircleCheck,
      value: completedCount,
      label: "Project Selesai",
      description: "Semua task rampung",
      iconClassName:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    },
  ];

  return (
    <section
      aria-label="Ringkasan project"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map(({ icon: Icon, value, label, description, iconClassName }) => (
        <div
          key={label}
          className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
        >
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-bold leading-none text-slate-950 dark:text-white">
              {value}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {label}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
