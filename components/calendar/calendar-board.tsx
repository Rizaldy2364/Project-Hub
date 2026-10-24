"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, addMonths, format, isSameMonth } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight, FolderKanban, Users } from "lucide-react";
import { cn } from "@/lib/utils";
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
  /** Opsi filter project (project yang diikuti user). */
  projects: { id: string; name: string }[];
  /** "" = semua project; state tersimpan di URL ?project=. */
  activeProjectId: string;
  currentUser: { id: string; name: string; avatarUrl: string | null };
}

/** Orkestrator halaman kalender: kontrol bulan, filter member, grid, agenda, modal. */
export function CalendarBoard({ tasks, projects, activeProjectId, currentUser }: CalendarBoardProps) {
  const router = useRouter();
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
      <div className="flex flex-wrap items-center gap-2">
        {/* Dropdown filter project — state di URL ?project= (revalidate server). */}
        <div className="relative inline-flex items-center">
          <FolderKanban
            className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400"
            aria-hidden="true"
          />
          <select
            value={activeProjectId}
            onChange={(event) => {
              const value = event.target.value;
              router.replace(value ? `/calendar?project=${value}` : "/calendar");
            }}
            aria-label="Filter project"
            className="h-8 max-w-[220px] appearance-none rounded-full border border-slate-200 bg-white py-1 pl-8 pr-7 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40"
          >
            <option value="">Semua project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-2 text-slate-400"
          >
            ▾
          </span>
        </div>

        {/* Dropdown filter member — state lokal memberFilter ("ALL" = semua). Posisi tepat di kanan filter project. Gaya sama dengan dropdown project. */}
        <div className="relative inline-flex items-center">
          <Users
            className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400"
            aria-hidden="true"
          />
          <select
            value={memberFilter}
            onChange={(event) => setMemberFilter(event.target.value)}
            aria-label="Filter member"
            className="h-8 max-w-[220px] appearance-none rounded-full border border-slate-200 bg-white py-1 pl-8 pr-7 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40"
          >
            <option value="ALL">Semua member</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-2 text-slate-400"
          >
            ▾
          </span>
        </div>

        {/* Legenda status — menempel di pojok kanan, di samping filter member. */}
        <div className="ml-auto flex flex-wrap items-center gap-4">
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
          "grid gap-4",
          view !== "agenda" && "lg:grid-cols-[minmax(0,1fr)_320px]"
        )}
      >
        {/* Kartu kalender — header berisi navigasi, judul bulan, "Hari ini", dan tab */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 min-h-[600px]">
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

        {/* Kartu agenda (kanan) — tampil pada tab Bulan/Minggu. Scroll internal hanya pada bagian "Mendatang" di dalam AgendaPanel. */}
        {view !== "agenda" && (
          <AgendaPanel tasks={visibleTasks} onSelectTask={setSelectedTask} />
        )}
      </div>

      {/* Modal detail task */}
      {selectedTask && (
        <TaskDetailModal
          key={selectedTask.id}
          task={selectedTask}
          canEdit={false}
          canDelete={false}
          canComment={true}
          currentUser={currentUser}
          onOpenChange={(open) => !open && setSelectedTask(null)}
        />
      )}
    </section>
  );
}

