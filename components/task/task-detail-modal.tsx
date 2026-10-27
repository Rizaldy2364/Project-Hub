"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { FolderKanban, Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TaskComments } from "@/components/task/task-comments";
import { deleteTaskAction, updateTaskAction } from "@/actions/task.actions";
import { markTaskCommentsReadAction } from "@/actions/notification.actions";
import type { BoardTask } from "@/types";

interface TaskDetailModalProps {
  task: BoardTask;
  /** Izin aksi dihitung dari role user di project (matriks 8.2). */
  canEdit: boolean;
  canDelete: boolean;
  canComment: boolean;
  onOpenChange: (open: boolean) => void;
  /** Penulis komentar saat ini (untuk optimistic UI). */
  currentUser?: { id: string; name: string; avatarUrl: string | null };
  /** Dipanggil setelah task berhasil diupdate (dengan taskId + FormData). */
  onTaskUpdated?: (taskId: string, formData: FormData) => void;
  /** Dipanggil setelah task berhasil dihapus (dengan taskId). */
  onTaskDeleted?: (taskId: string) => void;
}

/** Modal detail task: lihat, edit (admin/manager), dan hapus task (admin). */
export function TaskDetailModal({
  task,
  canEdit,
  canDelete,
  onOpenChange,
  currentUser,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const saveGuard = useRef(false);

  // Task dari kalender membawa info project (BoardTask tidak memilikinya).
  const calendarTask = task as BoardTask & {
    projectId?: string;
    projectName?: string;
  };

  // AUTO-READ — membuka detail task menandai notifikasi TASK_COMMENT milik
  // user untuk task ini sebagai dibaca (fire-and-forget; diam bila gagal).
  useEffect(() => {
    void markTaskCommentsReadAction(task.id);
  }, [task.id]);

  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description ?? "");
  const [editPriority, setEditPriority] = useState(task.priority);

  const handleSave = () => {
    if (saveGuard.current) return;
    saveGuard.current = true;
    startTransition(async () => {
      try {
        const data = new FormData();
        data.set("title", editTitle);
        data.set("description", editDesc);
        data.set("priority", editPriority);
        if (onTaskUpdated) {
          onTaskUpdated(task.id, data);
        } else {
          await updateTaskAction(task.id, data);
        }
        setIsEditing(false);
      } catch {
        // Gagal disimpan — nilai formulir dipertahankan dan tombol dapat
        // ditekan kembali (saveGuard di-reset di finally di bawah).
      } finally {
        saveGuard.current = false;
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      if (onTaskDeleted) {
        onTaskDeleted(task.id);
      } else {
        await deleteTaskAction(task.id);
      }
      onOpenChange(false);
    });
  };

  return (
    <Dialog open onOpenChange={(val: boolean) => { if (!val) onOpenChange(false); }}>
      <DialogContent
        title={isEditing ? "Edit Task" : "Detail task"}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-6"
      >
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
          <div className="space-y-4 sm:space-y-6">
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
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Prioritas</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as typeof editPriority)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="LOW">Rendah</option>
                    <option value="MEDIUM">Sedang</option>
                    <option value="HIGH">Tinggi</option>
                  </select>
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
                  <h3 className="break-words text-xl font-bold text-slate-900 dark:text-slate-100">{task.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {task.description || "Belum ada deskripsi."}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-x-4 gap-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2 sm:gap-y-5 sm:p-5 dark:border-slate-800 dark:bg-slate-800/40">
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
                  <div>
                    <span className="block mb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Prioritas</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {task.priority === "HIGH" ? "Tinggi" : task.priority === "LOW" ? "Rendah" : "Sedang"}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
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

                {/* Komentar task — daftar + form kirim dengan toast. */}
                {currentUser && (
                  <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                    <TaskComments taskId={task.id} currentUser={currentUser} />
                  </div>
                )}

                {/* Info project — tampil saat task dibuka dari kalender. */}
                {calendarTask.projectId && calendarTask.projectName && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/60">
                    <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                      <FolderKanban
                        className="h-3.5 w-3.5 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />
                      <span className="truncate">{calendarTask.projectName}</span>
                    </span>
                    <Link
                      href={`/projects/${calendarTask.projectId}`}
                      className="shrink-0 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300"
                    >
                      Buka di project
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Actions */}
            {(canEdit || canDelete) && (
              <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
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
                      {isPending ? (<span className="flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</span>) : "Simpan"}
                    </button>
                  </>
                ) : (
                  <>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setIsDeleting(true)}
                        className="px-5 py-2.5 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Hapus
                      </button>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                      >
                        Edit
                      </button>
                    )}
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
