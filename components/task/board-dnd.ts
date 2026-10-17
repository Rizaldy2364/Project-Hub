import { arrayMove } from "@dnd-kit/sortable";
import type { BoardTask, BoardTaskStatus } from "@/types";

export interface DropPlan {
  /** Daftar task penuh sesudah drop (optimistic). */
  next: BoardTask[];
  /** Status tujuan. */
  targetStatus: BoardTaskStatus;
  /** Posisi sisip di kolom tujuan. */
  pos: number;
  /** Task sesudah posisi sisip (null = paling akhir). */
  afterTaskId: string | null;
}

/**
 * Tentukan status tujuan dari id droppable (kolom "col:STATUS" atau id task).
 */
export function statusOfDroppable(droppableId: string, tasks: BoardTask[]): BoardTaskStatus | null {
  if (droppableId.startsWith("col:")) {
    const status = droppableId.slice(4);
    return status === "TODO" || status === "IN_PROGRESS" || status === "DONE" ? status : null;
  }
  return tasks.find((t) => t.id === droppableId)?.status ?? null;
}

/**
 * Hitung daftar optimistic + posisi sisip untuk satu drop.
 * Murni (tanpa side effect) agar mudah diuji dan dipakai ulang.
 */
export function planTaskDrop(
  snapshot: BoardTask[],
  dragId: string,
  overId: string | null
): DropPlan | null {
  const activeTask = snapshot.find((t) => t.id === dragId);
  if (!activeTask || !overId) return null;
  const targetStatus = statusOfDroppable(overId, snapshot);
  if (!targetStatus) return null;

  const destList = snapshot.filter((t) => t.status === targetStatus);
  const oldIndex = destList.findIndex((t) => t.id === dragId);
  const overIndex = destList.findIndex((t) => t.id === overId);
  // Drop di kolom kosong (over = container) → taruh paling akhir.
  const newIndex = overIndex >= 0 ? overIndex : destList.length - (oldIndex >= 0 ? 1 : 0);

  let next: BoardTask[];
  if (targetStatus === activeTask.status) {
    const reordered = arrayMove(destList, oldIndex < 0 ? newIndex : oldIndex, Math.max(0, newIndex));
    const others = snapshot.filter((t) => t.status !== targetStatus);
    next = [...others, ...reordered.map((t) => (t.id === dragId ? { ...activeTask } : t))];
  } else {
    const moved: BoardTask = { ...activeTask, status: targetStatus };
    const without = destList.filter((t) => t.id !== dragId);
    without.splice(Math.max(0, Math.min(newIndex, without.length)), 0, moved);
    const others = snapshot.filter((t) => t.status !== activeTask.status && t.status !== targetStatus);
    const sourceRest = snapshot.filter((t) => t.status === activeTask.status && t.id !== dragId);
    next = [...others, ...sourceRest, ...without];
  }

  const destAfter = next.filter((t) => t.status === targetStatus);
  const pos = destAfter.findIndex((t) => t.id === dragId);
  const afterTaskId = pos >= 0 && pos + 1 < destAfter.length ? destAfter[pos + 1].id : null;
  return { next, targetStatus, pos: pos < 0 ? 0 : pos, afterTaskId };
}

/**
 * Gabungkan hasil drop yang dihitung di atas daftar TERFILTER kembali ke daftar
 * PENUH — task yang sedang tersembunyi oleh filter tidak boleh hilang/berpindah.
 * Murni (tanpa side effect).
 */
export function mergeTasks(full: BoardTask[], planned: BoardTask[]): BoardTask[] {
  const plannedById = new Map(planned.map((t) => [t.id, t]));
  return full.map((t) => plannedById.get(t.id) ?? t);
}

