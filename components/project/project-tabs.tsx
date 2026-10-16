"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Tab {
  key: string;
  href: string;
  label: string;
  count?: number;
  unread?: number;
}

/**
 * Tab bar halaman project: Ringkasan | Task | Anggota | Diskusi | Aktivitas.
 * Aktif diturunkan dari pathname (usePathname); tidak ada Pengaturan tab.
 */
export function ProjectTabs({
  projectId,
  taskCount,
  memberCount,
  unreadDiskusi,
}: {
  projectId: string;
  taskCount: number;
  memberCount: number;
  unreadDiskusi: number;
}) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  const tabs: Tab[] = [
    { key: "ringkasan", href: base, label: "Ringkasan" },
    { key: "tasks", href: `${base}/tasks`, label: "Task", count: taskCount },
    {
      key: "anggota",
      href: `${base}/anggota`,
      label: "Anggota",
      count: memberCount,
    },
    {
      key: "diskusi",
      href: `${base}/diskusi`,
      label: "Diskusi",
      unread: unreadDiskusi,
    },
    { key: "aktivitas", href: `${base}/aktivitas`, label: "Aktivitas" },
  ];

  let activeKey: string | null = null;
  if (pathname === base) activeKey = "ringkasan";
  else if (pathname.startsWith(`${base}/tasks`)) activeKey = "tasks";
  else if (pathname.startsWith(`${base}/anggota`)) activeKey = "anggota";
  else if (pathname.startsWith(`${base}/diskusi`)) activeKey = "diskusi";
  else if (pathname.startsWith(`${base}/aktivitas`)) activeKey = "aktivitas";

  const listRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeKey) return;
    const id = `project-tab-${activeKey}`;
    activeIdRef.current = id;
    const el = document.getElementById(id);
    if (el && listRef.current) {
      el.scrollIntoView({ block: "nearest", inline: "center" });
    }
  }, [pathname, activeKey]);

  return (
    <div
      ref={listRef}
      className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800"
    >
      <div role="tablist" aria-label="Bagian project" className="flex flex-nowrap items-center gap-6 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const active = activeKey === tab.key;
          const showCount = tab.count != null ? tab.count > 0 : true;
          const showUnread = tab.unread != null ? tab.unread > 0 : false;
          return (
            <Link
              key={tab.key}
              id={`project-tab-${tab.key}`}
              href={tab.href}
              role="tab"
              aria-controls={`project-panel-${tab.key}`}
              aria-selected={active}
              aria-current={active ? "page" : undefined}
              onClick={() => {
                activeIdRef.current = null;
              }}
              className={cn(
                "flex items-center gap-2 shrink-0 whitespace-nowrap pb-3 border-b-2 font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                active
                  ? "border-blue-600 text-blue-700 dark:text-blue-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              {tab.label}
              {(showCount ? tab.count ?? 0 : 0) > 0 ? (
                <span className="ml-1 h-5 w-5 shrink-0 flex items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {tab.count}
                </span>
              ) : showUnread ? (
                <span className="ml-1 shrink-0 inline-flex h-6 items-center gap-1.5 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {tab.unread} baru
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}