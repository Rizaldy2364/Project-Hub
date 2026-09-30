import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { findProjectBoardById } from "@/repositories/project.repository";
import { KanbanBoardTab, type BoardTask } from "@/components/project/kanban-board-tab";

interface ProjectBoardPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectBoardPage({ params }: ProjectBoardPageProps) {
  const session = await auth();
  if (!session) redirect("/login");
  const { projectId } = await params;
  const project = await findProjectBoardById(projectId);
  if (!project) notFound();

  const membership = project.members.find((member) => member.userId === session.user.id);
  if (!membership) redirect("/dashboard");
  const tasks: BoardTask[] = project.lists.flatMap((list) => list.tasks).map((task) => ({
    id: task.id, title: task.title, description: task.description, status: task.status,
    dueDate: task.dueDate?.toISOString() ?? null, assignee: task.assignee,
    labels: task.labels, commentCount: task._count.comments,
  }));

  return <KanbanBoardTab project={{ id: project.id, name: project.name, joinCode: project.joinCode, createdAt: project.createdAt.toISOString(), role: membership.role, lists: project.lists.map((list) => ({ id: list.id, name: list.name })), labels: project.labels, members: project.members.map((member) => member.user), tasks }} />;
}
