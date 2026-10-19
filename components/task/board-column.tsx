"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { BoardCard } from "@/components/task/board-card";
import { cn } from "@/lib/utils";
import type { BoardTask, BoardTaskStatus } from "@/types";

export interface BoardColumnProps {
  status: BoardTaskStatus;
  title: string;
  tasks: BoardTask[];
  onSelectTask: (task: BoardTask) => void;
  canMoveTask: (task: BoardTask) => boolean;
  canCreateTask: boolean;
  onAddTask: (status: BoardTaskStatus) => void;
  /** Tandai selesai sekali klik — hanya dirender di kolom Belum/Dikerjakan. */
  onMarkDone: (task: BoardTask) => void;
}

/** Satu kolom status: header jumlah, daftar sortable, footer tambah task. */
export function BoardColumn({
  status,
  title,
  tasks,
  onSelectTask,
  canMoveTask,
  canCreateTask,
  onAddTask,
  onMarkDone,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status}` });
  return (
    <section
      aria-label={`Kolom ${title}`}
      className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60 max-md:w-[82vw] max-md:max-w-[340px] max-md:shrink-0 max-md:snap-start"
    >
      <header className="flex items-center justify-between px-1 pb-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        <span
          aria-label={`${tasks.length} task`}
          className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        >
          {tasks.length}
        </span>
      </header>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-col gap-2 overflow-y-auto rounded-xl p-1 md:max-h-[calc(100vh-22rem)]",
          isOver && "bg-blue-500/10 outline-2 outline-dashed outline-blue-500/50"
        )}
      >
        {tasks.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">Belum ada task</p>
        ) : (
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <BoardCard
                key={task.id}
                task={task}
                onSelectTask={onSelectTask}
                canDrag={canMoveTask(task)}
                {...(status !== "DONE" ? { onMarkDone } : {})}
              />
            ))}
          </SortableContext>
        )}
      </div>
      {/* Kolom "Selesai" tanpa tombol tambah — pindah balik lewat drag. */}
      {canCreateTask && status !== "DONE" && (
        <button
          type="button"
          onClick={() => onAddTask(status)}
          className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-blue-500 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Tambah task
        </button>
      )}
    </section>
  );
}
