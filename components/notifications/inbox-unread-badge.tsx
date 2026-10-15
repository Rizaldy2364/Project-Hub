"use client";

import { useUnreadCount } from "@/components/notifications/unread-provider";
import { cn } from "@/lib/utils";

/**
 * Badge angka notifikasi belum dibaca untuk item menu "Inbox" di sidebar.
 * Murni tampilan — item menu tetap <Link> biasa ke /inbox (navigasi +
 * active-state normal); panel notifikasi hanya dibuka oleh lonceng top bar.
 *
 * Pil biru, disembunyikan saat 0, maks tampil "99+", dengan aria-label
 * "{n} notifikasi belum dibaca". Angka dari `useUnreadCount` — sumber yang
 * sama dengan lonceng top bar sehingga keduanya selalu sinkron.
 */
export function InboxUnreadBadge() {
  const { count } = useUnreadCount();
  if (count <= 0) return null;

  const text = count > 99 ? "99+" : String(count);

  return (
    <span
      role="status"
      aria-label={`${count} notifikasi belum dibaca`}
      className={cn(
        "inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center",
        "ml-auto rounded-full px-1.5 text-[10px] font-bold text-white",
        "bg-blue-600 pointer-events-none"
      )}
    >
      {text}
    </span>
  );
}
