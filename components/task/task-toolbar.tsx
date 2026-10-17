"use client";

import { LayoutGrid, List, Search, Tag, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BoardLabel } from "@/types";

export type TaskView = "board" | "list";

interface TaskToolbarProps {
  view: TaskView;
  onViewChange: (view: TaskView) => void;
  search: string;
  onSearchChange: (value: string) => void;
  assignee: string;
  onAssigneeChange: (value: string) => void;
  label: string;
  onLabelChange: (value: string) => void;
  members: { id: string; name: string }[];
  labels: BoardLabel[];
}

/**
 * Toolbar tab Task: segmented control Board | Daftar + pencarian + filter
 * anggota/label. Satu filter dipakai bersama kedua view (satu sumber data).
 */
export function TaskToolbar({
  view,
  onViewChange,
  search,
  onSearchChange,
  assignee,
  onAssigneeChange,
  label,
  onLabelChange,
  members,
  labels,
}: TaskToolbarProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div
          role="group"
          aria-label="Tampilan task"
          className="inline-flex shrink-0 items-center self-start rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
        >
          <ViewButton
            active={view === "board"}
            onClick={() => onViewChange("board")}
            icon={<LayoutGrid className="h-3.5 w-3.5" aria-hidden />}
            label="Board"
            ariaLabel="Tampilan board"
          />
          <ViewButton
            active={view === "list"}
            onClick={() => onViewChange("list")}
            icon={<List className="h-3.5 w-3.5" aria-hidden />}
            label="Daftar"
            ariaLabel="Tampilan daftar"
          />
        </div>
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari task..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <span className="sr-only">Cari task</span>
        </label>
        <FilterSelect
          value={assignee}
          onChange={onAssigneeChange}
          icon={Users}
          label="Assignee"
          options={[
            { value: "all", label: "Semua anggota" },
            ...members.map((member) => ({ value: member.id, label: member.name })),
          ]}
        />
        <FilterSelect
          value={label}
          onChange={onLabelChange}
          icon={Tag}
          label="Label"
          options={[
            { value: "all", label: "Semua label" },
            ...labels.map((item) => ({ value: item.id, label: `#${item.name}` })),
          ]}
        />
      </div>
    </section>
  );
}

function ViewButton({
  active,
  onClick,
  icon,
  label,
  ariaLabel,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        active
          ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  icon: typeof Tag;
  label: string;
  options: { value: string; label: string }[];
}

function FilterSelect({ value, onChange, icon: Icon, label, options }: FilterSelectProps) {
  return (
    <label className="relative shrink-0">
      <Icon className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs font-semibold text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
      >
        <option value="" disabled>{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <span className="sr-only">{label}</span>
    </label>
  );
}
