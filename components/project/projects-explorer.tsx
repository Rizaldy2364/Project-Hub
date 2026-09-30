"use client";

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

export function ProjectsExplorer({ projects }: { projects: DashboardProject[] }) {
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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
          <FolderKanban className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Belum ada project
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Buat project baru atau gabung pakai kode dari timmu.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <CreateProjectModal />
          <JoinProjectModal />
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
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {pills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setRoleFilter(pill.key)}
              className={cn(
                "px-3.5 py-2 rounded-full text-sm font-medium transition-colors",
                roleFilter === pill.key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
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
              className="w-full sm:w-56 pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
            >
              <option value="recent">Terbaru dibuat</option>
              <option value="name">Nama A–Z</option>
              <option value="progress">Progress tertinggi</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>

          <div className="flex rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5">
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
                onClick={() => setView(key)}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  view === key
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
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
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
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