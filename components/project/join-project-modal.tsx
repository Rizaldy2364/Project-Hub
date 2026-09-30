"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { joinProjectAction } from "@/actions/project.actions";

interface JoinProjectModalProps {
  className?: string;
  children?: React.ReactNode;
}

export function JoinProjectModal({ className, children }: JoinProjectModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await joinProjectAction(formData);
    setIsSubmitting(false);

    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Kode tidak valid");
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
            "flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          }
        >
          {children ?? (
            <>
              <LogIn className="w-4 h-4" />
              Gabung Project
            </>
          )}
        </button>
      </DialogTrigger>
      <DialogContent title="Gabung ke Project">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Kode Join
            </label>
            <input
              name="joinCode"
              type="text"
              placeholder="X7K9M2QP"
              maxLength={8}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none uppercase tracking-widest text-center font-mono"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Minta kode 8-karakter ini dari admin project
            </p>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white rounded-xl py-2.5 font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Bergabung..." : "Gabung Project"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}