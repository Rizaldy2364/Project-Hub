import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectMembership } from "@/lib/project-guard";
import { canCreateTask, canViewJoinCode } from "@/lib/permissions";
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
 * bukan anggota → notFound() (tidak membocorkan keberadaan project).
 */
export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { projectId } = await params;

  // Redirect URL lama ?tab=kanban dkk. dipindah ke proxy.ts — layout tidak
  // menerima searchParams di App Router.

  const guard = await getProjectMembership(projectId, session.user.id);
  if (!guard) notFound();
  const { project } = guard;
  const members = project.members;
  const myRole = guard.membership.role;
  const canCreate = canCreateTask(myRole);
  const canViewCode = canViewJoinCode(myRole);

  // Progres project — satu query groupBy, tarea task & list tidak terhapus.
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
        members={members}
        createTaskTrigger={
          canCreate ? (
            <CreateTaskModal
              projectId={projectId}
              lists={lists}
              members={members.map((m) => m.user)}
              labels={labels}
            >
              <button
                type="button"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              >
                + Buat task
              </button>
            </CreateTaskModal>
          ) : null
        }
        joinCode={canViewCode ? project.joinCode : undefined}
        canViewJoinCode={canViewCode}
      />

      {/* Strip progres di bawah judul. */}
      <section
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500"
              aria-hidden
            />
            <span className="text-slate-700 dark:text-slate-300">Progres project</span>
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">
            {taskDone} / {taskTotal} task · {taskPercent}%
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${taskPercent}%` }}
            />
          </div>
          <div className="flex gap-4 text-xs">
            {[...statusRows]
              .sort((a, b) => b._count._all - a._count._all)
              .map((row) => {
                const dot =
                  row.status === "DONE"
                    ? "bg-emerald-500"
                    : row.status === "IN_PROGRESS"
                      ? "bg-blue-500"
                      : "bg-slate-400";
                const label =
                  row.status === "DONE"
                    ? "Selesai"
                    : row.status === "IN_PROGRESS"
                      ? "Dikerjakan"
                      : "Belum";
                return (
                  <span key={row.status} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
                    {label}: {row._count._all}
                  </span>
                );
              })}
          </div>
        </div>
      </section>

      <ProjectTabs
        projectId={projectId}
        taskCount={taskTotal}
        memberCount={memberCount}
        unreadDiskusi={unreadDiskusi}
      />

      {children}
    </div>
  );
}