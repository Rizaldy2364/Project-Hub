import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarClock } from "lucide-react";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import type { BoardTaskStatus, CalendarTask } from "@/types";

export const statusLabel: Record<BoardTaskStatus, string> = {
  TODO: "Belum",
  IN_PROGRESS: "Dikerjakan",
  DONE: "Selesai",
};

export const statusDot: Record<BoardTaskStatus, string> = {
  TODO: "bg-slate-400 dark:bg-slate-500",
  IN_PROGRESS: "bg-blue-500",
  DONE: "bg-emerald-500",
};

interface AgendaCardProps {
  task: CalendarTask;
  /** Tampilkan tanggal tenggat (untuk daftar mendatang / agenda view). */
  showDueDate?: boolean;
  onClick: () => void;
}

/** Kartu task untuk panel & daftar agenda: bar warna status, judul, project, prioritas. */
export function AgendaCard({ task, showDueDate, onClick }: AgendaCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-stretch gap-3 rounded-xl border border-slate-100 bg-white p-3 text-left transition-colors hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/30 dark:hover:bg-slate-800/60"
    >
      {/* Bar warna kiri sesuai status */}
      <span
        aria-hidden="true"
        className={`w-1 shrink-0 rounded-full ${statusDot[task.status]}`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
          {task.title}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="truncate">{task.projectName}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${statusDot[task.status]}`}
            />
            {statusLabel[task.status]}
          </span>
          {showDueDate && (
            <>
              <span aria-hidden="true">·</span>
              <span
                suppressHydrationWarning
                className="inline-flex items-center gap-1 whitespace-nowrap"
              >
                <CalendarClock className="h-3 w-3 opacity-70" />
                {format(new Date(task.dueDate), "d MMM", { locale: idLocale })}
              </span>
            </>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center">
        <PriorityBadge value={task.priority} />
      </div>
    </button>
  );
}