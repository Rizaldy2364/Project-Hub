"use client";

import { useCallback, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadCount } from "@/components/notifications/unread-provider";
import { NotifPanel } from "@/components/notifications/notif-panel";

/**
 * Tombol lonceng notifikasi di top bar.
 * Angka badge memakai `useUnreadCount` (satu sumber kebenaran dengan menu
 * Inbox di sidebar); panel memuat 8 notifikasi terbaru — lihat NotifPanel.
 */
export function NotifBellDropdown({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { count } = useUnreadCount();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  const visible = count > 0;
  const badgeText = count > 99 ? "99+" : String(count);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={visible ? `Notifikasi, ${count} belum dibaca` : "Notifikasi"}
        className={cn(
          "relative w-9 h-9 rounded-full flex items-center justify-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
          className
        )}
        onClick={() => setOpen((v) => !v)}
        {...props}
      >
        <Bell className="h-5 w-5" />
        {visible && (
          <span
            aria-hidden
            className={cn(
              "absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
              "pointer-events-none",
              "bg-red-500 text-white"
            )}
          >
            {badgeText}
          </span>
        )}
      </button>

      <NotifPanel open={open} onClose={close} triggerRef={triggerRef} />
    </>
  );
}
