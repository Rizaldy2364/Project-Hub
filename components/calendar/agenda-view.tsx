import { useMemo } from "react";
import { format, isSameMonth, isToday } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { toDayKey } from "@/lib/utils";
import { AgendaCard } from "@/components/calendar/agenda-card";
import type { CalendarTask } from "@/types";

interface AgendaViewProps {
  /** Bulan aktif yang menjadi cakupan daftar agenda. */
  month: Date;
  tasks: CalendarTask[];
  onSelectTask: (task: CalendarTask) => void;
}

interface AgendaGroup {
  date: Date;
  items: CalendarTask[];
}

/** Tampilan agenda: daftar task ber-due date dikelompokkan per tanggal (bulan aktif). */
export function AgendaView({ month, tasks, onSelectTask }: AgendaViewProps) {
  const groups = useMemo<AgendaGroup[]>(() => {
    const inMonth = tasks.filter((task) =>
      isSameMonth(new Date(task.dueDate), month)
    );
    const map = new Map<string, AgendaGroup>();
    for (const task of inMonth) {
      const date = new Date(task.dueDate);
      const key = toDayKey(date);
      const group = map.get(key);
      if (group) group.items.push(task);
      else map.set(key, { date, items: [task] });
    }
    return [...map.values()]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((group) => ({
        ...group,
        items: [...group.items].sort(
          (a, b) => +new Date(a.dueDate) - +new Date(b.dueDate)
        ),
      }));
  }, [tasks, month]);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          <CalendarDays className="h-6 w-6" />
        </span>
        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
          Tidak ada tenggat di bulan ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-5">
      {groups.map((group) => (
        <div key={toDayKey(group.date)}>
          <div className="mb-2 flex items-center gap-2">
            <span
              suppressHydrationWarning
              className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {format(group.date, "d MMMM yyyy", { locale: idLocale })}
            </span>
            {isToday(group.date) && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                Hari ini
              </span>
            )}
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {group.items.length} task
            </span>
          </div>
          <div className="space-y-2">
            {group.items.map((task) => (
              <AgendaCard
                key={task.id}
                task={task}
                showDueDate
                onClick={() => onSelectTask(task)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}