import { useMemo } from "react";
import { addDays, endOfDay, isToday, startOfDay, startOfWeek } from "date-fns";
import { cn, toDayKey } from "@/lib/utils";
import { TaskChip } from "@/components/calendar/task-chip";
import type { CalendarTask } from "@/types";

const weekdayLabels = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];

interface WeekViewProps {
  /** Titik acuan minggu yang sedang ditampilkan. */
  anchor: Date;
  tasks: CalendarTask[];
  onSelectTask: (task: CalendarTask) => void;
}

/** Tampilan minggu: 7 kolom (Sen–Min) berisi daftar chip task per hari. */
export function WeekView({ anchor, tasks, onSelectTask }: WeekViewProps) {
  const days = useMemo(() => {
    const start = startOfWeek(anchor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [anchor]);

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
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayTasks = tasksByDay.get(toDayKey(day)) ?? [];
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[320px] border-r border-slate-100 last:border-r-0 dark:border-slate-800/60",
                today && "bg-blue-50/40 dark:bg-blue-500/5"
              )}
            >
              <div className="border-b border-slate-100 px-2 py-2 text-center dark:border-slate-800/60">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {weekdayLabels[index]}
                </p>
                <span
                  className={cn(
                    "mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                    today
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 dark:text-slate-300"
                  )}
                >
                  {day.getDate()}
                </span>
              </div>

              <div className="space-y-1 p-1.5">
                {dayTasks.length === 0 ? (
                  <span className="block pt-2 text-center text-[11px] text-slate-300 dark:text-slate-600">
                    —
                  </span>
                ) : (
                  dayTasks.map((task) => (
                    <TaskChip
                      key={task.id}
                      title={task.title}
                      status={task.status}
                      onClick={() => onSelectTask(task)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** Rentang hari-hari dalam satu minggu (dipakai filter task di board). */
export function getWeekBounds(anchor: Date): { start: Date; end: Date } {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  return { start: startOfDay(start), end: endOfDay(addDays(start, 6)) };
}