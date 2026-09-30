"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  Plus,
  Search,
  ShieldCheck,
  Tag,
  Users,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { CreateTaskModal } from "@/components/task/create-task-modal";

export interface BoardTask {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate: string | null;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  labels: { id: string; name: string; color: string }[];
  commentCount: number;
}

interface KanbanBoardTabProps {
  project: {
    id: string;
    name: string;
    joinCode: string;
    createdAt: string;
    role: "ADMIN" | "MEMBER";
    lists: { id: string; name: string }[];
    labels: { id: string; name: string; color: string }[];
    members: { id: string; name: string; avatarUrl: string | null }[];
    tasks: BoardTask[];
  };
}

const columns = [
  { key: "TODO", label: "To Do", dot: "bg-slate-400" },
  { key: "IN_PROGRESS", label: "In Progress", dot: "bg-indigo-500" },
  { key: "DONE", label: "Done", dot: "bg-emerald-500" },
] as const;

export function KanbanBoardTab({ project }: KanbanBoardTabProps) {
  const [search, setSearch] = useState("");
  const [assignee, setAssignee] = useState("all");
  const [label, setLabel] = useState("all");
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);
  const [copied, setCopied] = useState(false);

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

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(project.joinCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Browser dapat menolak akses clipboard.
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300"
        >
          ← Kembali ke proyek
        </Link>

        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold text-slate-900 dark:text-zinc-100">
              {project.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-600 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                KODE GABUNG: {project.joinCode}
                <Copy className="h-3.5 w-3.5" />
                {copied && " Tersalin"}
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                {project.role === "ADMIN" ? "Admin" : "Member"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                <CalendarDays className="h-3.5 w-3.5" />
                Dibuat {format(new Date(project.createdAt), "d MMM yyyy")}
              </span>
            </div>
          </div>

          {project.role === "ADMIN" && (
            <CreateTaskModal
              projectId={project.id}
              lists={project.lists}
              members={project.members}
              labels={project.labels}
            >
              <button className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:w-auto dark:focus-visible:ring-offset-zinc-900">
                <Plus className="h-4 w-4" />
                Buat task
              </button>
            </CreateTaskModal>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari task..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
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

      <section aria-label="Papan Kanban" className="grid snap-x grid-flow-col auto-cols-[minmax(17rem,82vw)] gap-4 overflow-x-auto pb-2 md:auto-cols-[minmax(18rem,1fr)] lg:grid-flow-row lg:grid-cols-3 lg:overflow-visible">
        {columns.map((column) => (
          <KanbanColumn
            key={column.key}
            label={column.label}
            dot={column.dot}
            tasks={visibleTasks.filter((task) => task.status === column.key)}
            onTaskClick={setSelectedTask}
          />
        ))}
      </section>

      <TaskDetail
        task={selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />
    </div>
  );
}

function FilterSelect({ value, onChange, icon: Icon, label, options }: { value: string; onChange: (value: string) => void; icon: typeof Tag; label: string; options: { value: string; label: string }[] }) {
  return <label className="relative shrink-0"><Icon className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" /><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs font-semibold text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"><option value="" disabled>{label}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><span className="sr-only">{label}</span></label>;
}

function KanbanColumn({ label, dot, tasks, onTaskClick }: { label: string; dot: string; tasks: BoardTask[]; onTaskClick: (task: BoardTask) => void }) {
  return <section className="snap-start rounded-2xl bg-slate-100/70 p-3 dark:bg-zinc-900/60"><header className="mb-3 flex items-center gap-2 px-1"><span className={`h-2 w-2 rounded-full ${dot}`} /><h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100">{label}</h2><span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-zinc-800">{tasks.length}</span></header><div className="min-h-20 space-y-3">{tasks.length ? tasks.map((task) => <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />) : <p className="px-1 py-5 text-center text-xs text-slate-500 dark:text-zinc-400">Belum ada task</p>}</div></section>;
}

function TaskCard({ task, onClick }: { task: BoardTask; onClick: () => void }) {
  const done = task.status === "DONE";
  return <button type="button" onClick={onClick} className="w-full rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition-all hover:border-indigo-400/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900"><div className="flex flex-wrap gap-1.5">{task.labels.map((label) => <span key={label.id} className="rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${label.color}1a`, color: label.color }}>#{label.name}</span>)}{done && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />}</div><h3 className={`mt-3 text-sm font-bold text-slate-800 dark:text-zinc-100 ${done ? "line-through decoration-emerald-500/70" : ""}`}>{task.title}</h3>{task.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-zinc-400">{task.description}</p>}<footer className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400"><span className={task.dueDate && new Date(task.dueDate) < new Date() && !done ? "font-semibold text-red-600" : ""}>{done ? "Selesai" : task.dueDate ? format(new Date(task.dueDate), "d MMM") : "Tanpa tenggat"}</span><span className="ml-auto">💬 {task.commentCount}</span>{task.assignee && <UserAvatar name={task.assignee.name} image={task.assignee.avatarUrl} size="sm" className="h-5 w-5 text-[9px]" />}</footer></button>;
}

function TaskDetail({ task, onOpenChange }: { task: BoardTask | null; onOpenChange: (open: boolean) => void }) {
  return <Dialog open={Boolean(task)} onOpenChange={onOpenChange}><DialogContent title={task?.title ?? "Detail task"}>{task && <div className="space-y-4"><div className="flex flex-wrap gap-1.5">{task.labels.map((label) => <span key={label.id} className="rounded-md px-2 py-1 text-xs font-bold" style={{ backgroundColor: `${label.color}1a`, color: label.color }}>#{label.name}</span>)}</div><p className="text-sm leading-6 text-slate-600 dark:text-zinc-300">{task.description || "Belum ada deskripsi."}</p><div className="grid grid-cols-2 gap-3 text-sm"><p><span className="block text-xs text-slate-500">Status</span>{task.status.replace("_", " ")}</p><p><span className="block text-xs text-slate-500">Tenggat</span>{task.dueDate ? format(new Date(task.dueDate), "d MMM yyyy") : "Belum diatur"}</p></div></div>}</DialogContent></Dialog>;
}
