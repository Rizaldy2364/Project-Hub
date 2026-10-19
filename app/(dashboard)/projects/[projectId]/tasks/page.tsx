import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectMembership } from "@/lib/project-guard";
import { canViewJoinCode, canComment, canDeleteTask, canEditTask, canCreateTask } from "@/lib/permissions";
import { findProjectBoardById } from "@/repositories/project.repository";
import type { BoardProject, BoardTask } from "@/types";
import { TaskBoardShell } from "@/components/task/task-board-shell";

interface ProjectTasksPageProps {
  params: Promise<{ projectId: string }>;
}

/**
 * Tab Task project: papan task (Board | Daftar) yang dipindahkan dari halaman
 * project lama (kanban-board-tab). Header dan tab switchernya dihapus — render
 * dalam shared layout app/(dashboard)/projects/[projectId]/layout.tsx.
 * View (?view=board|list) dan semua filter dikelola oleh TaskBoardShell di klien.
 */
export default async function ProjectTasksPage({
  params,
}: ProjectTasksPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { projectId } = await params;

  const guard = await getProjectMembership(projectId, session.user.id);
  if (!guard) notFound();
  const myRole = guard.membership.role;

  const board = await findProjectBoardById(projectId);
  if (!board) notFound();

  const tasks: BoardTask[] = board.lists.flatMap((list) => list.tasks).map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    assignee: task.assignee,
    labels: task.labels,
    commentCount: task._count.comments,
  }));

  // joinCode hanya untuk ADMIN & MANAGER; untuk MEMBER/VIEWER field ini tidak
  // ikut dikirim ke client (bukan sekadar disembunyikan).
  const canViewCode = canViewJoinCode(myRole);
  const projectDto: BoardProject = {
    id: board.id,
    name: board.name,
    ...(canViewCode ? { joinCode: board.joinCode } : {}),
    createdAt: board.createdAt.toISOString(),
    role: myRole,
    lists: board.lists.map((list) => ({ id: list.id, name: list.name })),
    labels: board.labels,
    // board.members memakai profileUserSelect (lengkap) — dibutuhkan
    // MemberProfileModal; beda dengan select ringkas di project-guard.
    members: board.members.map((m) => ({
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
  };

  return (
    <TaskBoardShell
      project={projectDto}
      currentUser={{
        id: session.user.id,
        name: session.user.name ?? "Kamu",
        avatarUrl: session.user.image ?? null,
      }}
      canEdit={canEditTask(myRole)}
      canDelete={canDeleteTask(myRole)}
      canComment={canComment(myRole)}
      canCreateTask={canCreateTask(myRole)}
      myRole={myRole}
    />
  );
}