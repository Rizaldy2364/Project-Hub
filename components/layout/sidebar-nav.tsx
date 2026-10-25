"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navGroups } from "@/components/layout/nav-items";
import { InboxUnreadBadge } from "@/components/notifications/inbox-unread-badge";

interface SidebarNavProps {
  compact?: boolean;
}

export function SidebarNav({ compact = false }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu utama">
      {navGroups.map((group) => {
        const groupId = `nav-group-${group.label.toLowerCase()}`;
        return (
          <div
            key={group.label}
            role="group"
            aria-labelledby={groupId}
            className={cn("first:mt-0", compact ? "mt-3" : "mt-5")}
          >
            <div
              id={groupId}
              className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500"
            >
              {group.label}
            </div>
            <div className={compact ? "space-y-0.5" : "space-y-1"}>
              {group.items.map(({ href, label, icon: Icon, match, badge }) => {
                const active = match.some((m) => pathname.startsWith(m));

                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 rounded-xl font-medium transition-colors",
                      compact ? "py-2 text-[13px]" : "py-2.5 text-sm",
                      active
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        active ? "text-blue-600 dark:text-blue-300" : "text-slate-400"
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {/* Menu Inbox: link biasa + badge angka (bukan dropdown). */}
                    {badge ? <InboxUnreadBadge /> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
