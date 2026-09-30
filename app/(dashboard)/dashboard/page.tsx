import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  findDashboardProjectsByUserId,
  countTeammates,
} from "@/repositories/project.repository";
import { countAssignedTasks } from "@/repositories/task.repository";
import { HeroBanner } from "@/components/dashboard/hero-banner";
import { ProjectsExplorer } from "@/components/project/projects-explorer";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const userId = session.user.id;

  const [projects, assigned, teammates] = await Promise.all([
    findDashboardProjectsByUserId(userId),
    countAssignedTasks(userId),
    countTeammates(userId),
  ]);

  const totalAssigned = assigned.pending + assigned.done;
  const completionRate =
    totalAssigned === 0 ? 0 : Math.round((assigned.done / totalAssigned) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <HeroBanner
        name={session.user.name ?? "Teman"}
        stats={{
          projects: projects.length,
          pendingTasks: assigned.pending,
          completionRate,
          teammates,
        }}
      />
      <ProjectsExplorer projects={projects} />
    </div>
  );
}