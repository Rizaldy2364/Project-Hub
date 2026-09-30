"use client";

import Link from "next/link";
import { useMemo, useState, useTransition, useEffect } from "react";
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
  Loader2,
  Trash2,
  MoreHorizontal,
  Mail,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { CreateTaskModal } from "@/components/task/create-task-modal";
import { updateTaskAction, deleteTaskAction } from "@/actions/task.actions";
import { removeProjectMemberAction } from "@/actions/project.actions";

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
    members: { id: string; name: string; email: string; avatarUrl: string | null; role: "ADMIN" | "MEMBER" }[];
    tasks: BoardTask[];
  };
}

const columns = [
  { key: "TODO", label: "To Do", dot: "bg-slate-400" },
  { key: "IN_PROGRESS", label: "In Progress", dot: "bg-blue-500" },
  { key: "DONE", label: "Done", dot: "bg-emerald-500" },
] as const;

export function KanbanBoardTab({ project }: KanbanBoardTabProps) {
  const [activeTab, setActiveTab] = useState<"KANBAN" | "MEMBERS" | "CHAT">("KANBAN");
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
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300"
        >
          ← Kembali ke proyek
        </Link>

        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold text-slate-900 dark:text-slate-100">
              {project.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-600 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                KODE GABUNG: {project.joinCode}
                <Copy className="h-3.5 w-3.5" />
                {copied && " Tersalin"}
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                {project.role === "ADMIN" ? "Admin" : "Member"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
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
              <button className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:w-auto dark:focus-visible:ring-offset-slate-900">
                <Plus className="h-4 w-4" />
                Buat task
              </button>
            </CreateTaskModal>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-6">
          <button 
            onClick={() => setActiveTab("KANBAN")}
            className={`flex items-center gap-2 pb-3 border-b-2 font-semibold text-sm transition-colors ${activeTab === "KANBAN" ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
             <span className={`w-5 h-5 flex items-center justify-center rounded ${activeTab === "KANBAN" ? 'bg-blue-50 dark:bg-blue-500/10' : ''}`}>
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={activeTab === "KANBAN" ? "text-blue-600 dark:text-blue-400" : ""}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 7v7"/><path d="M12 7v4"/><path d="M16 7v9"/></svg>
             </span>
             Kanban Board
             <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${activeTab === "KANBAN" ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>{project.tasks.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab("MEMBERS")}
            className={`flex items-center gap-2 pb-3 border-b-2 font-semibold text-sm transition-colors ${activeTab === "MEMBERS" ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
             <span className={`w-5 h-5 flex items-center justify-center rounded ${activeTab === "MEMBERS" ? 'bg-blue-50 dark:bg-blue-500/10' : ''}`}>
               <Users className={`w-4 h-4 ${activeTab === "MEMBERS" ? 'text-blue-600 dark:text-blue-400' : ''}`} /> 
             </span>
             Team Members
             <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${activeTab === "MEMBERS" ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>{project.members.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab("CHAT")}
            className={`flex items-center gap-2 pb-3 border-b-2 font-semibold text-sm transition-colors ${activeTab === "CHAT" ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
             <span className={`w-5 h-5 flex items-center justify-center rounded ${activeTab === "CHAT" ? 'bg-blue-50 dark:bg-blue-500/10' : ''}`}>
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={activeTab === "CHAT" ? "text-blue-600 dark:text-blue-400" : ""}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
             </span>
             Project Chat
             <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${activeTab === "CHAT" ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>3</span>
          </button>
        </div>
      </section>

      {activeTab === "KANBAN" && (
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
            {visibleTasks.length ? visibleTasks.map((task) => (
              <TaskRow key={task.id} task={task} onClick={() => setSelectedTask(task)} />
            )) : (
              <p className="py-8 text-center text-sm text-slate-500">Belum ada task</p>
            )}
          </div>
        </div>
      
          </section>
        </>
      )}

      {activeTab === "MEMBERS" && (
        <TeamMembersView project={project} isAdmin={project.role === "ADMIN"} />
      )}

      <TaskDetail
        task={selectedTask}
        isAdmin={project.role === "ADMIN"}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />
    </div>
  );
}

function FilterSelect({ value, onChange, icon: Icon, label, options }: { value: string; onChange: (value: string) => void; icon: typeof Tag; label: string; options: { value: string; label: string }[] }) {
  return <label className="relative shrink-0"><Icon className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" /><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs font-semibold text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><option value="" disabled>{label}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><span className="sr-only">{label}</span></label>;
}

function TaskRow({ task, onClick }: { task: BoardTask; onClick: () => void }) {
  const [isPending, startTransition] = useTransition();
  const done = task.status === "DONE";
  const inProgress = task.status === "IN_PROGRESS";
  
  const toggleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPending) return;
    startTransition(async () => {
      const data = new FormData();
      data.set("status", done ? "TODO" : "DONE");
      await updateTaskAction(task.id, data);
    });
  };

  return (
    <div className="group flex flex-col md:flex-row md:items-center gap-3 md:gap-4 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors border-b border-transparent md:border-slate-100 dark:md:border-slate-800/50 last:border-transparent cursor-pointer" onClick={onClick}>
      <button 
        type="button"
        onClick={toggleDone}
        disabled={isPending}
        className="shrink-0 flex items-center justify-center w-5 h-5 rounded border border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white transition-all disabled:opacity-50"
        data-state={done ? "checked" : "unchecked"}
      >
        <CheckCircle2 className="w-3.5 h-3.5 opacity-0 data-[state=checked]:opacity-100" />
      </button>
      
      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-semibold truncate ${done ? "text-slate-400 line-through" : "text-slate-900 dark:text-slate-100"}`}>
          {task.title}
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:gap-4 shrink-0">
        {task.labels.length > 0 && (
          <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {task.labels[0].name}
          </span>
        )}
        


        <span className={`w-24 text-center px-2.5 py-1.5 text-[10px] font-bold rounded-md tracking-wide ${done ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : inProgress ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
          {done ? 'DONE' : inProgress ? 'IN PROGRESS' : 'TO DO'}
        </span>

        <div className="flex items-center gap-2 w-36">
          {task.assignee ? (
            <>
              <UserAvatar name={task.assignee.name} image={task.assignee.avatarUrl} size="sm" className="w-6 h-6" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{task.assignee.name}</span>
            </>
          ) : (
            <span className="text-xs text-slate-500">Unassigned</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 w-20 justify-end shrink-0">
          <CalendarDays className="w-3.5 h-3.5 opacity-70" />
          <span>{task.dueDate ? format(new Date(task.dueDate), "dd MMM") : "30 Sep"}</span>
        </div>

        <button 
          type="button"
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
        >
          Detail
        </button>
      </div>
    </div>
  );
}

function TaskDetail({ task, isAdmin, onOpenChange }: { task: BoardTask | null; isAdmin: boolean; onOpenChange: (open: boolean) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [editTitle, setEditTitle] = useState(task?.title ?? "");
  const [editDesc, setEditDesc] = useState(task?.description ?? "");

  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDesc(task.description ?? "");
      setIsEditing(false);
      setIsDeleting(false);
    }
  }, [task]);

  const handleSave = () => {
    if (!task) return;
    startTransition(async () => {
      const data = new FormData();
      data.set("title", editTitle);
      data.set("description", editDesc);
      await updateTaskAction(task.id, data);
      setIsEditing(false);
    });
  };

  const handleDelete = () => {
    if (!task) return;
    startTransition(async () => {
      await deleteTaskAction(task.id);
      onOpenChange(false);
    });
  };

  if (!task) return null;

  return (
    <Dialog open={Boolean(task)} onOpenChange={(val) => {
      if (!val) onOpenChange(false);
    }}>
      <DialogContent title={isEditing ? "Edit Task" : "Detail task"}>
        {isDeleting ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
               <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Yakin ingin menghapus task?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Task yang telah dihapus tidak dapat dikembalikan.
            </p>
            <div className="flex justify-center gap-3 pt-6">
              <button
                type="button"
                onClick={() => setIsDeleting(false)}
                disabled={isPending}
                className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-semibold text-white transition-colors flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Hapus
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Title</label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full h-28 resize-none px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {task.labels.map((label) => (
                    <span key={label.id} className="rounded-md px-2.5 py-1 text-[11px] font-bold tracking-wide" style={{ backgroundColor: `${label.color}1a`, color: label.color }}>
                      #{label.name}
                    </span>
                  ))}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{task.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {task.description || "Belum ada deskripsi."}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-y-5 gap-x-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="block mb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-200/50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="block mb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tenggat Waktu</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {task.dueDate ? format(new Date(task.dueDate), "d MMM yyyy") : "Belum diatur"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="block mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assignee</span>
                    <div className="flex items-center gap-3">
                      {task.assignee ? (
                        <>
                          <UserAvatar name={task.assignee.name} image={task.assignee.avatarUrl} size="sm" className="w-8 h-8" />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{task.assignee.name}</span>
                        </>
                      ) : (
                        <span className="text-sm font-medium text-slate-400 italic">Unassigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            {isAdmin && (
              <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-slate-100 dark:border-slate-800">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      disabled={isPending}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isPending}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-colors flex items-center gap-2"
                    >
                      {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsDeleting(true)}
                      className="px-5 py-2.5 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TeamMembersView({ project, isAdmin }: { project: KanbanBoardTabProps["project"], isAdmin: boolean }) {
  const [roleFilter, setRoleFilter] = useState("all");
  const [kickMember, setKickMember] = useState<KanbanBoardTabProps["project"]["members"][0] | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleKick = () => {
    if (!kickMember) return;
    startTransition(async () => {
      await removeProjectMemberAction(project.id, kickMember.id);
      setKickMember(null);
    });
  };
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<KanbanBoardTabProps["project"]["members"][0] | null>(null);

  const filteredMembers = project.members.filter(member => {
    if (search && !member.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== "all" && member.role !== roleFilter) return false;
    return true;
  });

  return (
    <div className="mt-6">
      <div className="rounded-2xl bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-200 shadow-sm dark:shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-semibold text-blue-400 mb-1">{project.name}</p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Team member</h2>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
              <Users className="h-4 w-4" />
              Undang anggota
            </button>
          </div>

          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari anggota..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-[#151f32] border border-slate-200 dark:border-slate-800 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all"
              />
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-10 rounded-xl bg-slate-50 dark:bg-[#151f32] border border-slate-200 dark:border-slate-800 px-4 text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500">
              <option value="all">Semua role</option>
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="mt-6 border-t border-slate-200 dark:border-slate-800/60">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/60 text-slate-500 dark:text-slate-400">
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">ANGGOTA</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">ROLE</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">TASK AKTIF</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">STATUS</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filteredMembers.map((member) => {
                const activeTasks = project.tasks.filter(t => t.assignee?.id === member.id && t.status !== "DONE").length;
                return (
                  <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => setSelectedMember(member)}
                      >
                        <UserAvatar name={member.name} image={member.avatarUrl} size="md" className="ring-2 ring-transparent group-hover:ring-blue-500 transition-all" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{member.name}</p>
                          <p className="text-xs text-slate-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${member.role === "ADMIN" ? "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300"}`}>
                        {member.role === "ADMIN" ? "Admin" : "Member"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                      {activeTasks} task
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium text-xs">Aktif</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isAdmin ? (
                        member.role !== "ADMIN" ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setKickMember(member); }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : null
                      ) : (
                        <button className="text-slate-400 hover:text-slate-200 transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      
      {/* Kick Member Modal */}
      <Dialog open={Boolean(kickMember)} onOpenChange={(open) => !open && setKickMember(null)}>
        <DialogContent title="Tendang Member">
          {kickMember && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                 <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Yakin ingin menghapus/menendang {kickMember.name}?</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                Member ini akan dikeluarkan dari proyek dan tidak bisa lagi mengakses task atau informasi di dalamnya.
              </p>
              <div className="flex justify-center gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setKickMember(null)}
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleKick}
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-semibold text-white transition-colors flex items-center gap-2"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Hapus/Tendang
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Profile Modal */}
      <Dialog open={Boolean(selectedMember)} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent title="Profil User">
          {selectedMember && (
            <div className="text-center pt-4 pb-2">
              <UserAvatar name={selectedMember.name} image={selectedMember.avatarUrl} size="md" className="w-24 h-24 mx-auto mb-4 text-3xl" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedMember.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">{selectedMember.email}</p>
              
              <div className="flex items-center justify-center gap-4 border-y border-slate-100 dark:border-slate-800 py-4 mb-6">
                <div className="text-center px-4">
                   <p className="text-2xl font-bold text-slate-900 dark:text-white">{project.tasks.filter(t => t.assignee?.id === selectedMember.id && t.status !== "DONE").length}</p>
                   <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Task Aktif</p>
                </div>
                <div className="w-px h-10 bg-slate-200 dark:bg-slate-700"></div>
                <div className="text-center px-4">
                   <p className="text-2xl font-bold text-slate-900 dark:text-white">{project.tasks.filter(t => t.assignee?.id === selectedMember.id && t.status === "DONE").length}</p>
                   <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Diselesaikan</p>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
                  <Mail className="w-4 h-4" /> Kirim Email
                </button>
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
