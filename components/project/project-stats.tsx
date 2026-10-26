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
      label: "Total Project yang Diikuti",
      iconClassName:
        "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
    },
    {
      icon: ShieldCheck,
      value: adminCount,
      label: "Project yang Saya Buat",
      iconClassName:
        "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
    },
    {
      icon: UsersRound,
      value: memberCount,
      label: "Project yang Saya Ikuti",
      iconClassName:
        "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
    },
    {
      icon: CircleCheck,
      value: completedCount,
      label: "Semua Task yang Selesai",
      iconClassName:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    },
  ];

  return (
    <section
      aria-label="Ringkasan project"
      className="grid grid-cols-2 gap-4 xl:grid-cols-4"
    >
      {cards.map(({ icon: Icon, value, label, iconClassName }) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[.08] dark:bg-[#131A2B]"
        >
          <div className="flex items-start gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
              aria-hidden="true"
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-lg text-slate-900 dark:text-white">
                {value}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
