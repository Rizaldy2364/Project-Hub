import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { reportQuerySchema } from "@/lib/validations/report.schema";
import {
  findReportData,
  type FindReportInput,
} from "@/repositories/report.repository";
import { findProjectsForMemberDropdown } from "@/repositories/team.repository";
import { findSharedProjectUsers } from "@/repositories/activity.repository";
import { ReportToolbar } from "@/components/report/report-toolbar";
import { ReportKpiCards } from "@/components/report/report-kpi-cards";
import { ReportWorkloadCard } from "@/components/report/report-workload-card";
import { ReportProgressCard } from "@/components/report/report-progress-card";
import { ReportOverdueTable } from "@/components/report/report-overdue-table";
import { ReportCard, ReportCardEmpty } from "@/components/report/report-card";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";

interface LaporanPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata = {
  title: "Laporan — ProjectHub",
};

export default async function LaporanPage({ searchParams }: LaporanPageProps) {
  const session = await auth();
  if (!session) redirect("/login");
  const userId = session.user.id;

  const params = await searchParams;
  const parsed = reportQuerySchema.safeParse({
    project: typeof params.project === "string" ? params.project : undefined,
    member: typeof params.member === "string" ? params.member : undefined,
    range: typeof params.range === "string" ? params.range : undefined,
  });
  const filters = parsed.success
    ? parsed.data
    : reportQuerySchema.parse({});

  // Daftar project & member yang benar-benar dibagi user (scope keamanan).
  let projects: { id: string; name: string }[] = [];
  let members: { id: string; name: string; avatarUrl: string | null }[] = [];
  let data;
  let error = false;

  try {
    [projects, members] = await Promise.all([
      findProjectsForMemberDropdown(userId),
      findSharedProjectUsers(userId),
    ]);

    // Validasi id project: harus salah satu project user. ID asing → "all".
    const projectId =
      filters.project === "all" || !projects.some((p) => p.id === filters.project)
        ? null
        : filters.project;

    // Validasi id member: "all" → null; "me" → user; id harus anggota bersama.
    let assigneeId: string | null = null;
    if (filters.member === "me") {
      assigneeId = userId;
    } else if (filters.member !== "all" && members.some((m) => m.id === filters.member)) {
      assigneeId = filters.member;
    }

    const input: FindReportInput = {
      userId,
      projectId,
      assigneeId,
      range: filters.range,
    };
    data = await findReportData(input);
  } catch (err) {
    console.error("[laporan] gagal memuat data laporan:", err);
    error = true;
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Laporan</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#8B96AD]">
            Ringkasan progres, beban kerja, dan produktivitas tim.
          </p>
        </div>
        <div className="hidden sm:block">
          <ReportToolbar
            project={filters.project}
            member={filters.member}
            range={filters.range}
            projects={projects}
            members={members}
          />
        </div>
      </div>

      {error || !data ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-white/[.08] dark:bg-[#131A2B]">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Gagal memuat laporan. Coba lagi.
          </p>
          <a
            href="/laporan"
            className="mt-4 inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Muat ulang
          </a>
        </div>
      ) : (
        <>
          <ReportKpiCards kpi={data.kpi} />

          <div className="sm:hidden">
            <ReportToolbar
              project={filters.project}
              member={filters.member}
              range={filters.range}
              projects={projects}
              members={members}
            />
          </div>

          {/* Baris 2 — grafik mingguan (2fr) + distribusi status (1fr) */}
          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <ReportCard title="Task selesai per minggu" subtitle="6 minggu terakhir">
              {data.weekly.reduce((s, p) => s + p.count, 0) === 0 ? (
                <ReportCardEmpty />
              ) : (
                <BarChart points={data.weekly} />
              )}
            </ReportCard>

            <ReportCard title="Distribusi status">
              {data.status.total === 0 ? (
                <ReportCardEmpty />
              ) : (
                <DonutChart
                  total={data.status.total}
                  centerLabel="task"
                  segments={[
                    { label: "Selesai", value: data.status.DONE, strokeClass: "stroke-emerald-600 dark:stroke-emerald-500", dotClass: "bg-emerald-600 dark:bg-emerald-500" },
                    { label: "Dikerjakan", value: data.status.IN_PROGRESS, strokeClass: "stroke-blue-600 dark:stroke-blue-500", dotClass: "bg-blue-600 dark:bg-blue-500" },
                    { label: "Belum", value: data.status.TODO, strokeClass: "stroke-slate-500 dark:stroke-slate-400", dotClass: "bg-slate-500 dark:bg-slate-400" },
                  ]}
                />
              )}
            </ReportCard>
          </div>

          {/* Baris 3 — beban kerja anggota + progres per project (adaptif) */}
          <div className="grid gap-6 xl:grid-cols-2">
            <ReportWorkloadCard card={data.workloadCard} />
            <ReportProgressCard card={data.progressCard} />
          </div>

          {/* Baris 4 — tabel task terlambat */}
          <ReportOverdueTable tasks={data.overdueTasks} />
        </>
      )}
    </div>
  );
}

