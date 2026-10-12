import { useMemo } from "react";
import {
  endOfMonth,
  endOfWeek,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { cn, toDayKey } from "@/lib/utils";
import { TaskChip } from "@/components/calendar/task-chip";
import type { CalendarTask } from "@/types";

const weekdayLabels = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];

/** Maksimal chip tampil per sel hari; sisanya diringkas jadi "+N lagi". */
const MAX_CHIPS_PER_DAY = 3;

interface MonthGridProps {
  /** Bulan aktif yang sedang ditampilkan (sembarang tanggal di dalam bulan tsb). */
  month: Date;
  tasks: CalendarTask[];
  onSelectTask: (task: CalendarTask) => void;
}

/** Grid bulan 7 kolom (Sen–Min) berisi chip task per hari. */
export function MonthGrid({ month, tasks, onSelectTask }: MonthGridProps) {
  // Rentang hari yang ditampilkan: dari Sen awal minggu pertama
  // sampai Min akhir minggu terakhir (selalu kelipatan 7 hari).
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const result: Date[] = [];
    for (let day = start; day <= end; day.setDate(day.getDate() + 1)) {
      result.push(new Date(day));
    }
    return result;
  }, [month]);

  // Kelompokkan task per tanggal (hanya tanggal saja, abaikan jam).
  const tasksByDay = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    for (const task of tasks) {
      const key = toDayKey(new Date(task.dueDate));
      const list = map.get(key);
      if (list) list.push(task);
      else map.set(key, [task]);
    }
    return map;
  }, [tasks]);

  return (
    <>
      {/* Header hari */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Sel hari */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayTasks = tasksByDay.get(toDayKey(day)) ?? [];
          const inMonth = isSameMonth(day, month);
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[92px] border-b border-r border-slate-100 p-1.5 last:border-r-0 dark:border-slate-800/60",
                !inMonth && "bg-slate-50/60 dark:bg-slate-950/40"
              )}
            >
              <div className="mb-1 flex justify-center sm:justify-start">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    today
                      ? "bg-blue-600 text-white"
                      : inMonth
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-400 dark:text-slate-600"
                  )}
                >
                  {day.getDate()}
                </span>
              </div>

              <div className="space-y-1">
                {dayTasks.slice(0, MAX_CHIPS_PER_DAY).map((task) => (
                  <TaskChip
                    key={task.id}
                    title={task.title}
                    status={task.status}
                    onClick={() => onSelectTask(task)}
                  />
                ))}
                {dayTasks.length > MAX_CHIPS_PER_DAY && (
                  <p className="px-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    +{dayTasks.length - MAX_CHIPS_PER_DAY} lagi
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
