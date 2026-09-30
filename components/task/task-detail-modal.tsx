"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { deleteTaskAction, updateTaskAction } from "@/actions/task.actions";
import type { BoardTask } from "@/types";

interface TaskDetailModalProps {
  task: BoardTask;
  isAdmin: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Modal detail task: lihat, edit (admin), dan hapus task (soft delete). */
export function TaskDetailModal({ task, isAdmin, onOpenChange }: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description ?? "");

  const handleSave = () => {
    startTransition(async () => {
      const data = new FormData();
      data.set("title", editTitle);
      data.set("description", editDesc);
      await updateTaskAction(task.id, data);
      setIsEditing(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteTaskAction(task.id);
      onOpenChange(false);
    });
  };

  return (
    <Dialog open onOpenChange={(val) => { if (!val) onOpenChange(false); }}>
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
