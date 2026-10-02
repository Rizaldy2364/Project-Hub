"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: ["/dashboard"],
  },
  {
    href: "/projects",
    label: "Project Saya",
    icon: FolderKanban,
    match: ["/projects"],
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {items.map(({ href, label, icon: Icon, match }) => {
        const active = match.some((m) => pathname.startsWith(m));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              active
                ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4",
                active ? "text-blue-600 dark:text-blue-300" : "text-slate-400"
              )}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}