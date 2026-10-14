"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
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
 * Toolbar filter halaman /laporan. Tiga dropdown (project, member, rentang);
 * semua state di URL. Member dropdown punya pencarian dan scroll internal.
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

  const [open, setOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const selectedMember = members.find((m) => m.id === member) ?? null;
  const memberLabel =
    member === "me"
      ? "Saya"
      : member === "all"
        ? "Semua anggota"
        : selectedMember?.name;

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

  // Tutup dropdown member saat klik di luar.
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
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      {/* Dropdown project */}
      <label className="relative inline-flex items-center">
        <span className="relative inline-flex items-center">
          <select
            value={project}
            onChange={(e) => pushQuery({ project: e.target.value })}
            aria-label="Pilih project"
            className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/[.08] dark:bg-[#0F1524] dark:text-slate-100"
          >
            <option value="all">Semua project</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-400" />
        </span>
      </label>
      {/* Dropdown member dengan pencarian dan scroll internal */}
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Pilih anggota"
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white pl-3 pr-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 sm:w-52 dark:border-white/[.08] dark:bg-[#0F1524] dark:text-slate-100",
            open && "border-blue-500 ring-2 ring-blue-500/30"
          )}
        >
          <span className="truncate">{memberLabel}</span>
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
        </button>

        {open && (
          <div className="absolute right-0 top-11 z-20 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-white/[.08] dark:bg-[#131A2B]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder="Cari anggota..."
                aria-label="Cari anggota"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-white/[.08] dark:bg-[#0F1524] dark:text-white"
              />
            </div>
            <ul
              role="listbox"
              aria-label="Daftar anggota"
              className="mt-2 max-h-56 space-y-0.5 overflow-y-auto"
            >
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={member === "all"}
                  onClick={() => {
                    pushQuery({ member: "" });
                    setOpen(false);
                    setMemberQuery("");
                  }}
                  className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:bg-[#1B2438]"
                >
                  Semua anggota
                </button>
              </li>
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={member === "me"}
                  onClick={() => {
                    pushQuery({ member: "me" });
                    setOpen(false);
                    setMemberQuery("");
                  }}
                  className={cn(
                    "w-full rounded-lg px-2 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    member === "me"
                      ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-[#1B2438]"
                  )}
                >
                  Saya
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
                  Tidak ada anggota yang cocok
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Dropdown rentang */}
      <label className="relative inline-flex items-center">
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
  );
}
