import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectMembership } from "@/lib/project-guard";
import { cn, wibDayDiff, formatDayMonthWib } from "@/lib/utils";
import { findCalendarTasksByUserId } from "@/repositories/task.repository";
import { findWorkloadByMember, findStatusDistribution } from "@/repositories/report.repository";
import { findActivityLogs } from "@/repositories/activity.repository";
import { toActivityItem } from "@/lib/activity";
import { DonutChart } from "@/components/charts/donut-chart";
import { StackedBar } from "@/components/charts/stacked-bar";
import { WorkloadLegend } from "@/components/report/report-workload-card";
import { ActivityItemCard } from "@/components/activity/activity-item";
import { UserAvatar } from "@/components/ui/user-avatar";
import Link from "next/link";
import type { BoardTaskStatus } from "@/types";

const STATUS_LABEL: Record<BoardTaskStatus, string> = {
  TODO: "Belum",
  IN_PROGRESS: "Dikerjakan",
  DONE: "Selesai",
};

const STATUS_DOT: Record<BoardTaskStatus, string> = {
  TODO: "bg-slate-400 dark:bg-slate-500",
  IN_PROGRESS: "bg-blue-500",
  DONE: "bg-emerald-500",
};

interface ProjectRingkasanPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectRingkasanPage({
  params,
}: ProjectRingkasanPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { projectId } = await params;
  const guard = await getProjectMembership(projectId, session.user.id);
  if (!guard) notFound();
  const { project } = guard;
  const members = project.members;
  const myRole = guard.membership.role;

  const [calendarRows, workloadRows, status, activityRows] = await Promise.all([
    findCalendarTasksByUserId({ userId: session.user.id, projectId }),
    findWorkloadByMember({ userId: session.user.id, projectId, assigneeId: null, range: 30 }),
    findStatusDistribution({ userId: session.user.id, projectId, assigneeId: null, range: 30 }),
    // 5 log terakhir project ini (tanpa filter rentang); satu query dengan
    // select relasi aktor+project — tanpa N+1.
    findActivityLogs({
      userId: session.user.id,
      type: "all",
      project: projectId,
      member: "",
      take: 5,
    }),
  ]);

  const upcoming = calendarRows
    .filter((task) => task.status !== "DONE" && task.dueDate);

  const recentActivities = activityRows.slice(0, 5).map(toActivityItem);

  const memberCount = members.length;

  const roleLabel = (role: string) =>
    role === "ADMIN" ? "Admin" : role === "MANAGER" ? "Manager" : role === "VIEWER" ? "Viewer" : "Member";
  const roleClass = (role: string) =>
    role === "ADMIN" ? "text-violet-600 dark:text-violet-400" : role === "MANAGER" ? "text-pink-600 dark:text-pink-400" : role === "VIEWER" ? "text-teal-600 dark:text-teal-400" : "text-slate-600 dark:text-slate-300";
  const roleBadge = (role: string) =>
    role === "ADMIN" ? "bg-violet-500/10 text-violet-700 dark:text-violet-400" : role === "MANAGER" ? "bg-pink-500/10 text-pink-700 dark:text-pink-400" : role === "VIEWER" ? "bg-teal-500/10 text-teal-700 dark:text-teal-400" : "bg-slate-500/10 text-slate-600 dark:text-slate-300";

  const segments = [
    { label: "Belum", value: status.TODO, strokeClass: "stroke-slate-500 dark:stroke-slate-400", dotClass: "bg-slate-400 dark:bg-slate-500" },
    { label: "Dikerjakan", value: status.IN_PROGRESS, strokeClass: "stroke-blue-500", dotClass: "bg-blue-500" },
    { label: "Selesai", value: status.DONE, strokeClass: "stroke-emerald-500", dotClass: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="min-h-40 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Tenggat terdekat</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-[#8B96AD]">
              Task belum selesai yang punya tenggat, urut yang segera jatuh tempo.
            </p>
            {upcoming.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Tidak ada tenggat dekat
              </p>
            ) : (
              <div className="mt-4 max-h-[320px] space-y-3 overflow-y-auto">
                {upcoming.map((task) => {
                  const diff = wibDayDiff(new Date(), new Date(task.dueDate!));
                  const overdue = diff < 0;
                  const dueLabel = overdue
                    ? "Terlambat"
                    : diff === 0
                      ? "Jatuh tempo hari ini"
                      : `${diff} hari lagi`;
                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-blue-200 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#131A2B] dark:hover:border-blue-500/30 dark:hover:bg-[#1B2438]"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {task.title}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${STATUS_DOT[task.status]}`}
                        >
                          {STATUS_LABEL[task.status]}
                        </span>
                        {task.labels.slice(0, 2).map((label) => (
                          <span
                            key={label.id}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold"
                            style={{ backgroundColor: `${label.color}1a`, color: label.color }}
                          >
                            #{label.name}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        {task.assignee ? (
                          <UserAvatar name={task.assignee.name} image={task.assignee.avatarUrl} size="sm" />
                        ) : null}
                        <span className={`text-sm font-medium ${overdue ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                          {dueLabel}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {formatDayMonthWib(new Date(task.dueDate!))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="min-h-40 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Beban kerja anggota</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-[#8B96AD]">
              Jumlah task per anggota menurut status (task tidak terhapus).
            </p>
            <WorkloadLegend />
            {workloadRows.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Belum ada data beban kerja.
              </p>
            ) : (
              <ul className="mt-4 space-y-4 max-h-[420px] overflow-y-auto pr-2">
                {workloadRows.map((row) => {
                  const member = members.find((m) => m.userId === row.assigneeId);
                  const maxTotal = Math.max(...workloadRows.map((r) => r.total), 1);
                  return (
                    <li key={row.assigneeId ?? "unassigned"} className="flex items-center gap-3">
                      {member ? (
                        <UserAvatar name={member.user.name} image={member.user.avatarUrl} size="sm" className="h-7 w-7 text-[10px]" />
                      ) : (
                        <span className="h-7 w-7 shrink-0 rounded-full bg-slate-100 dark:bg-[#0F1524] text-slate-500 text-xs flex items-center justify-center">
                          ?
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {member ? member.user.name : "Tanpa penanggung jawab"}
                          </span>
                          <span className="shrink-0 text-xs font-bold text-slate-900 dark:text-white">
                            {row.total}
                          </span>
                        </div>
                        <div className="mt-1.5">
                          <StackedBar
                            maxTotal={maxTotal}
                            ariaLabel={`${member?.user?.name ?? "Tanpa penanggung jawab"}: ${row.DONE} selesai, ${row.IN_PROGRESS} dikerjakan, ${row.TODO} belum`}
                            segments={[
                              { label: "Selesai", value: row.DONE, barClass: "bg-emerald-600 dark:bg-emerald-500" },
                              { label: "Dikerjakan", value: row.IN_PROGRESS, barClass: "bg-blue-500" },
                              { label: "Belum", value: row.TODO, barClass: "bg-slate-500 dark:bg-slate-400" },
                            ]}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="min-h-40 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Aktivitas terbaru
              </h2>
              <Link
                href={`/projects/${projectId}/aktivitas`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300"
              >
                Lihat semua →
              </Link>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-[#8B96AD]">
              Kejadian terakhir di project ini.
            </p>
            {recentActivities.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Belum ada aktivitas
              </p>
            ) : (
              <ul className="mt-2 space-y-0.5">
                {recentActivities.map((item) => (
                  <li key={item.id}>
                    <ActivityItemCard item={item} showProjectLink={false} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Tentang project</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
              {project.description || "Belum ada deskripsi."}
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Dibuat</dt>
                <dd className="text-slate-900 dark:text-white font-medium">
                  {formatDayMonthWib(project.createdAt)},{" "}
                  {project.createdAt.getFullYear()}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Peran kamu</dt>
                <dd className={cn("font-medium", roleClass(myRole))}>
                  {roleLabel(myRole)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Status task</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-[#8B96AD]">
              Distribusi status task di project ini.
            </p>
            <DonutChart
              segments={segments}
              total={status.TODO + status.IN_PROGRESS + status.DONE}
              centerLabel="task"
              compact
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Anggota ({memberCount})
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-[#8B96AD]">
              {memberCount} anggota di project ini.
            </p>
            <ul className="mt-4 space-y-2">
              {members.slice(0, 4).map((m) => (
                <li key={m.userId} className="flex items-center gap-3">
                  <UserAvatar name={m.user.name} image={m.user.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {m.user.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {m.user.email}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${roleBadge(m.role)}`}>
                    {roleLabel(m.role)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-right">
              <Link
                href={`/projects/${projectId}/anggota`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300"
              >
                Lihat semua anggota →
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}