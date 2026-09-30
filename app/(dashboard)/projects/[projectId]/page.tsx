import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { findProjectBoardById } from "@/repositories/project.repository";
import { KanbanBoardTab } from "@/components/project/kanban-board-tab";
import type { BoardTask } from "@/types";

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

  return (
    <div className="mx-auto max-w-6xl">
      <KanbanBoardTab
        project={{
          id: project.id,
          name: project.name,
          joinCode: project.joinCode,
          createdAt: project.createdAt.toISOString(),
          role: membership.role,
          lists: project.lists.map((list) => ({ id: list.id, name: list.name })),
          labels: project.labels,
          members: project.members.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            avatarUrl: m.user.avatarUrl,
            role: m.role,
            bio: m.user.bio,
            coverGradient: m.user.coverGradient,
            headline: m.user.headline,
            company: m.user.company,
            location: m.user.location,
            website: m.user.website,
            githubUrl: m.user.githubUrl,
            linkedinUrl: m.user.linkedinUrl,
            birthDate: m.user.birthDate ? m.user.birthDate.toISOString() : null,
            gender: m.user.gender,
            skills: m.user.skills,
            languages: m.user.languages,
          })),
          tasks,
        }}
      />
    </div>
  );
}
