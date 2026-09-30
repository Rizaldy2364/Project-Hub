"use client";

import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Copy, Plus, ShieldCheck, Users } from "lucide-react";
import { CreateTaskModal } from "@/components/task/create-task-modal";
import { BoardView } from "@/components/board/board-view";
import { MemberList } from "@/components/project/member-list";
import { TaskDetailModal } from "@/components/task/task-detail-modal";
import type { BoardProject, BoardTask } from "@/types";

interface KanbanBoardTabProps {
  project: BoardProject;
}

/** Shell halaman detail project: header project + tab Kanban Board / Team Members. */
export function KanbanBoardTab({ project }: KanbanBoardTabProps) {
  const [activeTab, setActiveTab] = useState<"KANBAN" | "MEMBERS">("KANBAN");
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);
  const [copied, setCopied] = useState(false);

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

        <div role="tablist" aria-label="Bagian project" className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-6">
          <button 
            type="button"
            role="tab"
            id="tab-kanban"
            aria-selected={activeTab === "KANBAN"}
            aria-controls="panel-kanban"
            onClick={() => setActiveTab("KANBAN")}
            className={`flex items-center gap-2 pb-3 border-b-2 font-semibold text-sm transition-colors ${activeTab === "KANBAN" ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
             <span className={`w-5 h-5 flex items-center justify-center rounded ${activeTab === "KANBAN" ? 'bg-blue-50 dark:bg-blue-500/10' : ''}`}>
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={activeTab === "KANBAN" ? "text-blue-600 dark:text-blue-400" : ""}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 7v7"/><path d="M12 7v4"/><path d="M16 7v9"/></svg>
             </span>
             Kanban Board
             <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${activeTab === "KANBAN" ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>{project.tasks.length}</span>
          </button>
          <button 
            type="button"
            role="tab"
            id="tab-members"
            aria-selected={activeTab === "MEMBERS"}
            aria-controls="panel-members"
            onClick={() => setActiveTab("MEMBERS")}
            className={`flex items-center gap-2 pb-3 border-b-2 font-semibold text-sm transition-colors ${activeTab === "MEMBERS" ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
             <span className={`w-5 h-5 flex items-center justify-center rounded ${activeTab === "MEMBERS" ? 'bg-blue-50 dark:bg-blue-500/10' : ''}`}>
               <Users className={`w-4 h-4 ${activeTab === "MEMBERS" ? 'text-blue-600 dark:text-blue-400' : ''}`} /> 
             </span>
             Team Members
             <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${activeTab === "MEMBERS" ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>{project.members.length}</span>
          </button>
        </div>
      </section>

      {activeTab === "KANBAN" ? (
        <div role="tabpanel" id="panel-kanban" aria-labelledby="tab-kanban" className="space-y-5">
          <BoardView project={project} onSelectTask={setSelectedTask} />
        </div>
      ) : (
        <div role="tabpanel" id="panel-members" aria-labelledby="tab-members">
          <MemberList project={project} isAdmin={project.role === "ADMIN"} />
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal
          key={selectedTask.id}
          task={selectedTask}
          isAdmin={project.role === "ADMIN"}
          onOpenChange={(open) => !open && setSelectedTask(null)}
        />
      )}
    </div>
  );
}
