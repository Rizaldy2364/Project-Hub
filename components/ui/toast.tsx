"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Nada toast: sukses memakai pola gelap team-view, error merah. */
export type ToastTone = "success" | "error";

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

/**
 * Hook toast ringkas — dipakai kotak komentar task & balasan Inbox.
 *
 * - Satu toast dalam satu waktu (yang baru menggantikan yang lama).
 * - Hilang otomatis setelah 2,5 detik.
 * - Tidak memblokir UI (hanya elemen fixed ber-pointer-events-none).
 */
export function useToast() {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timerRef = useRef<number | null>(null);
  const idRef = useRef(0);

  const show = useCallback((message: string, tone: ToastTone = "success") => {
    idRef.current += 1;
    setToast({ id: idRef.current, message, tone });
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setToast(null), 2500);
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
        "pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg",
        toast.tone === "error"
          ? "bg-red-600 text-white"
          : "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
      )}
    >
      {toast.message}
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