"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, User, Tag } from "lucide-react";
import { TaskBoard } from "@/components/task/task-board";
import { Pagination } from "@/components/team/team-pagination";
import { BoardView, FilterSelect } from "@/components/board/board-view";
import { TaskDetailModal } from "@/components/task/task-detail-modal";
import { CreateTaskModal } from "@/components/task/create-task-modal";
import { TaskViewToggle, type TaskViewValue } from "@/components/task/task-view-toggle";
import { planTaskDrop } from "@/components/task/board-dnd";
import { Toast, useToast } from "@/components/ui/toast";
import {
  createTaskAction,
  deleteTaskAction,
  moveTaskAction,
  updateTaskAction,
} from "@/actions/task.actions";
import { cn } from "@/lib/utils";
import { canChangeTaskStatus } from "@/lib/permissions";
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

  // --- View state (Board | Daftar) — sistem state murni seperti di dashboard ---
  const [view, setView] = useState<TaskViewValue>("board");

  // --- Filters (shared by both views) ---
  const [search, setSearch] = useState("");
  const [memberId, setMemberId] = useState("");
  const [labelId, setLabelId] = useState("");

  // --- Optimistic task list (single source of truth for both views) ---
  const [tasks, setTasks] = useState<BoardTask[]>(project.tasks);
  const [prevProjectTasks, setPrevProjectTasks] = useState(project.tasks);

  if (project.tasks !== prevProjectTasks) {
    setPrevProjectTasks(project.tasks);
    setTasks(project.tasks);
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (memberId && t.assignee?.id !== memberId) return false;
      if (labelId && !t.labels.some((l) => l.id === labelId)) return false;
      return true;
    });
  }, [tasks, search, memberId, labelId]);

  // Daftar: urut terbaru dulu (createdAt desc, id desc sebagai penyeimbang).
  // Salinan terpisah — Board terus menerima filteredTasks dalam urutan asli,
  // jadi urutan task di dalam kolom board tidak berubah.
  const listTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (b.createdAt !== a.createdAt) {
        return b.createdAt < a.createdAt ? -1 : 1;
      }
      return b.id.localeCompare(a.id);
    });
  }, [filteredTasks]);

  // --- STATE PAGINASI (diturunkan dari URL searchParams) ---
  const rawPage = searchParams.get("page");
  const rawPageSize = searchParams.get("pageSize");

  const page = useMemo(() => {
    if (!rawPage) return 1;
    const pageNum = Number.parseInt(rawPage, 10);
    return Number.isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
  }, [rawPage]);

  const pageSize: 10 | 25 | 50 = useMemo(() => {
    if (!rawPageSize) return 10;
    const sizeNum = Number.parseInt(rawPageSize, 10);
    return sizeNum === 10 || sizeNum === 25 || sizeNum === 50 ? sizeNum : 10;
  }, [rawPageSize]);

  // --- Hitung total halaman dan mulai slicing ---
  // Total tasks setelah filter (tidak termasuk pagination slicing)
  const totalTasks = filteredTasks.length;

  // Total halaman ( minimal 1 )
  const totalPages = Math.max(1, Math.ceil(totalTasks / pageSize));

  // Halaman yang valid (clamp ke range 1..totalPages)
  const safePage = Math.min(page, totalPages);

  // Slice tasks untuk view Daftar (newest first order)
  const pageStart = (safePage - 1) * pageSize;
  const pageEnd = safePage * pageSize;
  const paginatedListTasks = useMemo(() => {
    return listTasks.slice(pageStart, pageEnd);
  }, [listTasks, pageStart, pageEnd]);

  // --- Hitung from/to untuk display ---
  const from = totalTasks === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(totalTasks, safePage * pageSize);

  // --- Navigation query helper ---
  const pushQuery = useCallback(
    (next: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v) sp.set(k, v);
        else sp.delete(k);
      }
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // --- Reset page ke 1 saat filter berubah ---
  const prevFilterRef = useRef({ search, memberId, labelId });
  useEffect(() => {
    if (
      search !== prevFilterRef.current.search ||
      memberId !== prevFilterRef.current.memberId ||
      labelId !== prevFilterRef.current.labelId
    ) {
      prevFilterRef.current = { search, memberId, labelId };
      if (searchParams.get("page") && searchParams.get("page") !== "1") {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set("page", "1");
        router.replace(`${pathname}?${newSearchParams.toString()}`, {
          scroll: false,
        });
      }
    }
  }, [search, memberId, labelId, searchParams, pathname, router]);

  // --- canMoveTask ---
  const canMoveTask = useCallback(
    (task: BoardTask) => {
      return canChangeTaskStatus(myRole, task.assignee?.id === currentUser.id);
    },
    [myRole, currentUser.id]
  );

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

  const { toast, show } = useToast();

  // --- Buat task (optimistic insert + rollback on error) ---
  const handleTaskCreate = useCallback(
    async (formData: FormData) => {
      const title = formData.get("title");
      const status = (formData.get("status") as string) || "TODO";
      const priority = (formData.get("priority") as string) || "MEDIUM";
      const description = (formData.get("description") as string) || null;
      const dueDate = (formData.get("dueDate") as string) || null;
      const assigneeId = (formData.get("assigneeId") as string) || null;
      const labelIds = formData.getAll("labelIds").filter(
        (id): id is string => typeof id === "string"
      );

      const tempId = `temp-${Date.now()}`;
      const tempTask: BoardTask = {
        id: tempId,
        createdAt: new Date().toISOString(),
        title: typeof title === "string" ? title : "",
        description,
        status: status as BoardTaskStatus,
        priority: priority as "LOW" | "MEDIUM" | "HIGH",
        dueDate,
        assignee: assigneeId
          ? {
              id: assigneeId,
              name: "",
              avatarUrl: null,
            }
          : null,
        labels: labelIds.map((lid) => {
          const existing = project.labels.find((l) => l.id === lid);
          return existing
            ? { id: lid, name: existing.name, color: existing.color }
            : { id: lid, name: "", color: "#6366F1" };
        }),
        commentCount: 0,
      };

      const snapshot = tasksRef.current;
      setTasks([...snapshot, tempTask]);

      const result = await createTaskAction(formData);
      if ("error" in result) {
        // Rollback
        setTasks(snapshot);
        show(typeof result.error === "string" ? result.error : "Gagal membuat task", "error");
      }
      // On success: keep optimistic task; useEffect resync from project.tasks
      // will replace it with server data on next prop update.
    },
    [project.labels, show]
  );

  // --- Tandai selesai (check bundar di kartu board) + Urungkan ---
  // Satu toast untuk shell (drag error, tandai selesai, urungkan) — hook
  // useToast sudah menjamin hanya satu toast tampil dalam satu waktu.

  // Ref tasks terbaru agar handler toast "Urungkan" (closure-nya lama) selalu
  // menghitung rencana pindah dari state paling baru.
  const tasksRef = useRef<BoardTask[]>([]);
  /* eslint-disable react-hooks/immutability */
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);
  /* eslint-enable react-hooks/immutability */

  const handleUndoMarkDone = useCallback(
    async (taskId: string, prevStatus: BoardTaskStatus) => {
      const snapshot = tasksRef.current;
      // Kembalikan ke kolom sebelumnya (Belum/Dikerjakan) lewat action sentral
      // yang sama — completedAt di-null-kan otomatis oleh resolveCompletedAt.
      const plan = planTaskDrop(snapshot, taskId, `col:${prevStatus}`);
      if (!plan) return;
      setTasks(plan.next);
      const res = await moveTaskAction(taskId, project.id, prevStatus, plan.pos, plan.afterTaskId);
      if ("error" in res) {
        setTasks(snapshot); // rollback
        show(typeof res.error === "string" ? res.error : "Gagal mengurungkan perubahan", "error");
      }
    },
    [project.id, show]
  );

  const handleMarkDone = useCallback(
    async (task: BoardTask) => {
      const prevStatus = task.status;
      const snapshot = tasksRef.current;
      const plan = planTaskDrop(snapshot, task.id, "col:DONE");
      if (!plan) return;
      // Optimistic: langsung pindah ke kolom Selesai (hitung kolom & strip
      // progres ikut berubah dari state bersama ini).
      setTasks(plan.next);
      const res = await moveTaskAction(task.id, project.id, "DONE", plan.pos, plan.afterTaskId);
      if ("error" in res) {
        setTasks(snapshot); // rollback
        show(
          typeof res.error === "string" ? res.error : "Kamu tidak punya izin menandai task ini",
          "error"
        );
        return;
      }
      show("Task ditandai selesai", "success", {
        durationMs: 6000,
        action: {
          label: "Urungkan",
          onClick: () => {
            void handleUndoMarkDone(task.id, prevStatus);
          },
        },
      });
    },
    [project.id, show, handleUndoMarkDone]
  );

  // --- Edit task (optimistic update + rollback on error) ---
  const handleTaskUpdate = useCallback(
    async (taskId: string, formData: FormData) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task) return;

      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const priority = formData.get("priority") as string;

      const prevTask = { ...task };
      const nextTask: BoardTask = {
        ...task,
        title,
        description: description || null,
        priority: (priority as "LOW" | "MEDIUM" | "HIGH") || "MEDIUM",
      };

      setTasks((prev) => prev.map((t) => (t.id === taskId ? nextTask : t)));

      const result = await updateTaskAction(taskId, formData);
      if ("error" in result) {
        // Rollback
        setTasks((prev) => prev.map((t) => (t.id === taskId ? prevTask : t)));
        show(
          typeof result.error === "string" ? result.error : "Gagal mengupdate task",
          "error"
        );
      }
    },
    [show]
  );

  // --- Hapus task (optimistic remove + rollback on error) ---
  const handleTaskDelete = useCallback(
    async (taskId: string) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task) return;

      const snapshot = tasksRef.current;
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      const result = await deleteTaskAction(taskId);
      if ("error" in result) {
        // Rollback
        setTasks(snapshot);
        show(
          typeof result.error === "string" ? result.error : "Gagal menghapus task",
          "error"
        );
      }
    },
    [show]
  );

  return (
    <div className="space-y-5">
      {/* Toolbar satu baris: cari (flex-1) | anggota | label | toggle Board|Daftar.
          Di bawah md: baris 1 cari full width, baris 2 filter + toggle. */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative min-w-[200px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari task…"
            aria-label="Cari task"
            className={cn(
              "h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30",
              "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            )}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2 md:ml-auto">
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
          <TaskViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {/* Modal buat task (controlled) — dipicu kolom board / baris "Tambah
          task" di Daftar; TIDAK ada tombol buat task di toolbar (satu tombol
          "Buat task" global ada di header project). */}
      {canCreateTask && (
        <CreateTaskModal
          key={createStatus}
          projectId={project.id}
          lists={project.lists}
          members={project.members}
          labels={project.labels}
          initialStatus={createStatus}
          open={createOpen}
          onOpenChange={setCreateOpen}
          onTaskCreated={handleTaskCreate}
        />
      )}

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
          onMarkDone={handleMarkDone}
          showToast={show}
        />
      ) : (
        <BoardView
          tasks={view === "list" ? paginatedListTasks : filteredTasks}
          onSelectTask={setSelectedTask}
          canCreateTask={canCreateTask}
          onAddTask={() => handleAddTask("TODO")}
          footer={
            view === "list" ? (
              <Pagination
                label="task"
                total={totalTasks}
                pageSize={pageSize}
                safePage={safePage}
                from={from}
                to={to}
                totalPages={totalPages}
                pushQuery={pushQuery}
              />
            ) : null
          }
        />
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
          onTaskUpdated={handleTaskUpdate}
          onTaskDeleted={handleTaskDelete}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}

export type { TaskViewValue };
