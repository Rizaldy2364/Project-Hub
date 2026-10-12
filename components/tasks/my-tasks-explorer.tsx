"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectGroup } from "@/components/tasks/project-group";
import type { MyTasksProjectGroup } from "@/types";

type StatusFilter = "ALL" | "TODO" | "IN_PROGRESS" | "DONE";

const statusOptions: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "Semua" },
  { key: "TODO", label: "Belum" },
  { key: "IN_PROGRESS", label: "Dikerjakan" },
  { key: "DONE", label: "Selesai" },
];

/** Filter member + status + search task/proyek, dan daftar task per project. */
export function MyTasksExplorer({ groups }: { groups: MyTasksProjectGroup[] }) {
  const [memberFilter, setMemberFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState<string[]>(() => groups.map((g) => g.id));

  const members = useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatarUrl: string | null }>();
    for (const group of groups) {
      for (const task of group.tasks) {
        if (task.assignee && !map.has(task.assignee.id)) map.set(task.assignee.id, task.assignee);
      }
    }
    return [...map.values()];
  }, [groups]);

  const toggle = (id: string) =>
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .map((group) => {
        // Satu kolom pencarian: cocok jika nama proyek ATAU judul task-nya cocok.
        const projectMatch = q === "" || group.name.toLowerCase().includes(q);
        return {
          ...group,
          tasks: group.tasks.filter(
            (task) =>
              (memberFilter === "ALL" || task.assignee?.id === memberFilter) &&
              (statusFilter === "ALL" || task.status === statusFilter) &&
              (q === "" || projectMatch || task.title.toLowerCase().includes(q))
          ),
        };
      })
      .filter((group) => group.tasks.length > 0);
  }, [groups, memberFilter, statusFilter, query]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {statusOptions.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                statusFilter === key
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          <label className="relative sm:w-48">
            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              aria-label="Filter member"
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="ALL">Semua member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </label>
          <label className="relative sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari task atau proyek..."
              aria-label="Cari task atau proyek"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </label>
        </div>
      </div>
      {visibleGroups.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          Tidak ada task yang cocok dengan filter kamu.
        </p>
      ) : (
        visibleGroups.map((group) => (
          <ProjectGroup
            key={group.id}
            group={group}
            open={openIds.includes(group.id)}
            onToggle={() => toggle(group.id)}
          />
        ))
      )}
    </section>
  );
}
