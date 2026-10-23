import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { findMyTasksByUserId } from "@/repositories/task.repository";
import { ProjectTasksShell } from "@/components/tasks/project-tasks-shell";
import type { MyTaskItem } from "@/types";

/**
 * Halaman Task Project (/tasks): semua task yang ditugaskan atau dibuat user
 * di berbagai proyek, dilihat dalam bentuk Board | Daftar. VIEW-ONLY untuk
 * semua role (Admin, Manager, Member, Viewer) — tidak ada fitur tambah/edit/
 * hapus/ubah status task. Pencarian di kiri, filter proyek & status, serta
 * pagination di style Daftar mengikuti tampilan tab Task di detail proyek.
 */
export default async function MyTasksPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user.id;

  // Kumpulkan project yang diikuti user untuk opsi filter proyek.
  const projectOptions: { id: string; name: string }[] = [];

  const groups = await findMyTasksByUserId(userId);
  const allTasks: MyTaskItem[] = groups.flatMap((g) => {
    projectOptions.push({ id: g.id, name: g.name });
    return g.tasks;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <ProjectTasksShell
        tasks={allTasks}
        currentUser={{
          id: session.user.id,
          name: session.user.name ?? "Kamu",
          avatarUrl: session.user.image ?? null,
        }}
        projects={projectOptions}
      />
    </div>
  );
}
