"use client";

import { LogOut } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { logoutAction } from "@/actions/user.actions";
import { cn } from "@/lib/utils";

const triggerStyles = {
  sidebar:
    "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-slate-400 dark:hover:text-red-400",
  icon: "inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400",
};

interface LogoutButtonProps {
  variant?: keyof typeof triggerStyles;
  /** Tampilkan teks "Keluar" di samping ikon (default: tampil). */
  withLabel?: boolean;
  className?: string;
}

/** Tombol keluar + dialog konfirmasi "yakin ingin keluar". */
export function LogoutButton({
  variant = "sidebar",
  withLabel = true,
  className,
}: LogoutButtonProps) {
  return (
    <ConfirmDialog
      title="Keluar dari akun?"
      message="Kamu akan keluar dari sesi ini. Untuk mengakses project lagi, kamu harus login ulang dengan email dan password."
      confirmLabel="Keluar"
      action={logoutAction}
      confirmClassName="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
    >
      <button
        type="button"
        aria-label={withLabel ? undefined : "Keluar dari akun"}
        className={cn(triggerStyles[variant], className)}
      >
        <LogOut className={variant === "sidebar" ? "h-4 w-4" : "h-5 w-5"} />
        {withLabel && "Keluar"}
      </button>
    </ConfirmDialog>
  );
}
