import { KeyRound, Plus } from "lucide-react";
import { CreateProjectModal } from "@/components/project/create-project-modal";
import { JoinProjectModal } from "@/components/project/join-project-modal";

/** Header halaman "Project Saya": judul, deskripsi, dan aksi buat/gabung project. */
export function ProjectsHeader() {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          Project Saya
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Semua project yang kamu kelola atau ikuti.
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <CreateProjectModal className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950">
          <Plus className="h-4 w-4" />
          Project Baru
        </CreateProjectModal>
        <JoinProjectModal className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
          <KeyRound className="h-4 w-4" />
          Gabung via Kode
        </JoinProjectModal>
      </div>
    </section>
  );
}
