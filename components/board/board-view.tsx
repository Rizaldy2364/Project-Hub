"use client";

import { useMemo, useState } from "react";
import { Search, Tag, Users } from "lucide-react";
import { TaskRow } from "@/components/board/task-row";
import type { BoardProject, BoardTask } from "@/types";

interface BoardViewProps {
  project: BoardProject;
  onSelectTask: (task: BoardTask) => void;
}

/** Tab Kanban Board: pencarian task, filter assignee/label, dan daftar task. */
export function BoardView({ project, onSelectTask }: BoardViewProps) {
  const [search, setSearch] = useState("");
  const [assignee, setAssignee] = useState("all");
  const [label, setLabel] = useState("all");

  const labels = useMemo(
    () =>
      Array.from(
        new Map(
          project.tasks.flatMap((task) => task.labels).map((item) => [item.id, item])
        ).values()
      ),
    [project.tasks]
  );

  const visibleTasks = useMemo(
    () =>
      project.tasks.filter(
        (task) =>
          `${task.title} ${task.description ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (assignee === "all" || task.assignee?.id === assignee) &&
          (label === "all" || task.labels.some((item) => item.id === label))
      ),
    [project.tasks, search, assignee, label]
  );

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari task..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <span className="sr-only">Cari task</span>
          </label>
          <FilterSelect
            value={assignee}
            onChange={setAssignee}
            icon={Users}
            label="Assignee"
            options={[
              { value: "all", label: "Semua anggota" },
              ...project.members.map((member) => ({ value: member.id, label: member.name })),
            ]}
          />
          <FilterSelect
            value={label}
            onChange={setLabel}
            icon={Tag}
            label="Label"
            options={[
              { value: "all", label: "Semua label" },
              ...labels.map((item) => ({ value: item.id, label: `#${item.name}` })),
            ]}
          />
        </div>
      </section>

      <section aria-label="Task List" className="mt-6">
        <div className="rounded-2xl bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-200 overflow-hidden shadow-sm dark:shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="p-2">
            {visibleTasks.length ? (
              visibleTasks.map((task) => (
                <TaskRow key={task.id} task={task} onClick={() => onSelectTask(task)} />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">Belum ada task</p>
            )}
          </div>
        </div>
      </section>
    </>
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
