"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, User, Tag, Plus } from "lucide-react";
import { TaskBoard } from "@/components/task/task-board";
import { BoardView, FilterSelect } from "@/components/board/board-view";
import { TaskDetailModal } from "@/components/task/task-detail-modal";
import { CreateTaskModal } from "@/components/task/create-task-modal";
import { TaskViewToggle, TASK_VIEW_STORAGE_KEY, type TaskViewValue } from "@/components/task/task-view-toggle";
import { cn } from "@/lib/utils";
import type { BoardProject, BoardTask, BoardTaskStatus, ProjectRole } from "@/types";

interface TaskBoardShellProps {
  project: BoardProject;
  currentUser: { id: string; name: string; avatarUrl: string | null };
  canEdit: boolean;
  canDelete: boolean;
  canComment: boolean;
  canCreateTask: boolean;
  myRole: ProjectRole;
}

/**
 * Shell tab Task: Board | Daftar toggle + satu data fetch yang dibagikan kedua
 * view. URL (?view=board|list) adalah sumber kebenaran; localStorage
 * (projecthub:task-view) diaplikasi pasca mount agar tidak bentrok hidrasi.
 * Semua filter berlaku untuk kedua view; badge hitung tab (di layout) tidak
 * terpengaruh filter.
 */
export function TaskBoardShell({
  project,
  currentUser,
  canEdit,
  canDelete,
  canComment,
  canCreateTask,
  myRole,
}: TaskBoardShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // --- View persistence: URL -> localStorage -> "board" (after mount) ---
  const [view, setView] = useState<TaskViewValue>("board");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const urlView = searchParams.get("view");
    const valid: TaskViewValue | null =
      urlView === "board" || urlView === "list" ? urlView : null;
    const saved =
      valid ??
      ((localStorage.getItem(TASK_VIEW_STORAGE_KEY) as TaskViewValue | null) ??
        "board");
    setView(saved);
    localStorage.setItem(TASK_VIEW_STORAGE_KEY, saved);
  }, [searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (searchParams.get("view") !== view) {
      router.replace(pathname + "?view=" + view, { scroll: false });
    }
  }, [view, router, searchParams, pathname]);

  // --- Filters (shared by both views) ---
  const [search, setSearch] = useState("");
  const [memberId, setMemberId] = useState("");
  const [labelId, setLabelId] = useState("");

  // --- Optimistic task list (single source of truth for both views) ---
  const [tasks, setTasks] = useState<BoardTask[]>(project.tasks);

  const canMoveTask = useCallback(
    (task: BoardTask) => {
      // Matriks 8.2: ADMIN/MANAGER boleh semua; MEMBER hanya milik sendiri;
      // VIEWER tidak apa-apa.
      if (myRole === "VIEWER") return false;
      if (myRole === "ADMIN" || myRole === "MANAGER") return true;
      return myRole === "MEMBER" && task.assignee?.id === currentUser.id;
    },
    [myRole, currentUser.id]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (memberId && t.assignee?.id !== memberId) return false;
      if (labelId && !t.labels.some((l) => l.id === labelId)) return false;
      return true;
    });
  }, [tasks, search, memberId, labelId]);

  // --- Modals ---
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<BoardTaskStatus>("TODO");

  const handleAddTask = useCallback(
    (status: BoardTaskStatus) => {
      setCreateStatus(status);
      setCreateOpen(true);
    },
    []
  );

  return (
    <div className="space-y-5">
      {/* Toolbar: toggle + search + member + label + buat task */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TaskViewToggle view={view} onChange={setView} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative shrink-0">
            <Search
              className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400"
              aria-hidden
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari task…"
              className={cn(
                "w-48 appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs font-semibold text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30",
                "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              )}
            />
          </label>
          <FilterSelect
            value={memberId}
            onChange={setMemberId}
            icon={User}
            label="Semua anggota"
            options={[
              { value: "", label: "Semua anggota" },
              ...project.members.map((m) => ({
                value: m.id,
                label: m.name,
              })),
            ]}
          />
          <FilterSelect
            value={labelId}
            onChange={setLabelId}
            icon={Tag}
            label="Semua label"
            options={[
              { value: "", label: "Semua label" },
              ...project.labels.map((l) => ({ value: l.id, label: l.name })),
            ]}
          />
        </div>
        <div className="flex items-center gap-2">
          {canCreateTask && (
            <CreateTaskModal
              projectId={project.id}
              lists={project.lists}
              members={project.members}
              labels={project.labels}
              initialStatus={createStatus}
              open={createOpen}
              onOpenChange={setCreateOpen}
            >
              <button
                type="button"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden /> + Buat task
              </button>
            </CreateTaskModal>
          )}
        </div>
      </div>

      {/* Board view: 3 kolom status dengan DnD */}
      {view === "board" ? (
        <TaskBoard
          projectId={project.id}
          tasks={filteredTasks}
          onTasksChange={setTasks}
          onSelectTask={setSelectedTask}
          canMoveTask={canMoveTask}
          canCreateTask={canCreateTask}
          onAddTask={handleAddTask}
        />
      ) : (
        <BoardView tasks={filteredTasks} onSelectTask={setSelectedTask} />
      )}

      {selectedTask && (
        <TaskDetailModal
          key={selectedTask.id}
          task={selectedTask}
          canEdit={canEdit}
          canDelete={canDelete}
          canComment={canComment}
          currentUser={currentUser}
          onOpenChange={(open) => !open && setSelectedTask(null)}
        />
      )}
    </div>
  );
}

export type { TaskViewValue };
