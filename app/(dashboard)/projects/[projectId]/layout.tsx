import { notFound, redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { getProjectMembership } from "@/lib/project-guard";
import { canCreateTask, canViewJoinCode, canEditProjectSettings } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { countUnreadNotificationsByProject } from "@/repositories/notification.repository";
import { findTaskListsByProjectId } from "@/repositories/list.repository";
import { ProjectHeader } from "@/components/project/project-header";
import { ProjectTabs } from "@/components/project/project-tabs";
import { CreateTaskModal } from "@/components/task/create-task-modal";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}

/**
 * Layout shared semua tab project (/projects/[id], /tasks, /anggota,
 * /diskusi, /aktivitas). Header + tab bar ditampilkan sekali, lalu {children}.
 *
 * Keamanan: sesi dan baris ProjectMember divalidasi di sini (dan ulang, lewat
 * cache() yang sama, di setiap halaman tab). Project soft-deleted atau user
 * bukan anggota â†’ notFound() (tidak membocorkan keberadaan project).
 */
export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { projectId } = await params;

  // Redirect URL lama ?tab=kanban dkk. dipindah ke proxy.ts â€” layout tidak
  // menerima searchParams di App Router.

  const guard = await getProjectMembership(projectId, session.user.id);
  if (!guard) notFound();
  const { project } = guard;
  const members = project.members;
  const myRole = guard.membership.role;
  const canCreate = canCreateTask(myRole);
  const canViewCode = canViewJoinCode(myRole);
  const isAdmin = canEditProjectSettings(myRole);

  // Progres project â€” satu query groupBy, tarea task & list tidak terhapus.
  const statusRows = await prisma.task.groupBy({
    by: ["status"],
    where: { deletedAt: null, list: { projectId, deletedAt: null } },
    _count: { _all: true },
  });
  const counts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  for (const row of statusRows) {
    counts[row.status as keyof typeof counts] = row._count._all;
  }
  const taskTotal = counts.TODO + counts.IN_PROGRESS + counts.DONE;
  const taskDone = counts.DONE;
  const taskPercent = taskTotal === 0 ? 0 : Math.round((taskDone / taskTotal) * 100);

  const memberCount = await prisma.projectMember.count({ where: { projectId } });
  const unreadDiskusi = await countUnreadNotificationsByProject(
    session.user.id,
    projectId
  );

  // Data form buat task (daftar kolom + label) hanya perlu saat modal dibuka,
  // tapi dirender bersama halaman agar tombol "+ Buat task" siap. Hanya
  // diambil bila user boleh membuat task (ADMIN/MANAGER).
  let lists: { id: string; name: string }[] = [];
  let labels: { id: string; name: string; color: string }[] = [];
  if (canCreate) {
    const [rows, labelRows] = await Promise.all([
      findTaskListsByProjectId(projectId),
      prisma.label.findMany({
        where: { projectId, deletedAt: null },
        select: { id: true, name: true, color: true },
        orderBy: { name: "asc" },
      }),
    ]);
    lists = rows;
    labels = labelRows;
  }

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={{
          id: project.id,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          ...(canViewCode ? { joinCode: project.joinCode } : {}),
        }}
        role={myRole}
        progress={{
          todo: counts.TODO,
          inProgress: counts.IN_PROGRESS,
          done: taskDone,
          total: taskTotal,
          percent: taskPercent,
        }}
        createTaskTrigger={
          canCreate ? (
            <CreateTaskModal
              projectId={projectId}
              lists={lists}
              members={members.map((m) => m.user)}
              labels={labels}
            >
              {/* Satu ikon Plus, tanpa karakter "+", tanpa wrap. */}
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                Buat task
              </button>
            </CreateTaskModal>
          ) : null
        }
        joinCode={canViewCode ? project.joinCode : undefined}
        canViewJoinCode={canViewCode}
      />

      <ProjectTabs
        projectId={projectId}
        taskCount={taskTotal}
        memberCount={memberCount}
        unreadDiskusi={unreadDiskusi}
        isAdmin={isAdmin}
      />

      {children}
    </div>
  );
}