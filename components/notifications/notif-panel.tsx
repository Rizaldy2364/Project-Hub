"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUnreadCount } from "@/components/notifications/unread-provider";
import { InboxRow } from "@/components/inbox/inbox-row";
import type { InboxNotification } from "@/types";
import {
  listRecentNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notification.actions";

/**
 * Panel notifikasi via portal ke document.body — dipakai lonceng top bar dan
 * menu Inbox sidebar supaya perilaku & data identik tanpa duplikasi.
 *
 * - Muat 8 notifikasi terbaru (MAX_ROWS) saat panel dibuka (bukan dipolling).
 * - Tiga bagian: header (judul + "Tandai semua dibaca") menempel di atas,
 *   daftar scroll di tengah (flex-1 min-h-0), footer "Lihat semua di Inbox"
 *   selalu terlihat di bawah.
 * - Tinggi: min(480px, viewport − posisi atas − 16px); dihitung ulang saat
 *   dibuka dan pada resize/scroll. Di bawah 640px menjadi sheet full-width
 *   dengan tinggi calc(100dvh − bawah top bar − 16px). TIDAK PERNAH lebih
 *   tinggi dari viewport.
 * - Posisi relatif `triggerRef` (rata kanan; digeser bila keluar viewport).
 * - Escape menutup + fokus kembali ke pemicu; klik backdrop menutup.
 * - Klik baris: tandai dibaca (optimistik, rollback via refresh) lalu
 *   navigasi — mention chat → `/diskusi?project&message`, lainnya → `/inbox`.
 * - Angka badge dari `useUnreadCount` (provider yang sama); badge header
 *   disembunyikan saat 0 dan di-cap "99+".
 */
export interface NotifPanelProps {
  open: boolean;
  onClose: () => void;
  /** Tombol pemicu — poros posisi panel & penerima kembalinya fokus. */
  triggerRef: React.RefObject<HTMLElement | null>;
}

/** Lebar panel desktop. */
const PANEL_WIDTH = 380;
/** Jumlah baris yang dimuat & dirender (sama dengan `take` di action). */
const MAX_ROWS = 8;
/** Tinggi maksimum panel desktop. */
const MAX_HEIGHT = 480;
/** Di bawah lebar ini panel menjadi sheet selebar layar. */
const SHEET_BREAKPOINT = 640;
/** Ruang aman di tepi bawah viewport. */
const VIEWPORT_GAP = 16;

interface PanelPos {
  top: number;
  left: number;
  width: number;
  maxHeight: number | string;
}

function computePos(el: HTMLElement): PanelPos {
  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const top = rect.bottom + 8;

  // Sheet full-width di layar kecil: tinggi = 100dvh − bawah top bar − 16px.
  if (vw < SHEET_BREAKPOINT) {
    return {
      top,
      left: 12,
      width: Math.max(240, vw - 24),
      maxHeight: `calc(100dvh - ${Math.ceil(rect.bottom) + VIEWPORT_GAP}px)`,
    };
  }

  let left = rect.right - PANEL_WIDTH;
  if (left < 12) left = rect.left;
  if (left + PANEL_WIDTH > vw - 12) left = vw - 12 - PANEL_WIDTH;
  if (left < 12) left = 12;

  // min(480px, viewport − posisi atas − 16px) — tidak pernah melebihi viewport.
  const maxHeight = Math.max(1, Math.min(MAX_HEIGHT, vh - top - VIEWPORT_GAP));
  return { top, left, width: PANEL_WIDTH, maxHeight };
}

export function NotifPanel({ open, onClose, triggerRef }: NotifPanelProps) {
  const router = useRouter();
  const { count, setCount, refresh } = useUnreadCount();
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Muat data + posisi hanya saat panel dibuka (atau saat "Coba lagi").
  useEffect(() => {
    if (!open) return;

    const el = triggerRef.current;
    if (el) setPos(computePos(el));

    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await listRecentNotificationsAction();
        if (cancelled) return;
        if ("error" in res) {
          setError(res.error ?? "Gagal memuat notifikasi.");
          setItems([]);
        } else {
          setItems(res.items);
        }
      } catch {
        if (cancelled) return;
        setError("Gagal memuat notifikasi.");
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, reloadKey, triggerRef]);

  const handleClose = useCallback(() => {
    onClose();
    triggerRef.current?.focus();
  }, [onClose, triggerRef]);

  // Escape menutup; posisi mengikuti scroll/resize selama panel terbuka.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    const reposition = () => {
      const el = triggerRef.current;
      if (el) setPos(computePos(el));
    };

    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, handleClose, triggerRef]);

  const handleBackdrop = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const target = e.target;
      if (target instanceof Node && panelRef.current?.contains(target)) return;
      handleClose();
    },
    [handleClose]
  );

  const handleRowClick = useCallback(
    async (item: InboxNotification) => {
      const wasUnread = !item.readAt;
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, readAt: new Date().toISOString() } : i))
      );
      if (wasUnread) setCount(Math.max(0, count - 1));

      await markNotificationReadAction(item.id);
      void refresh(); // selaraskan angka (rollback otomatis bila gagal)

      onClose();
      if (item.type === "MENTION" && item.message && item.project) {
        router.push(`/diskusi?project=${item.project.id}&message=${item.message.id}`);
      } else {
        router.push("/inbox");
      }
    },
    [count, setCount, refresh, onClose, router]
  );

  const handleMarkAll = useCallback(async () => {
    if (count === 0) return;
    setCount(0); // optimistik — badge lonceng & sidebar langsung turun
    const res = await markAllNotificationsReadAction();
    void refresh(); // selaraskan dengan server (batal otomatis bila gagal)
    if ("error" in res) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? now })));
  }, [count, setCount, refresh]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-2" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-white/[0.08] dark:bg-[#0F1524]"
            >
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-skeleton" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-3 w-1/2 animate-pulse rounded bg-skeleton-2" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-skeleton-2" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col gap-3 p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Coba lagi
          </button>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="flex flex-col gap-3 p-4">
          <p className="text-sm font-medium text-slate-700 dark:text-[#E6EAF2]">
            Belum ada notifikasi
          </p>
          <p className="text-xs text-slate-500 dark:text-[#8B96AD]">
            Notifikasi akan muncul di sini setelah ada aktivitas project.
          </p>
        </div>
      );
    }

    // Batasi 8 baris terbaru — jaring pengaman di sisi klien (sumber utama
    // sudah dipotong di listRecentNotificationsAction).
    return (
      <div className="space-y-2">
        {items.slice(0, MAX_ROWS).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => void handleRowClick(item)}
            className="block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <InboxRow item={item} />
          </button>
        ))}
      </div>
    );
  };

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop: klik di luar panel menutup (klik pemicu ikut tertangkap di sini). */}
      <div className="fixed inset-0 z-40" onMouseDown={handleBackdrop} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Notifikasi"
        className="fixed z-50 flex w-96 max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#0F1524]"
        style={
          pos
            ? {
                top: pos.top,
                left: pos.left,
                width: pos.width,
                maxHeight: pos.maxHeight,
              }
            : { top: 72, right: 16, maxHeight: "calc(100dvh - 88px)" }
        }
      >
        {/* Header — menempel di atas: judul + badge (hanya bila > 0) + tandai semua */}
        <div className="shrink-0 border-b border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Notifikasi
            </h2>
            {count > 0 && (
              <span
                aria-hidden
                className={cn(
                  "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white",
                  count > 99
                    ? "bg-slate-900 dark:bg-white dark:text-slate-900"
                    : "bg-blue-600",
                  "pointer-events-none"
                )}
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </div>
          <div className="px-4 pb-3">
            <button
              type="button"
              onClick={() => void handleMarkAll()}
              disabled={count === 0}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40",
                count === 0
                  ? "cursor-not-allowed text-slate-400 dark:text-[#8B96AD]"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2438]"
              )}
            >
              <CheckCheck className="h-4 w-4" />
              {count === 0 ? "Tidak ada yang belum dibaca" : "Tandai semua dibaca"}
            </button>
          </div>
        </div>

        {/* Daftar — scroll di dalam panel (flex-1 min-h-0, scrollbar tipis) */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 [scrollbar-color:rgba(148,163,184,0.5)_transparent] [scrollbar-width:thin] dark:[scrollbar-color:rgba(255,255,255,0.25)_transparent]">
          {renderContent()}
        </div>

        {/* Footer — selalu terlihat di bawah */}
        <div className="shrink-0 border-t border-slate-200 px-4 py-3 dark:border-white/[0.08]">
          <button
            type="button"
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={() => {
              onClose();
              router.push("/inbox");
            }}
          >
            Lihat semua di Inbox
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
