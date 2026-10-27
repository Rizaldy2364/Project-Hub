"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, FolderKanban, Users } from "lucide-react";
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
  { value: 7, label: "7 hari terakhir" },
  { value: 30, label: "30 hari terakhir" },
  { value: 90, label: "90 hari terakhir" },
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
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams(searchParams.toString());
    if (sp.get("member")) {
      sp.delete("member");
      router.replace(`${pathname}?${sp.toString()}`);
    }
  }, [project, pathname, searchParams, router]);

  function pushQuery(next: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    router.push(`${pathname}?${sp.toString()}`);
  }

  const isMobileView = isMobile ?? false;

  const mobileSelectClass =
    "w-full h-10 appearance-none rounded-full border border-slate-200 bg-white pl-4 pr-10 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/[.08] dark:bg-[#0F1524] dark:text-slate-100";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:w-full">
      {isMobileView ? (
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="relative inline-flex items-center w-full">
            <select
              value={type}
              onChange={(e) => pushQuery({ type: e.target.value })}
              aria-label="Filter jenis aktivitas"
              className={mobileSelectClass}
            >
              {TYPE_TABS.map((t) => (
                <option key={t.key} value={t.key === "all" ? "" : t.key}>
                  {t.label}
                </option>
              ))}
            </select>
            <span aria-hidden="true" className="pointer-events-none absolute right-2 text-slate-400">
              ▾
            </span>
          </div>

          <div className="relative inline-flex items-center w-full">
            <select
              value={range}
              onChange={(e) => pushQuery({ range: e.target.value })}
              aria-label="Pilih rentang waktu"
              className={mobileSelectClass}
            >
              {RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span aria-hidden="true" className="pointer-events-none absolute right-2 text-slate-400">
              ▾
            </span>
          </div>

          {showProjectDropdown ? (
            <div className="relative inline-flex items-center w-full">
              <FolderKanban
                className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400"
                aria-hidden="true"
              />
              <select
                value={project}
                onChange={(e) => pushQuery({ project: e.target.value })}
                aria-label="Pilih project"
                className={cn(mobileSelectClass, "pl-10 pr-7")}
              >
                <option value="">Semua project</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
              <span aria-hidden="true" className="pointer-events-none absolute right-2 text-slate-400">
                ▾
              </span>
            </div>
          ) : null}

          <div className="relative inline-flex items-center w-full">
            <Users
              className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400"
              aria-hidden="true"
            />
            <select
              value={member}
              onChange={(e) => pushQuery({ member: e.target.value })}
              aria-label="Pilih member"
              className={cn(mobileSelectClass, "pl-10 pr-7")}
            >
              <option value="">Semua member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <span aria-hidden="true" className="pointer-events-none absolute right-2 text-slate-400">
              ▾
            </span>
          </div>
        </div>
      ) : (
        <div className="flex w-full items-center">
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

          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            {showProjectDropdown && (
              <div className="relative inline-flex items-center">
                <FolderKanban
                  className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400"
                  aria-hidden="true"
                />
                <select
                  value={project}
                  onChange={(e) => pushQuery({ project: e.target.value })}
                  aria-label="Pilih project"
                  className="h-8 max-w-[220px] appearance-none rounded-full border border-slate-200 bg-white py-1 pl-8 pr-7 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40"
                >
                  <option value="">Semua project</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
                <span aria-hidden="true" className="pointer-events-none absolute right-2 text-slate-400">
                  ▾
                </span>
              </div>
            )}

            <div className="relative inline-flex items-center">
              <Users
                className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400"
                aria-hidden="true"
              />
              <select
                value={member}
                onChange={(e) => pushQuery({ member: e.target.value })}
                aria-label="Pilih member"
                className="h-8 max-w-[220px] appearance-none rounded-full border border-slate-200 bg-white py-1 pl-8 pr-7 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40"
              >
                <option value="">Semua member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <span aria-hidden="true" className="pointer-events-none absolute right-2 text-slate-400">
                ▾
              </span>
            </div>

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
        </div>
      )}
    </div>
  );
}
