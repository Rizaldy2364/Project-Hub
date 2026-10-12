"use client";

import { useMemo, useState } from "react";
import { addDays, addMonths, format, isSameMonth } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TaskDetailModal } from "@/components/task/task-detail-modal";
import { MonthGrid } from "@/components/calendar/month-grid";
import { WeekView, getWeekBounds } from "@/components/calendar/week-view";
import { AgendaView } from "@/components/calendar/agenda-view";
import { AgendaPanel } from "@/components/calendar/agenda-panel";
import type { CalendarTask } from "@/types";

/** Mode tampilan kalender (segmen tab pada toolbar). */
type CalendarView = "month" | "week" | "agenda";

const viewTabs: { key: CalendarView; label: string }[] = [
  { key: "month", label: "Bulan" },
  { key: "week", label: "Minggu" },
  { key: "agenda", label: "Agenda" },
];

/** Legenda warna status — mengikuti warna chip di kalender. */
const legend: { label: string; className: string }[] = [
  { label: "Belum", className: "bg-slate-400 dark:bg-slate-500" },
  { label: "Dikerjakan", className: "bg-blue-500" },
  { label: "Selesai", className: "bg-emerald-500" },
];

interface CalendarBoardProps {
  tasks: CalendarTask[];
}

/** Orkestrator halaman kalender: kontrol bulan, filter member, grid, agenda, modal. */
export function CalendarBoard({ tasks }: CalendarBoardProps) {
  const [anchor, setAnchor] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [memberFilter, setMemberFilter] = useState("ALL");
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);

  // Daftar assignee unik dari task (untuk pill filter member).
  const members = useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatarUrl: string | null }>();
    for (const task of tasks) {
      if (task.assignee && !map.has(task.assignee.id)) {
        map.set(task.assignee.id, task.assignee);
      }
    }
    return [...map.values()];
  }, [tasks]);

  // Task yang lolos filter member — dipakai semua tampilan.
  const visibleTasks = useMemo(
    () =>
      memberFilter === "ALL"
        ? tasks
        : tasks.filter((task) => task.assignee?.id === memberFilter),
    [tasks, memberFilter]
  );

  // Task jatuh tempo di bulan aktif (grid bulan + daftar agenda).
  const monthTasks = useMemo(
    () => visibleTasks.filter((task) => isSameMonth(new Date(task.dueDate), anchor)),
    [visibleTasks, anchor]
  );

  // Task jatuh tempo di minggu aktif (tampilan minggu).
  const weekBounds = useMemo(() => getWeekBounds(anchor), [anchor]);
  const weekTasks = useMemo(() => {
    const { start, end } = weekBounds;
    return visibleTasks.filter((task) => {
      const due = new Date(task.dueDate);
      return due >= start && due <= end;
    });
  }, [visibleTasks, weekBounds]);

  // Navigasi: di tampilan minggu maju/mundur 7 hari, selain itu per bulan.
  function goPrev() {
    setAnchor((prev) => (view === "week" ? addDays(prev, -7) : addMonths(prev, -1)));
  }
  function goNext() {
    setAnchor((prev) => (view === "week" ? addDays(prev, 7) : addMonths(prev, 1)));
  }

  const title =
    view === "week"
      ? `${format(weekBounds.start, "d MMM", { locale: idLocale })} – ${format(
          weekBounds.end,
          "d MMM yyyy",
          { locale: idLocale }
        )}`
      : format(anchor, "MMMM yyyy", { locale: idLocale });

  return (
    <section className="space-y-4">
      {/* Baris filter member + legenda */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Member
          </span>

          {/* Pill "Semua (N)" — avatar member menumpuk */}
          <button
            type="button"
            onClick={() => setMemberFilter("ALL")}
            aria-pressed={memberFilter === "ALL"}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-2 py-1.5 text-xs font-semibold transition-colors",
              memberFilter === "ALL"
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40"
            )}
          >
            <span className="flex -space-x-1.5">
              {members.slice(0, 3).map((member) => (
                <UserAvatar
                  key={member.id}
                  name={member.name}
                  image={member.avatarUrl}
                  size="sm"
                  className="h-5 w-5 text-[9px] ring-2 ring-white dark:ring-slate-900"
                />
              ))}
            </span>
            Semua ({members.length})
          </button>

          {/* Pill per member — hanya avatar bulat (nama di tooltip) */}
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => setMemberFilter(member.id)}
              title={member.name}
              aria-label={`Filter member ${member.name}`}
              aria-pressed={memberFilter === member.id}
              className={cn(
                "rounded-full transition-shadow",
                memberFilter === member.id &&
                  "ring-2 ring-blue-600 ring-offset-2 ring-offset-white dark:ring-offset-slate-950"
              )}
            >
              <UserAvatar
                name={member.name}
                image={member.avatarUrl}
                size="sm"
                className="h-7 w-7 text-[10px]"
              />
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {legend.map(({ label, className }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              <span
                aria-hidden="true"
                className={cn("h-2.5 w-2.5 rounded-sm", className)}
              />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Dua kartu: kalender (kiri) + agenda (kanan) */}
      <div
        className={cn(
          "grid items-start gap-4",
          view !== "agenda" && "lg:grid-cols-[minmax(0,1fr)_320px]"
        )}
      >
        {/* Kartu kalender — header berisi navigasi, judul bulan, "Hari ini", dan tab */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Sebelumnya"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Berikutnya"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <h2
                suppressHydrationWarning
                className="ml-1 text-lg font-bold text-slate-900 sm:text-xl dark:text-white"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={() => setAnchor(new Date())}
                className="ml-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Hari ini
              </button>
            </div>

            {/* Segmen tab: Bulan / Minggu / Agenda */}
            <div
              role="tablist"
              aria-label="Tampilan kalender"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
            >
              {viewTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={view === tab.key}
                  onClick={() => setView(tab.key)}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors",
                    view === tab.key
                      ? "bg-blue-600 text-white"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body kartu sesuai tab aktif */}
          {view === "month" && (
            <MonthGrid month={anchor} tasks={monthTasks} onSelectTask={setSelectedTask} />
          )}
          {view === "week" && (
            <WeekView anchor={anchor} tasks={weekTasks} onSelectTask={setSelectedTask} />
          )}
          {view === "agenda" && (
            <AgendaView month={anchor} tasks={visibleTasks} onSelectTask={setSelectedTask} />
          )}
        </div>

        {/* Kartu agenda (kanan) — tampil pada tab Bulan/Minggu */}
        {view !== "agenda" && (
          <AgendaPanel tasks={visibleTasks} onSelectTask={setSelectedTask} />
        )}
      </div>

      {/* Modal detail task */}
      {selectedTask && (
        <TaskDetailModal
          key={selectedTask.id}
          task={selectedTask}
          isAdmin={selectedTask.isAdmin}
          onOpenChange={(open) => !open && setSelectedTask(null)}
        />
      )}
    </section>
  );
}

