"use client";

import { ArrowUpDown, ChevronDown, Search } from "lucide-react";
import type {
  TeamProjectOption,
  TeamRoleFilter,
  TeamSort,
  TeamSummary,
} from "@/types";

const ROLE_OPTIONS: { value: TeamRoleFilter; label: string }[] = [
  { value: "all", label: "Semua Peran" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "MEMBER", label: "Member" },
  { value: "VIEWER", label: "Viewer" },
];

const SORT_OPTIONS: { value: TeamSort; label: string }[] = [
  { value: "role", label: "Peran" },
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
  summary?: TeamSummary;
  /** Sembunyikan pemilih project — dipakai saat anggota difixed ke satu project. */
  showProjectDropdown?: boolean;
}

export function TeamToolbar(p: TeamToolbarProps) {
  const showProjectDropdown = p.showProjectDropdown !== false;
  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === p.sort)?.label ?? "Peran";

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      {/* Baris 1: Pencarian */}
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={p.qInput}
          onChange={(e) => p.setQInput(e.target.value)}
          placeholder="Cari nama atau email..."
          aria-label="Cari nama atau email"
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Baris 2: Project + Peran (+ Sort hanya desktop) */}
      <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-wrap lg:items-center lg:shrink-0">
        {showProjectDropdown ? (
          <div className="relative min-w-0">
            <label htmlFor="team-project-select" className="sr-only">
              Pilih project
            </label>
            <select
              id="team-project-select"
              value={p.projectId}
              onChange={(e) => p.pushQuery({ project: e.target.value, page: "1" })}
              aria-label="Pilih project"
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              {p.projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        ) : null}

        {/* Filter Peran */}
        <div className="relative min-w-0">
          <label htmlFor="team-role-filter" className="sr-only">
            Filter peran
          </label>
          <select
            id="team-role-filter"
            value={p.role || "all"}
            onChange={(e) =>
              p.pushQuery({
                role: e.target.value === "all" ? "" : e.target.value,
                page: "1",
              })
            }
            aria-label="Filter peran"
            className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>

        {/* Urutkan — desktop: dropdown inline */}
        <div className="relative hidden lg:block">
          <label htmlFor="team-sort-select" className="sr-only">
            Urutkan anggota
          </label>
          <select
            id="team-sort-select"
            value={p.sort}
            onChange={(e) => p.pushQuery({ sort: e.target.value, page: "1" })}
            aria-label="Urutkan anggota"
            className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Baris 3 (mobile only): Urutkan — select dengan ikon ArrowUpDown */}
      <div className="relative lg:hidden">
        <label htmlFor="team-sort-select-mobile" className="sr-only">
          Urutkan anggota
        </label>
        <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-400" />
        <select
          id="team-sort-select-mobile"
          value={p.sort}
          onChange={(e) => p.pushQuery({ sort: e.target.value, page: "1" })}
          aria-label="Urutkan anggota"
          className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      </div>
    </div>
  );
}
