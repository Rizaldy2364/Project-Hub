"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, FolderKanban, LayoutGrid, List, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardProject } from "@/types";
import { ProjectCard } from "@/components/project/project-card";
import { CreateProjectModal } from "@/components/project/create-project-modal";
import { JoinProjectModal } from "@/components/project/join-project-modal";

type RoleFilter = "ALL" | "ADMIN" | "MEMBER";
type SortKey = "recent" | "name" | "progress";

const progressOf = (p: DashboardProject) =>
  p.taskTotal === 0 ? 0 : p.taskDone / p.taskTotal;

interface ProjectsExplorerProps {
  projects: DashboardProject[];
  /** Tombol buat/gabung di empty state. Dashboard mematikannya — aksi create hanya di halaman Project Saya. */
  showCreateActions?: boolean;
}

export function ProjectsExplorer({
  projects,
  showCreateActions = true,
}: ProjectsExplorerProps) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [sort, setSort] = useState<SortKey>("recent");
  const [view, setView] = useState<"grid" | "list">("grid");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = projects.filter(
      (p) =>
        (roleFilter === "ALL" || p.role === roleFilter) &&
        (q === "" || p.name.toLowerCase().includes(q))
    );

    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "progress") return progressOf(b) - progressOf(a);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [projects, query, roleFilter, sort]);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4">
          <FolderKanban className="w-6 h-6 text-blue-600 dark:text-blue-300" />
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Belum ada project
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {showCreateActions
            ? "Buat project baru atau gabung pakai kode dari timmu."
            : "Buka halaman Project Saya untuk membuat project baru atau bergabung dengan kode."}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {showCreateActions ? (
            <>
              <CreateProjectModal />
              <JoinProjectModal />
            </>
          ) : (
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
            >
              Buka Project Saya
            </Link>
          )}
        </div>
      </div>
    );
  }

  const pills: { key: RoleFilter; label: string; count: number }[] = [
    { key: "ALL", label: "Semua Project", count: projects.length },
    {
      key: "ADMIN",
      label: "Sebagai Admin",
      count: projects.filter((p) => p.role === "ADMIN").length,
    },
    {
      key: "MEMBER",
      label: "Sebagai Member",
      count: projects.filter((p) => p.role === "MEMBER").length,
    },
  ];

  return (
    <section className="space-y-5">
      {/* Toolbar: filter pills di kiri, cari/urut/tampilan di kanan */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter project">
          {pills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              aria-pressed={roleFilter === pill.key}
              onClick={() => setRoleFilter(pill.key)}
              className={cn(
                "rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                roleFilter === pill.key
                  ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              {pill.label}
              <span className="ml-1.5 opacity-70">{pill.count}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama project..."
              aria-label="Cari nama project"
              className="w-full sm:w-56 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <label htmlFor="project-sort" className="sr-only">
              Urutkan berdasarkan
            </label>
            <div className="relative">
              <select
                id="project-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="recent">Terbaru dibuat</option>
                <option value="name">Nama A–Z</option>
                <option value="progress">Progress tertinggi</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="flex rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900">
            {(
              [
                { key: "grid", icon: LayoutGrid, label: "Tampilan grid" },
                { key: "list", icon: List, label: "Tampilan list" },
              ] as const
            ).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={view === key}
                onClick={() => setView(key)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  view === key
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Daftar */}
      {visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          Tidak ada project yang cocok dengan filter kamu.
        </p>
      ) : (
        <div
          className={
            view === "grid"
              ? "grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-3"
          }
        >
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} view={view} />
          ))}
        </div>
      )}
    </section>
  );
}