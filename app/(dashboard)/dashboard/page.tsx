import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  findDashboardProjectsByUserId,
  countTeammates,
  findWeeklyActivityByUserId,
} from "@/repositories/project.repository";
import { countAssignedTasks } from "@/repositories/task.repository";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatCards } from "@/components/dashboard/stat-cards";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { ProjectsExplorer } from "@/components/project/projects-explorer";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const userId = session.user.id;

  const [projects, assigned, teammates, activity] = await Promise.all([
    findDashboardProjectsByUserId(userId),
    countAssignedTasks(userId),
    countTeammates(userId),
    findWeeklyActivityByUserId(userId),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <DashboardHeader name={session.user.name ?? "Teman"} />

      <div className="space-y-6">
        <StatCards
          projects={projects.length}
          pendingTasks={assigned.pending}
          doneTasks={assigned.done}
          totalAssignedTasks={assigned.pending + assigned.done}
          teammates={teammates}
        />
        <ActivityChart points={activity} />
      </div>

      <ProjectsExplorer projects={projects} showCreateActions={false} />
    </div>
  );
}