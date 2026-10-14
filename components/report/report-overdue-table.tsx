import { formatDayMonthWib } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ReportCard, ReportCardEmpty } from "@/components/report/report-card";
import type { ReportOverdueTask } from "@/types";

interface ReportOverdueTableProps {
  tasks: ReportOverdueTask[];
}

/** Tabel "Task terlambat" selebar halaman (maks 10 baris, paling telat dulu). */
export function ReportOverdueTable({ tasks }: ReportOverdueTableProps) {
  return (
    <ReportCard
      title={`Task terlambat`}
      subtitle={`${tasks.length} task melewati tenggat`}
    >
      {tasks.length === 0 ? (
        <ReportCardEmpty />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-400 dark:border-white/[.08] dark:text-slate-500">
                <th scope="col" className="py-2 pr-4 font-semibold">Task</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Project</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Penanggung jawab</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Tenggat</th>
                <th scope="col" className="py-2 text-right font-semibold">Terlambat</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-slate-100 last:border-transparent dark:border-white/[.04]"
                >
                  <td className="max-w-56 truncate py-3 pr-4 text-xs font-semibold text-slate-900 dark:text-white">
                    {task.title}
                  </td>
                  <td className="max-w-40 truncate py-3 pr-4 text-xs text-slate-600 dark:text-slate-300">
                    {task.projectName}
                  </td>
                  <td className="py-3 pr-4">
                    {task.assignee ? (
                      <span className="flex items-center gap-2">
                        <UserAvatar
                          name={task.assignee.name}
                          image={task.assignee.avatarUrl}
                          size="sm"
                          className="h-6 w-6 text-[10px]"
                        />
                        <span className="truncate text-xs text-slate-600 dark:text-slate-300">
                          {task.assignee.name}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Tanpa penanggung jawab</span>
                    )}
                  </td>
                  <td
                    suppressHydrationWarning
                    className="py-3 pr-4 text-xs text-slate-600 dark:text-slate-300"
                  >
                    {formatDayMonthWib(new Date(task.dueDate))}
                  </td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">
                      {task.daysLate} hari
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportCard>
  );
}
