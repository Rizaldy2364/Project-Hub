import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { findDashboardProjectsByUserId } from "@/repositories/project.repository";
import { ProjectsHeader } from "@/components/project/projects-header";
import { ProjectStats } from "@/components/project/project-stats";
import { ProjectsExplorer } from "@/components/project/projects-explorer";

export default async function MyProjectsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const projects = await findDashboardProjectsByUserId(session.user.id);

  const adminCount = projects.filter((p) => p.role === "ADMIN").length;
  const memberCount = projects.length - adminCount;
  const completedCount = projects.filter(
    (p) => p.taskTotal > 0 && p.taskDone === p.taskTotal
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
