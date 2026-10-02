"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { LogoutButton } from "@/components/layout/logout-button";

interface SidebarUserProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function SidebarUser({ name, email, image }: SidebarUserProps) {
  const pathname = usePathname();
  const profileActive = pathname.startsWith("/profile");

  return (
    <div className="border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3 px-4 py-4">
        <UserAvatar name={name} image={image} className="rounded-xl" />
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">
            {name}
          </p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {email}
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-1">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-xl px-2 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
            profileActive
              ? "text-blue-600 dark:text-blue-300"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <User className="w-4 h-4" />
          Profil Saya
        </Link>

        <LogoutButton />
      </div>
    </div>
  );
}
