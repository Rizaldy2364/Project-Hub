import { CircleCheck, ClipboardList, Timer, Zap, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MyTasksStatCardsProps {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

/** Empat kartu ringkasan status task. */
export function MyTasksStatCards({ total, todo, inProgress, done }: MyTasksStatCardsProps) {
  const cards: { label: string; value: number; icon: LucideIcon; iconClassName: string }[] = [
    {
      label: "Total Task",
      value: total,
      icon: ClipboardList,
      iconClassName: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
    },
    {
      label: "Belum",
      value: todo,
      icon: Timer,
      iconClassName: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
    },
    {
      label: "Dikerjakan",
      value: inProgress,
      icon: Zap,
      iconClassName: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
    },
    {
      label: "Selesai",
      value: done,
      icon: CircleCheck,
      iconClassName: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    },
  ];

  return (
    <section aria-label="Ringkasan task" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, iconClassName }) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <span
            className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconClassName)}
            aria-hidden="true"
          >
            <Icon className="h-4 w-4" />
          </span>
          <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
        </div>
      ))}
    </section>
  );
}
