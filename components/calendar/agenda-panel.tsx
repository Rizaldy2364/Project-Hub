import { useMemo, useState } from "react";
import {
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { AgendaCard } from "@/components/calendar/agenda-card";
import { cn } from "@/lib/utils";
import type { CalendarTask } from "@/types";

/** Batas jumlah task mendatang yang ditampilkan; sisanya diringkas. */
const MAX_UPCOMING = 10;

/** Mode panel agenda: ringkas (hari ini + mendatang) atau rentang minggu berjalan. */
type AgendaMode = "agenda" | "week";

interface AgendaPanelProps {
  tasks: CalendarTask[];
  onSelectTask: (task: CalendarTask) => void;
}

/** Panel kanan "Agenda": task jatuh tempo hari ini + yang akan datang. */
export function AgendaPanel({ tasks, onSelectTask }: AgendaPanelProps) {
  const [mode, setMode] = useState<AgendaMode>("agenda");
  const now = new Date();
  const todayTasks = tasks.filter((task) =>
    isSameDay(new Date(task.dueDate), now)
  );
  const upcoming = tasks
    .filter((task) => {
      const due = new Date(task.dueDate);
      return due > now && !isSameDay(due, now);
    })
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));

  const shownUpcoming = upcoming.slice(0, MAX_UPCOMING);
  const hiddenCount = upcoming.length - shownUpcoming.length;

  // Mode "Minggu ini": semua task dalam rentang minggu berjalan (Sen–Min).
  const weekTasks = useMemo(() => {
    const today = new Date();
    const start = startOfDay(startOfWeek(today, { weekStartsOn: 1 }));
    const end = endOfDay(endOfWeek(today, { weekStartsOn: 1 }));
    return tasks
      .filter((task) => {
        const due = new Date(task.dueDate);
        return due >= start && due <= end;
      })
      .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
  }, [tasks]);

  return (
    <aside className="flex flex-col max-h-[600px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header agenda: judul + toggle cakupan + tanggal (tetap diam, tidak discroll) */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Agenda</h2>
        <div
          role="tablist"
          aria-label="Cakupan agenda"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900"
        >
          {(
            [
              { key: "agenda", label: "Agenda" },
              { key: "week", label: "Minggu ini" },
            ] as { key: AgendaMode; label: string }[]
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={mode === item.key}
              onClick={() => setMode(item.key)}
              className={cn(
                "rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
                mode === item.key
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <p
        suppressHydrationWarning
        className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 shrink-0"
      >
        {format(now, "d MMMM yyyy", { locale: idLocale })}
      </p>

      {mode === "agenda" ? (
        <>
          {/* Hari ini (tetap diam, tidak discroll) */}
          <div className="mt-4 shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Hari ini
            </p>
            <div className="mt-2 space-y-2">
              {todayTasks.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-400 dark:bg-slate-800/40 dark:text-slate-500">
                  Tidak ada task jatuh tempo hari ini.
                </p>
              ) : (
                todayTasks.map((task) => (
                  <AgendaCard
                    key={task.id}
                    task={task}
                    onClick={() => onSelectTask(task)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Mendatang (bagian ini saja yang discroll saat konten terlalu banyak) */}
          <div className="flex-1 min-h-0 mt-5 overflow-y-auto shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Mendatang
            </p>
            <div className="mt-2 space-y-2">
              {shownUpcoming.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-400 dark:bg-slate-800/40 dark:text-slate-500">
                  Tidak ada tenggat mendatang.
                </p>
              ) : (
                <>
                  {shownUpcoming.map((task) => (
                    <AgendaCard
                      key={task.id}
                      task={task}
                      showDueDate
                      onClick={() => onSelectTask(task)}
                    />
                  ))}
                  {hiddenCount > 0 && (
                    <p className="px-1 text-[11px] text-slate-400 dark:text-slate-500">
                      +{hiddenCount} tenggat lainnya
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Minggu ini */
        <div className="flex-1 min-h-0 mt-4 overflow-y-auto">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Minggu ini
          </p>
          <div className="mt-2 space-y-2">
            {weekTasks.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-400 dark:bg-slate-800/40 dark:text-slate-500">
                Tidak ada tenggat minggu ini.
              </p>
            ) : (
              weekTasks.map((task) => (
                <AgendaCard
                  key={task.id}
                  task={task}
                  showDueDate
                  onClick={() => onSelectTask(task)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
}