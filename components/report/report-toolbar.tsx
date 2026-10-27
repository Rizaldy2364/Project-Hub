"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, FolderKanban, Users } from "lucide-react";
import type {
  ReportMemberOption,
  ReportProjectOption,
  ReportRangeValue,
} from "@/types";

const RANGE_OPTIONS: { value: ReportRangeValue; label: string }[] = [
  { value: 7, label: "7 hari terakhir" },
  { value: 30, label: "30 hari terakhir" },
  { value: 90, label: "90 hari terakhir" },
];

interface ReportToolbarProps {
  project: string;
  member: string;
  range: ReportRangeValue;
  projects: ReportProjectOption[];
  members: ReportMemberOption[];
}

/**
 * Toolbar filter halaman /laporan dengan style yang selaras dengan halaman aktivitas.
 */
export function ReportToolbar({
  project,
  member,
  range,
  projects,
  members,
}: ReportToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pushQuery(next: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
      {/* Dropdown project */}
      <div className="relative inline-flex min-w-0 items-center sm:min-w-fit">
        <FolderKanban
          className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400"
          aria-hidden="true"
        />
        <select
          value={project}
          onChange={(e) => pushQuery({ project: e.target.value })}
          aria-label="Pilih project"
          className="h-8 w-full min-w-0 max-w-[220px] appearance-none rounded-full border border-slate-200 bg-white py-1 pl-8 pr-7 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40 sm:w-auto"
        >
          <option value="all">Semua project</option>
          {projects.map((proj) => (
            <option key={proj.id} value={proj.id}>
              {proj.name}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-2 text-slate-400"
        >
          ▾
        </span>
      </div>

      {/* Dropdown member */}
      <div className="relative inline-flex min-w-0 items-center sm:min-w-fit">
        <Users
          className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400"
          aria-hidden="true"
        />
        <select
          value={member}
          onChange={(e) => pushQuery({ member: e.target.value })}
          aria-label="Pilih member"
          className="h-8 w-full min-w-0 max-w-[220px] appearance-none rounded-full border border-slate-200 bg-white py-1 pl-8 pr-7 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40 sm:w-auto"
        >
          <option value="all">Semua anggota</option>
          <option value="me">Saya</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-2 text-slate-400"
        >
          ▾
        </span>
      </div>

      {/* Dropdown rentang */}
      <label className="relative col-span-2 inline-flex w-full items-center sm:col-auto sm:w-auto">
        <span className="relative inline-flex w-full items-center sm:w-auto">
          <select
            value={range}
            onChange={(e) => pushQuery({ range: e.target.value })}
            aria-label="Pilih rentang waktu"
            className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/[.08] dark:bg-[#0F1524] dark:text-slate-100 sm:w-auto"
          >
            {RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-400" />
        </span>
      </label>
    </div>
  );
}
