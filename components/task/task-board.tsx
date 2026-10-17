"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent, DragStartEvent, DropAnimation } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { BoardCard } from "@/components/task/board-card";
import { BoardColumn } from "@/components/task/board-column";
import { planTaskDrop } from "@/components/task/board-dnd";
import { Toast, useToast } from "@/components/ui/toast";
import { moveTaskAction } from "@/actions/task.actions";
import type { BoardTask, BoardTaskStatus } from "@/types";

const COLUMNS: { status: BoardTaskStatus; title: string }[] = [
  { status: "TODO", title: "Belum" },
  { status: "IN_PROGRESS", title: "Dikerjakan" },
  { status: "DONE", title: "Selesai" },
];

interface TaskBoardProps {
  projectId: string;
  tasks: BoardTask[];
  /** Optimistic state milik shell (satu sumber data). */
  onTasksChange: (tasks: BoardTask[]) => void;
  onSelectTask: (task: BoardTask) => void;
  /** Kartu boleh di-drag bila true (izin per task, matriks 8.2). */
  canMoveTask: (task: BoardTask) => boolean;
  canCreateTask: boolean;
  onAddTask: (status: BoardTaskStatus) => void;
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.5" } } }),
};

/** Papan 3 kolom status dengan drag-and-drop antar/dalam kolom. */
export function TaskBoard({
  projectId,
  tasks,
  onTasksChange,
  onSelectTask,
  canMoveTask,
  canCreateTask,
  onAddTask,
}: TaskBoardProps) {
  const { toast, show } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const byStatus = useMemo(() => {
    const map: Record<BoardTaskStatus, BoardTask[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
    for (const task of tasks) map[task.status].push(task);
    return map;
  }, [tasks]);

  const overlayTask = activeId ? (tasks.find((t) => t.id === activeId) ?? null) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const plan = planTaskDrop(tasks, String(active.id), String(over.id));
    // Pratinjau lintas kolom saat hover; reorder dalam kolom di-commit saat drop
    // agar kartu tidak melompat-lompat selama drag.
    const activeTask = tasks.find((t) => t.id === String(active.id));
    if (plan && activeTask && plan.targetStatus !== activeTask.status) {
      onTasksChange(plan.next);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const dragId = activeId ?? String(event.active.id);
    setActiveId(null);
    const overId = event.over ? String(event.over.id) : null;
    const snapshot = tasks;
    const plan = planTaskDrop(snapshot, dragId, overId);
    if (!plan) return;
    const activeTask = snapshot.find((t) => t.id === dragId);
    if (!activeTask) return;

    onTasksChange(plan.next);
    const res = await moveTaskAction(activeTask.id, projectId, plan.targetStatus, plan.pos, plan.afterTaskId);
    if ("error" in res) {
      onTasksChange(snapshot); // rollback
      show(typeof res.error === "string" ? res.error : "Kamu tidak punya izin memindahkan task ini", "error");
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div
        aria-label="Papan task"
        className="grid gap-4 md:grid-cols-3 max-md:flex max-md:snap-x max-md:snap-mandatory max-md:overflow-x-auto max-md:pb-2"
      >
        {COLUMNS.map(({ status, title }) => (
          <BoardColumn
            key={status}
            status={status}
            title={title}
            tasks={byStatus[status]}
            onSelectTask={onSelectTask}
            canMoveTask={canMoveTask}
            canCreateTask={canCreateTask}
            onAddTask={onAddTask}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={dropAnimation}>
        {overlayTask ? <BoardCard task={overlayTask} overlay onSelectTask={() => {}} canDrag /> : null}
      </DragOverlay>
      <Toast toast={toast} />
    </DndContext>
  );
}
