"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ActivityMemberOption,
  ActivityProjectOption,
  ActivityRangeValue,
  ActivityTypeFilterValue,
} from "@/types";

const TYPE_TABS: { key: ActivityTypeFilterValue; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "task", label: "Task" },
  { key: "comment", label: "Komentar" },
  { key: "file", label: "File" },
  { key: "member", label: "Anggota" },
];

const RANGE_OPTIONS: { value: ActivityRangeValue; label: string }[] = [
  { value: 7, label: "7 hari" },
  { value: 30, label: "30 hari" },
  { value: 90, label: "90 hari" },
];

interface ActivityToolbarProps {
  type: ActivityTypeFilterValue;
  project: string;
  member: string;
  range: ActivityRangeValue;
  projects: ActivityProjectOption[];
  members: ActivityMemberOption[];
  /** Sembunyikan filter project (tab Aktivitas di dalam project — fixed). */
  showProjectDropdown?: boolean;
}

export function ActivityToolbar({
  type,
  project,
  member,
  range,
  projects,
  members,
  showProjectDropdown = true,
}: ActivityToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const selectedMember = members.find((m) => m.id === member) ?? null;
  const query = memberQuery.trim().toLowerCase();
  const filteredMembers = query
    ? members.filter((m) => m.name.toLowerCase().includes(query))
    : members;

  function pushQuery(next: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    router.push(`${pathname}?${sp.toString()}`);
  }

  // Tutup dropdown saat klik di luar.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div role="tablist" aria-label="Filter jenis aktivitas" className="flex flex-wrap gap-2">
        {TYPE_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={type === key}
            onClick={() => pushQuery({ type: key === "all" ? "" : key })}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              type === key
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-white/[.08] dark:bg-[#131A2B] dark:text-slate-300 dark:hover:bg-[#1B2438]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:ml-auto">
        {showProjectDropdown && (
        <label className="relative inline-flex items-center">
          <span className="mr-2 shrink-0 text-sm font-medium text-slate-600 dark:text-slate-300">
            Project:
          </span>
          <span className="relative inline-flex items-center">
            <select
              value={project}
              onChange={(e) => pushQuery({ project: e.target.value })}
              aria-label="Pilih project"
              className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/[.08] dark:bg-[#0F1524] dark:text-slate-100"
            >
              <option value="">Semua project</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-400" />
          </span>
        </label>
        )}

        {/* Dropdown member dengan pencarian dan scroll internal */}
        <div ref={wrapRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label="Pilih member"
            className={cn(
              "flex h-10 w-full items-center rounded-xl border border-slate-200 bg-white pl-3 pr-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 sm:w-52 dark:border-white/[.08] dark:bg-[#0F1524] dark:text-slate-200",
              open && "border-blue-500 ring-2 ring-blue-500/30"
            )}
          >
            <span className="truncate">
              {selectedMember ? selectedMember.name : "Semua member"}
            </span>
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
          </button>

          {open && (
            <div className="absolute left-0 top-11 z-20 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-white/[.08] dark:bg-[#131A2B]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  placeholder="Cari member..."
                  aria-label="Cari member"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-white/[.08] dark:bg-[#0F1524] dark:text-white"
                />
              </div>
              <ul
                role="listbox"
                aria-label="Daftar member"
                className="mt-2 max-h-56 space-y-0.5 overflow-y-auto"
              >
                <li>
                  <button
                    type="button"
                    role="option"
                    aria-selected={member === ""}
                    onClick={() => {
                      pushQuery({ member: "" });
                      setOpen(false);
                      setMemberQuery("");
                    }}
                    className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:bg-[#1B2438]"
                  >
                    Semua member
                  </button>
                </li>
                {filteredMembers.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={member === m.id}
                      onClick={() => {
                        pushQuery({ member: m.id });
                        setOpen(false);
                        setMemberQuery("");
                      }}
                      className={cn(
                        "w-full truncate rounded-lg px-2 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                        member === m.id
                          ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                          : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-[#1B2438]"
                      )}
                    >
                      {m.name}
                    </button>
                  </li>
                ))}
                {filteredMembers.length === 0 && (
                  <li className="px-2 py-3 text-center text-xs text-slate-400">
                    Tidak ada member yang cocok
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <label className="relative inline-flex items-center">
          <span className="mr-2 shrink-0 text-sm font-medium text-slate-600 dark:text-slate-300">
            Rentang:
          </span>
          <span className="relative inline-flex items-center">
            <select
              value={range}
              onChange={(e) => pushQuery({ range: e.target.value })}
              aria-label="Pilih rentang waktu"
              className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/[.08] dark:bg-[#0F1524] dark:text-slate-100"
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
    </div>
  );
}
