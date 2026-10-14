import { cn } from "@/lib/utils";
import { ReportCard, ReportCardEmpty } from "@/components/report/report-card";
import type { ReportProgressCard as ReportProgressCardData } from "@/types";

interface ReportProgressCardProps {
  card: ReportProgressCardData;
}

/** Warna inisial project (square) — palet tetap, deterministik dari nama. */
const initialColors = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-sky-500",
];

function initialColor(name: string): string {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return initialColors[sum % initialColors.length];
}

const priorityColors: Record<string, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-700 dark:bg-amber-500",
  LOW: "bg-slate-500 dark:bg-slate-400",
};

/**
 * Kartu kiri baris 3 — "Progres per project" dengan pengganti adaptif
 * "Task per prioritas" (scope satu project). Tinggi tetap; daftar menggulir
 * di dalam kartu bila panjang.
 */
export function ReportProgressCard({ card }: ReportProgressCardProps) {
  const isProjects = card.kind === "projects";
  const title = isProjects ? "Progres per project" : "Task per prioritas";

  return (
    <ReportCard title={title} className="h-[380px]">
      {card.rows.length === 0 ? (
        <ReportCardEmpty />
      ) : (
        <ul className="h-full space-y-4 overflow-y-auto pr-1">
          {isProjects
            ? card.rows.map((row) => (
                <li key={row.projectId} className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white",
                      initialColor(row.projectName)
                    )}
                  >
                    {row.projectName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {row.projectName}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                        {row.done}/{row.total} task · {row.percent}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all dark:bg-emerald-500"
                        style={{ width: `${row.percent}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))
            : card.rows.map((row) => (
                <li key={row.priority} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {row.label}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                        {row.count} task · {row.percent}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          priorityColors[row.priority] ?? "bg-slate-400"
                        )}
                        style={{ width: `${row.percent}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
        </ul>
      )}
    </ReportCard>
  );
}
