"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Check, Clock, FileCheck, HelpCircle, Search } from "lucide-react";
import { TaskBoard } from "@/components/task/task-board";
import { FilterSelect } from "@/components/board/board-view";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { TaskViewToggle, TASK_VIEW_STORAGE_KEY, type TaskViewValue } from "@/components/task/task-view-toggle";
import { cn, formatDayMonthWib } from "@/lib/utils";
import type { BoardTaskStatus, MyTaskItem, TaskPriorityValue } from "@/types";

const STATUS_OPTIONS: { key: BoardTaskStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "Semua" },
  { key: "TODO", label: "Belum" },
  { key: "IN_PROGRESS", label: "Dikerjakan" },
  { key: "DONE", label: "Selesai" },
];

const PAGE_SIZES: (10 | 25 | 50)[] = [10, 25, 50];

const statusConfig: Record<BoardTaskStatus, { label: string; className: string }> = {
  TODO: {
    label: "Belum",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  IN_PROGRESS: {
    label: "Dikerjakan",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  DONE: {
    label: "Selesai",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
} as const;

interface ProjectTasksShellProps {
  tasks: MyTaskItem[];
  currentUser: { id: string; name: string; avatarUrl: string | null };
  projects: { id: string; name: string }[];
}

/** Baris task tampilan daftar (view-only): kotak centang statis, judul,
 *  assignee, prioritas, tenggat, status. Tidak ada aksi edit/hapus/ubah status. */
function ViewOnlyTaskRow({ task }: { task: MyTaskItem }) {
  const done = task.status === "DONE";
  const status = statusConfig[task.status];

  return (
    <div
      className={cn(
        "grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 rounded-xl px-3 py-3 transition-colors hover:bg-slate-50 md:grid-cols-[auto_1fr_140px_110px_90px_110px] md:gap-4 dark:hover:bg-slate-800/50",
        done ? "bg-slate-50 dark:bg-slate-800/30" : ""
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
          done
            ? "border-emerald-500 bg-emerald-500"
            : "border-slate-300 text-transparent dark:border-slate-600"
        )}
      >
        {done && <Check className="h-3 w-3 text-white" />}
      </span>

      <h3
        className={cn(
          "min-w-0 truncate text-sm font-medium",
          done ? "text-slate-400 line-through" : "text-slate-900 dark:text-slate-100"
        )}
      >
        {task.title}
      </h3>

      <div className="col-start-2 flex items-center gap-2 md:col-start-auto">
        {task.assignee ? (
          <>
            {task.assignee.avatarUrl?.trim() ? (
              <img
                className="h-6 w-6 rounded-full object-cover"
                src={task.assignee.avatarUrl}
                alt={task.assignee.name}
              />
            ) : (
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                aria-label={task.assignee.name}
              >
                {task.assignee.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
              {task.assignee.name}
            </span>
          </>
        ) : (
          <span className="text-xs text-slate-400">Tanpa assignee</span>
        )}
      </div>

      <div className="col-start-2 md:col-start-auto">
        <PriorityBadge value={task.priority as TaskPriorityValue} />
      </div>

      <div className="col-start-2 flex items-center gap-1.5 text-xs text-slate-500 md:col-start-auto dark:text-slate-400">
        <CalendarDays className="h-3.5 w-3.5 opacity-70" />
        {task.dueDate ? (
          <span suppressHydrationWarning>
            {formatDayMonthWib(new Date(task.dueDate))}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </div>

      <div className="col-start-2 md:col-start-auto">
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold",
            status.className
          )}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
}

/* ----- Header kiri: judul + deskripsi halaman ----- */
function TasksHeader() {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="break-words text-2xl font-bold text-slate-900 dark:text-slate-100">
          Task Project
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Lihat dan kelola task yang kamu miliki di semua project. Filter sesuai
          project, status, atau cari berdasarkan judul dan nama project.
        </p>
      </div>
    </section>
  );
}

/* ----- Kartu ringkasan KPI: 4 kartu (style ReportCard) ----- */
interface ProjectTasksOverviewCardsProps {
  totalTasks: number;
  completedTasks: number;
  completedThisWeek: number;
  overdueTasks: number;
}

function ProjectTasksOverviewCards({
  totalTasks,
  completedTasks,
  completedThisWeek,
  overdueTasks,
}: ProjectTasksOverviewCardsProps) {
  const cards = [
    {
      key: "total",
      icon: FileCheck,
      iconClassName: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
      label: "Total Task",
      value: totalTasks.toLocaleString("id-ID"),
      subtitle: "semua status",
      subtitleClassName: "text-xs font-medium text-slate-500 dark:text-slate-400",
    },
    {
      key: "completed",
      icon: Search,
      iconClassName: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
      label: "Task Selesai",
      value: completedTasks.toLocaleString("id-ID"),
      subtitle: `minggu ini: ${completedThisWeek.toLocaleString("id-ID")}`,
      subtitleClassName: "text-xs font-medium text-slate-500 dark:text-slate-400",
    },
    {
      key: "overdue",
      icon: Clock,
      iconClassName: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
      label: "Task Terlambat",
      value: overdueTasks.toLocaleString("id-ID"),
      subtitle:
        overdueTasks > 0
          ? `terlambat ${overdueTasks} task, perlu ditindaklanjuti`
          : "tidak ada task terlambat",
      subtitleClassName:
        overdueTasks > 0
          ? "text-xs font-medium text-red-600 dark:text-red-300"
          : "text-xs font-medium text-emerald-600 dark:text-emerald-300",
    },
    {
      key: "progress",
      icon: HelpCircle,
      iconClassName: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
      label: "Progres Project",
      value: totalTasks > 0 ? `${((completedTasks / totalTasks) * 100).toFixed(0)}%` : "0%",
      subtitle: "selesai dibanding total task",
      subtitleClassName: "text-xs font-medium text-slate-500 dark:text-slate-400",
    },
  ];

  return (
    <section
      aria-label="Ringkasan task project"
      className="grid grid-cols-2 gap-4 xl:grid-cols-4"
    >
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[.08] dark:bg-[#131A2B]"
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                card.iconClassName
              )}
              aria-hidden="true"
            >
              <card.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {card.value}
              </p>
              <p className={cn("mt-1 text-xs font-medium", card.subtitleClassName)}>
                {card.label}
              </p>
            </div>
          </div>
          <p className={cn("mt-3 text-xs font-semibold", card.subtitleClassName)}>
            {card.subtitle}
          </p>
        </div>
      ))}
    </section>
  );
}

/** Panel view-only Board — tampilan 3 kolom, tanpa drag/create/mark-done. */
function BoardViewPanel({
  projectId,
  tasks,
  onTasksChange,
  onSelectTask,
  canMoveTask,
  canCreateTask,
  onAddTask,
  onMarkDone,
  showToast,
}: {
  projectId: string;
  tasks: MyTaskItem[];
  onTasksChange: () => void;
  onSelectTask: () => void;
  canMoveTask: () => boolean;
  canCreateTask: boolean;
  onAddTask: () => void;
  onMarkDone: () => void;
  showToast: (msg: string) => void;
}) {
  return (
    <>
      <TaskBoard
        projectId={projectId}
        tasks={tasks}
        onTasksChange={onTasksChange}
        onSelectTask={onSelectTask}
        canMoveTask={canMoveTask}
        canCreateTask={canCreateTask}
        onAddTask={onAddTask}
        onMarkDone={onMarkDone}
        showToast={showToast}
      />
    </>
  );
}

/** Panel view-only List — baris statis + pagination card footer. */
function ListViewPanel({
  paginatedTasks,
  totalTasks,
  from,
  to,
  totalPages,
  safePage,
  pageSize,
  setPageSize,
  pushQuery,
}: {
  paginatedTasks: MyTaskItem[];
  totalTasks: number;
  from: number;
  to: number;
  totalPages: number;
  safePage: number;
  pageSize: 10 | 25 | 50;
  setPageSize: (v: 10 | 25 | 50) => void;
  pushQuery: (next: Record<string, string>) => void;
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-200 overflow-hidden shadow-sm dark:shadow-xl border border-slate-200 dark:border-slate-800">
      <div className="p-2">
        {paginatedTasks.length ? (
          paginatedTasks.map((task) => (
            <ViewOnlyTaskRow key={task.id} task={task} />
          ))
        ) : (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Tidak ada task
          </p>
        )}
      </div>
      {/* Footer pagination — anak terakhir card. */}
      <div
        className={cn(
          "border-t border-slate-100 bg-transparent px-6 py-4 flex items-center justify-between gap-4",
          "dark:border-[rgba(255,255,255,.08)]"
        )}
      >
        <p className="text-[13px] text-slate-500 dark:text-slate-400">
          {totalTasks === 0
            ? "Tidak ada task"
            : `Menampilkan ${from}–${to} dari ${totalTasks} task`}
        </p>
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center">
            <select
              value={String(pageSize)}
              onChange={(e) => {
                setPageSize((e.target.value as unknown) as 10 | 25 | 50);
                pushQuery({ page: "1" });
              }}
              aria-label="Jumlah per halaman"
              className={cn(
                "h-10 rounded-xl appearance-none pl-3 pr-8 text-[13px] font-medium outline-none",
                "border border-slate-200 bg-white text-slate-700",
                "dark:border-[rgba(255,255,255,.12)] dark:bg-slate-900 dark:text-slate-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B66EE]"
              )}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={String(size)}>
                  {size} per halaman
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => pushQuery({ page: String(safePage - 1) })}
            aria-label="Halaman sebelumnya"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              "border border-slate-200 bg-transparent text-slate-600",
              "dark:border-[rgba(255,255,255,.12)] dark:text-slate-400",
              "transition-colors",
              "hover:bg-white/5 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B66EE]",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-current"
            )}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div
            aria-label={`Halaman ${safePage} dari ${totalPages}`}
            className="h-10 w-10 rounded-xl bg-[#3B66EE] flex items-center justify-center text-sm font-semibold text-white"
          >
            {safePage}
          </div>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => pushQuery({ page: String(safePage + 1) })}
            aria-label="Halaman berikutnya"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              "border border-slate-200 bg-transparent text-slate-600",
              "dark:border-[rgba(255,255,255,.12)] dark:text-slate-400",
              "transition-colors",
              "hover:bg-white/5 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B66EE]",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-current"
            )}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProjectTasksShell({
  tasks,
  currentUser,
  projects,
}: ProjectTasksShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // --- View persistence: URL (?view=board|list) -> localStorage -> "board" ---
  const [view, setView] = useState<TaskViewValue>("board");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const urlView = searchParams.get("view");
    const valid: TaskViewValue | null =
      urlView === "board" || urlView === "list" ? urlView : null;
    const saved =
      valid ??
      ((localStorage.getItem(TASK_VIEW_STORAGE_KEY) as TaskViewValue | null) ?? "board");
    setView(saved);
    localStorage.setItem(TASK_VIEW_STORAGE_KEY, saved);
  }, [searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (searchParams.get("view") !== view) {
      router.replace(pathname + "?view=" + view, { scroll: false });
    }
  }, [view, router, searchParams, pathname]);

  // --- Filter (klien-side) ---
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<BoardTaskStatus | "ALL">("ALL");

  // --- Pagination ---
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<10 | 25 | 50>(10);

  // Sinkronisasi URL page/pageSize ke state saat mount / URL berubah.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const urlPage = searchParams.get("page");
    const urlSize = searchParams.get("pageSize");

    if (urlPage) {
      const pageNum = Number.parseInt(urlPage, 10);
      setPage(() => (Number.isNaN(pageNum) || pageNum < 1 ? 1 : pageNum));
    }

    if (urlSize) {
      const sizeNum = Number.parseInt(urlSize, 10);
      setPageSize((_prev) =>
        sizeNum === 10 || sizeNum === 25 || sizeNum === 50 ? sizeNum : _prev
      );
    }
  }, [searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Reset ke halaman 1 saat filter berubah.
  const prevFiltersRef = useRef({
    search: "",
    projectFilter: "",
    statusFilter: "ALL" as BoardTaskStatus | "ALL",
  });
  useEffect(() => {
    if (
      search !== prevFiltersRef.current.search ||
      projectFilter !== prevFiltersRef.current.projectFilter ||
      statusFilter !== prevFiltersRef.current.statusFilter
    ) {
      prevFiltersRef.current = { search, projectFilter, statusFilter };
      setPage(1);
    }
  }, [search, projectFilter, statusFilter]);

  const pushQuery = useCallback(
    (next: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v) sp.set(k, v);
        else sp.delete(k);
      }
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // --- Hitung ringkasan KPI (dari seluruh task yang difilter) ---
  const { completedTasks, completedThisWeek, overdueTasks } = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Senin
    startOfWeek.setHours(0, 0, 0, 0);

    let completed = 0;
    let completedThisWeek = 0;
    let overdue = 0;

    for (const t of tasks) {
      if (t.status === "DONE") {
        completed += 1;
        const completedAt = new Date(t.completedAt ?? 0);
        if (!isNaN(completedAt.getTime()) && completedAt >= startOfWeek) {
          completedThisWeek += 1;
        }
      }
      if (t.dueDate) {
        const due = new Date(t.dueDate);
        if (!isNaN(due.getTime()) && due < today && t.status !== "DONE") {
          overdue += 1;
        }
      }
    }

    return { completedTasks: completed, completedThisWeek: completedThisWeek, overdueTasks: overdue };
  }, [tasks]);

  // Opsi filter proyek (termasuk "Semua proyek").
  const projectOptions = [
    { value: "", label: "Semua proyek" },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  // --- Filter logic: search by title OR project name, then by project & status ---
  const filteredTasks = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    let results: MyTaskItem[] = tasks;

    if (lowerSearch) {
      results = results.filter(
        (t) =>
          t.title.toLowerCase().includes(lowerSearch) ||
          t.projectName.toLowerCase().includes(lowerSearch)
      );
    }

    if (projectFilter) {
      results = results.filter((t) => t.projectId === projectFilter);
    }

    if (statusFilter !== "ALL") {
      results = results.filter((t) => t.status === statusFilter);
    }

    return results;
  }, [tasks, search, projectFilter, statusFilter]);

  // --- Hitung halaman ---
  const totalTasks = filteredTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalTasks / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageEnd = safePage * pageSize;
  const paginatedTasks = useMemo(
    () => filteredTasks.slice(pageStart, pageEnd),
    [filteredTasks, pageStart, pageEnd]
  );
  const from = totalTasks === 0 ? 0 : pageStart + 1;
  const to = Math.min(totalTasks, pageEnd);

  return (
    <section className="space-y-6">
      {/* ---- Header kiri: judul + deskripsi halaman ---- */}
      <TasksHeader />

      {/* ---- Card statistik: 4 kartu KPI ---- */}
      <ProjectTasksOverviewCards
        totalTasks={totalTasks}
        completedTasks={completedTasks}
        completedThisWeek={completedThisWeek}
        overdueTasks={overdueTasks}
      />

      {/* ---- Toolbar: pencarian kiri (memanjang), filter + toggle kanan ---- */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative sm:w-96">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari task atau proyek..."
            aria-label="Cari task atau proyek"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            value={projectFilter}
            onChange={setProjectFilter}
            label="Semua proyek"
            icon={Search}
            options={projectOptions}
          />
          <FilterSelect
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as BoardTaskStatus | "ALL")}
            label="Semua status"
            icon={Search}
            options={STATUS_OPTIONS.map((o) => ({
              value: o.key,
              label: o.label,
            }))}
          />
          <TaskViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {view === "board" ? (
        <BoardViewPanel
          projectId={currentUser.id}
          tasks={filteredTasks}
          onTasksChange={() => {}}
          onSelectTask={() => {}}
          canMoveTask={() => false}
          canCreateTask={false}
          onAddTask={() => {}}
          onMarkDone={() => {}}
          showToast={() => {}}
        />
      ) : (
        <ListViewPanel
          paginatedTasks={paginatedTasks}
          totalTasks={totalTasks}
          from={from}
          to={to}
          totalPages={totalPages}
          safePage={safePage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          pushQuery={pushQuery}
        />
      )}
    </section>
  );
}
