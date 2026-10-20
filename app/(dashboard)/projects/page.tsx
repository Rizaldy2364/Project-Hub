import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { findDashboardProjectsByUserId } from "@/repositories/project.repository";
import { ProjectsHeader } from "@/components/project/projects-header";
import { ProjectStats } from "@/components/project/project-stats";
import { ProjectsExplorer } from "@/components/project/projects-explorer";

interface MyProjectsPageProps {
  searchParams: Promise<{ terhapus?: string }>;
}

export default async function MyProjectsPage({
  searchParams,
}: MyProjectsPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const projects = await findDashboardProjectsByUserId(session.user.id);

  const adminCount = projects.filter((p) => p.role === "ADMIN").length;
  const memberCount = projects.length - adminCount;
  const completedCount = projects.filter(
    (p) => p.taskTotal > 0 && p.taskDone === p.taskTotal
  ).length;

  // Flag post-redirect dari deleteProjectAction (Pengaturan → Zona berbahaya):
  // "?terhapus=1" dibaca sekali lalu dibersihkan dari URL.
  const { terhapus } = await searchParams;
  const justDeleted = terhapus === "1";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {justDeleted && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400"
        >
          Project berhasil dihapus.
        </div>
      )}
      <ProjectsHeader />
      <ProjectStats
        total={projects.length}
        adminCount={adminCount}
        memberCount={memberCount}
        completedCount={completedCount}
      />
      <ProjectsExplorer projects={projects} />
    </div>
  );
}
