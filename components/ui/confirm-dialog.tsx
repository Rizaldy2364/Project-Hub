"use client";

import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Server action yang dijalankan saat tombol konfirmasi ditekan (dikirim lewat <form action>). */
  action: (formData: FormData) => void | Promise<void>;
  /** Kelas untuk tombol konfirmasi (mis. tombol merah untuk aksi destruktif). */
  confirmClassName?: string;
  children: ReactNode;
}

/** Dialog konfirmasi generik: trigger dari children, tombol Cancel + tombol aksi. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  action,
  confirmClassName,
  children,
}: ConfirmDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent title={title}>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{message}</p>

        <form action={action} className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            className={
              confirmClassName ??
              "rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            }
          >
            {confirmLabel}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
