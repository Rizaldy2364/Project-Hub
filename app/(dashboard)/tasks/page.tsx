import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { findMyTasksByUserId } from "@/repositories/task.repository";
import { MyTasksHeader } from "@/components/tasks/my-tasks-header";
import { MyTasksStatCards } from "@/components/tasks/my-tasks-stat-cards";
import { MyTasksExplorer } from "@/components/tasks/my-tasks-explorer";

export default async function MyTasksPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const groups = await findMyTasksByUserId(session.user.id);
  const allTasks = groups.flatMap((g) => g.tasks);
  const total = allTasks.length;
  const todo = allTasks.filter((t) => t.status === "TODO").length;
  const inProgress = allTasks.filter((t) => t.status === "IN_PROGRESS").length;
  const done = allTasks.filter((t) => t.status === "DONE").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <MyTasksHeader total={total} />
      <MyTasksStatCards total={total} todo={todo} inProgress={inProgress} done={done} />
      <MyTasksExplorer groups={groups} />
    </div>
  );
}
