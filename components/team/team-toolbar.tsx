"use client";

import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  TeamProjectOption,
  TeamRoleFilter,
  TeamSort,
  TeamSummary,
} from "@/types";

const ROLE_TABS: { key: TeamRoleFilter; label: string; countKey: keyof TeamSummary | "total" }[] = [
  { key: "all", label: "Semua", countKey: "total" },
  { key: "ADMIN", label: "Admin", countKey: "admin" },
  { key: "MANAGER", label: "Manager", countKey: "manager" },
  { key: "MEMBER", label: "Member", countKey: "member" },
  { key: "VIEWER", label: "Viewer", countKey: "viewer" },
];

const SORT_OPTIONS: { value: TeamSort; label: string }[] = [
  { value: "joined_desc", label: "Terbaru bergabung" },
  { value: "joined_asc", label: "Terlama bergabung" },
  { value: "name_asc", label: "Nama A–Z" },
  { value: "name_desc", label: "Nama Z–A" },
];

export interface TeamToolbarProps {
  projects: TeamProjectOption[];
  projectId: string;
  role: TeamRoleFilter;
  sort: TeamSort;
  qInput: string;
  setQInput: (v: string) => void;
  pushQuery: (next: Record<string, string>) => void;
  summary: TeamSummary;
}

export function TeamToolbar(p: TeamToolbarProps) {
  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <span className="shrink-0">Project:</span>
          <span className="relative inline-flex items-center">
            <select
              value={p.projectId}
              onChange={(e) => p.pushQuery({ project: e.target.value, page: "1" })}
              aria-label="Pilih project"
              className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              {p.projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-400" />
          </span>
        </label>

        <div role="tablist" aria-label="Filter peran" className="flex flex-wrap gap-2">
          {ROLE_TABS.map(({ key, label, countKey }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={p.role === key}
              onClick={() => p.pushQuery({ role: key === "all" ? "" : key, page: "1" })}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                p.role === key
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              )}
            >
              {label} <span className="opacity-80">{p.summary[countKey]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={p.qInput}
            onChange={(e) => p.setQInput(e.target.value)}
            placeholder="Cari nama atau email..."
            aria-label="Cari nama atau email"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <label className="relative sm:w-52">
          <select
            value={p.sort}
            onChange={(e) => p.pushQuery({ sort: e.target.value, page: "1" })}
            aria-label="Urutkan anggota"
            className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </label>
      </div>
    </>
  );
}
