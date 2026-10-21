"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export function DialogContent({
  children,
  title,
  className,
  /** Sembunyikan header default (judul + tutup) — pakai bila merender kustom di dalam children. */
  hideHeader = false,
  /** id elemen judul kustom untuk aria-labelledby pada DialogPrimitive.Content. */
  ariaLabelledby,
}: {
  children: React.ReactNode;
  title?: string;
  /** Override lebar/tata letak dialog bila perlu (mis. modal yang butuh lebih lebar). */
  className?: string;
  /** Sembunyikan header default (judul + tutup) — pakai bila merender kustom di dalam children. */
  hideHeader?: boolean;
  /** id elemen judul kustom untuk aria-labelledby pada DialogPrimitive.Content. */
  ariaLabelledby?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 data-[state=open]:animate-slide-up" />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl z-50 border border-slate-200 dark:border-slate-800",
          className
        )}
        aria-labelledby={ariaLabelledby}
      >
        {!hideHeader && (
          <div className="flex items-center justify-between mb-5">
            {title && (
              <DialogPrimitive.Title className="text-lg font-semibold text-slate-900 dark:text-white">
                {title}
              </DialogPrimitive.Title>
            )}
            <DialogPrimitive.Close className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </DialogPrimitive.Close>
          </div>
        )}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
