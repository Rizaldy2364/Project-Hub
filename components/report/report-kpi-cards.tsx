import { BarChart3, Bolt, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReportKpi } from "@/types";

interface ReportKpiCardsProps {
  kpi: ReportKpi;
}

function formatNumber(value: number): string {
  return value.toLocaleString("id-ID");
}

/** Empat kartu KPI di bagian atas halaman /laporan. */
export function ReportKpiCards({ kpi }: ReportKpiCardsProps) {
  const delta = kpi.completionRateDelta;
  const avgDays = kpi.avgCompletionDays;

  const cards = [
    {
      key: "completed",
      icon: CheckCircle2,
      iconClassName:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
      label: "Task Selesai",
      value: formatNumber(kpi.completedInRange),
      subtitle: `dari ${formatNumber(kpi.scopeTaskTotal)} task`,
      subtitleClassName: "text-slate-500 dark:text-slate-400",
    },
    {
      key: "rate",
      icon: BarChart3,
      iconClassName:
        "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
      label: "Tingkat Penyelesaian",
      value:
        kpi.completionRatePercent === null
          ? "—"
          : `${kpi.completionRatePercent}%`,
      subtitle:
        kpi.completionRatePercent === null
          ? "belum ada task"
          : delta === null
            ? ""
            : `${delta >= 0 ? "+" : ""}${delta}% dari periode lalu`,
      subtitleClassName:
        kpi.completionRatePercent === null || delta === null
          ? "text-slate-500 dark:text-slate-400"
          : delta >= 0
            ? "text-emerald-600 dark:text-emerald-300"
            : "text-red-600 dark:text-red-300",
    },
    {
      key: "overdue",
      icon: Clock,
      iconClassName:
        "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300",
      label: "Task Terlambat",
      value: formatNumber(kpi.overdueCount),
      subtitle: kpi.overdueCount > 0 ? "perlu ditindaklanjuti" : "tidak ada",
      subtitleClassName:
        kpi.overdueCount > 0
          ? "text-red-600 dark:text-red-300"
          : "text-emerald-600 dark:text-emerald-300",
    },
    {
      key: "avg",
      icon: Bolt,
      iconClassName:
        "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
      label: "Rata-rata Penyelesaian",
      value:
        avgDays === null ? "—" : `${avgDays.toLocaleString("id-ID", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })} hari`,
      subtitle: "sejak task dibuat",
      subtitleClassName: "text-slate-500 dark:text-slate-400",
    },
  ];

  return (
    <section
      aria-label="Ringkasan laporan"
      className="grid grid-cols-2 gap-4 xl:grid-cols-4"
    >
      {cards.map((card) => (
        <div
          key={card.key}
          className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
        >
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              card.iconClassName
            )}
            aria-hidden="true"
          >
            <card.icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-bold leading-none text-slate-950 dark:text-white">
              {card.value}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {card.label}
            </p>
            <p className={cn("mt-0.5 text-xs", card.subtitleClassName)}>
              {card.subtitle}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
