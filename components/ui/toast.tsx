"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Nada toast: sukses memakai pola gelap team-view, error merah. */
export type ToastTone = "success" | "error";

/** Tombol aksi di dalam toast (mis. "Urungkan"). */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  /** Opsional — tombol aksi di kanan pesan (pointer-events-auto). */
  action?: ToastAction;
  /** Opsional — durasi tampil; default 2.500 ms. */
  durationMs?: number;
}

export interface ToastShowOptions {
  action?: ToastAction;
  durationMs?: number;
}

/** Fungsi show() dari useToast — dipakai lintas komponen (mis. board). */
export type ShowToast = (
  message: string,
  tone?: ToastTone,
  options?: ToastShowOptions
) => void;

/**
 * Hook toast ringkas — dipakai kotak komentar task & balasan Inbox.
 *
 * - Satu toast dalam satu waktu (yang baru menggantikan yang lama).
 * - Hilang otomatis setelah 2,5 detik (atau `durationMs` bila diberikan).
 * - Tidak memblokir UI (hanya elemen fixed ber-pointer-events-none; tombol
 *   aksi memakai pointer-events-auto).
 */
export function useToast() {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timerRef = useRef<number | null>(null);
  const idRef = useRef(0);

  const show = useCallback<ShowToast>((message, tone = "success", options) => {
    idRef.current += 1;
    const action = options?.action
      ? {
          label: options.action.label,
          onClick: () => {
            options.action?.onClick();
            setToast(null);
          },
        }
      : undefined;
    setToast({
      id: idRef.current,
      message,
      tone,
      ...(action ? { action } : {}),
      ...(options?.durationMs ? { durationMs: options.durationMs } : {}),
    });
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(
      () => setToast(null),
      options?.durationMs ?? 2500
    );
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  return { toast, show };
}

/** View toast: fixed di tengah-bawah, `role="status"` + `aria-live="polite"`. */
export function Toast({ toast }: { toast: ToastItem | null }) {
  if (!toast) return null;
  return (
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg",
        toast.tone === "error"
          ? "bg-red-600 text-white"
          : "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
      )}
    >
      <span>{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={toast.action.onClick}
          className="pointer-events-auto shrink-0 rounded-lg bg-white/20 px-2.5 py-1 text-xs font-bold transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white dark:bg-black/10 dark:text-slate-900 dark:hover:bg-black/20 dark:focus-visible:ring-slate-900"
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Ubah error server (string | fieldErrors Zod) menjadi pesan toast.
 * Fallback: "Gagal mengirim, coba lagi".
 */
export function toToastError(
  error: unknown,
  fallback = "Gagal mengirim, coba lagi"
): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    for (const value of Object.values(error as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        const first = value.find((v) => typeof v === "string" && v.trim());
        if (typeof first === "string") return first;
      } else if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }
  return fallback;
}