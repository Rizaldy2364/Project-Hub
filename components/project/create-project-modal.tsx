"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { createProjectAction } from "@/actions/project.actions";

interface CreateProjectModalProps {
  className?: string;
  children?: React.ReactNode;
}

export function CreateProjectModal({ className, children }: CreateProjectModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await createProjectAction(formData);
    setIsSubmitting(false);

    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Gagal membuat project");
      return;
    }

    setOpen(false);
    router.push(`/projects/${result.projectId}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            className ??
            "flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors"
          }
        >
          {children ?? (
            <>
              <Plus className="w-4 h-4" />
              Buat Project
            </>
          )}
        </button>
      </DialogTrigger>
      <DialogContent title="Buat Project Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Project
            </label>
            <input
              name="name"
              type="text"
              placeholder="Website Redesign"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Deskripsi (opsional)
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Deskripsi singkat project ini..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none resize-none"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white rounded-xl py-2.5 font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Membuat..." : "Buat Project"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}