import { UserAvatar } from "@/components/ui/user-avatar";
import { StackedBar } from "@/components/charts/stacked-bar";
import { ReportCard, ReportCardEmpty } from "@/components/report/report-card";
import type { ReportWorkloadCard as ReportWorkloadCardData } from "@/types";

interface ReportWorkloadCardProps {
  card: ReportWorkloadCardData;
}

const STATUS_SEGMENTS = [
  { key: "DONE", label: "Selesai", barClass: "bg-emerald-600 dark:bg-emerald-500" },
  { key: "IN_PROGRESS", label: "Dikerjakan", barClass: "bg-blue-500" },
  { key: "TODO", label: "Belum", barClass: "bg-slate-500 dark:bg-slate-400" },
] as const;

/** Legend bersama untuk kartu bertumpuk (Selesai/Dikerjakan/Belum). */
export function WorkloadLegend() {
  return (
    <ul className="flex items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
      {STATUS_SEGMENTS.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${s.barClass}`} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * Kartu kanan baris 3 — "Beban kerja anggota" dengan pengganti adaptif:
 * "Task per project" (satu member) atau "Task per label" (jika hanya 1 baris).
 * Tinggi tetap; daftar menggulir di dalam kartu bila panjang.
 */
export function ReportWorkloadCard({ card }: ReportWorkloadCardProps) {
  const title =
    card.kind === "workload"
      ? "Beban kerja anggota"
      : card.kind === "member-projects"
        ? "Task per project"
        : "Task per label";

  // Total terbesar untuk menskalakan lebar batang (relatif terhadap anggota terbanyak).
  const maxTotal = Math.max(
    ...card.rows.map((r) => ("total" in r ? r.total : 0)),
    1
  );

  return (
    <ReportCard
      title={title}
      subtitle={card.kind !== "labels" ? undefined : "Top 6 label"}
      headerExtra={card.kind !== "labels" ? <WorkloadLegend /> : undefined}
      className="h-[380px]"
    >
      {card.rows.length === 0 ? (
        <ReportCardEmpty />
      ) : (
        <ul className="h-full space-y-4 overflow-y-auto pr-1">
          {card.kind === "workload" &&
            card.rows.map((row) => (
              <li
                key={row.assigneeId ?? "unassigned"}
                className="flex items-center gap-3"
              >
                <UserAvatar
                  name={row.name}
                  image={row.avatarUrl}
                  size="sm"
                  className="h-7 w-7 text-[10px]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {row.name}
                    </span>
                    <span className="shrink-0 text-xs font-bold text-slate-900 dark:text-white">
                      {row.total}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <StackedBar
                      maxTotal={maxTotal}
                      ariaLabel={`${row.name}: ${row.DONE} selesai, ${row.IN_PROGRESS} dikerjakan, ${row.TODO} belum`}
                      segments={STATUS_SEGMENTS.map((s) => ({
                        label: s.label,
                        value: row[s.key],
                        barClass: s.barClass,
                      }))}
                    />
                  </div>
                </div>
              </li>
            ))}

          {card.kind === "member-projects" &&
            card.rows.map((row) => (
              <li key={row.projectId} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {row.projectName}
                    </span>
                    <span className="shrink-0 text-xs font-bold text-slate-900 dark:text-white">
                      {row.total}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <StackedBar
                      maxTotal={maxTotal}
                      ariaLabel={`${row.projectName}: ${row.DONE} selesai, ${row.IN_PROGRESS} dikerjakan, ${row.TODO} belum`}
                      segments={STATUS_SEGMENTS.map((s) => ({
                        label: s.label,
                        value: row[s.key],
                        barClass: s.barClass,
                      }))}
                    />
                  </div>
                </div>
              </li>
            ))}

          {card.kind === "labels" &&
            card.rows.map((row) => {
              const maxCount = Math.max(...card.rows.map((r) => r.count), 1);
              return (
                <li key={row.labelId} className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 shrink-0 rounded-md border border-black/10"
                    style={{ backgroundColor: row.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {row.name}
                      </span>
                      <span className="shrink-0 text-xs font-bold text-slate-900 dark:text-white">
                        {row.count}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(row.count / maxCount) * 100}%`,
                          backgroundColor: row.color,
                        }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
        </ul>
      )}
    </ReportCard>
  );
}
