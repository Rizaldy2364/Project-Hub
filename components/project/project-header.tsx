"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CalendarDays, Copy, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDayMonthWib } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useToast } from "@/components/ui/toast";

export interface ProjectHeaderProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    joinCode?: string;
  };
  role: string;
  members: {
    userId: string;
    role: string;
    user: { id: string; name: string; avatarUrl: string | null };
  }[];
  createTaskTrigger: ReactNode | null;
  joinCode?: string;
  canViewJoinCode: boolean;
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN:
    "bg-violet-500/10 text-violet-700 dark:bg-[rgba(167,139,250,.16)] dark:text-[#C4B5FD]",
  MANAGER:
    "bg-pink-500/10 text-pink-700 dark:bg-[rgba(244,114,182,.16)] dark:text-[#F9A8D4]",
  MEMBER:
    "bg-slate-500/10 text-slate-600 dark:bg-[rgba(148,163,184,.16)] dark:text-[#B6C0D2]",
  VIEWER:
    "bg-teal-500/10 text-teal-700 dark:bg-teal-500/10 dark:text-[#5EEAD4]",
};

export function ProjectHeader({
  project,
  role,
  members,
  createTaskTrigger,
  joinCode,
  canViewJoinCode: canViewCode,
}: ProjectHeaderProps) {
  const { show } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);

  async function copyJoinCode() {
    if (!joinCode) return;
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopiedCode(true);
      show("Kode disalin", "success");
      window.setTimeout(() => setCopiedCode(false), 1400);
    } catch {
      // Browser dapat menolak akses clipboard.
    }
  }

  const visibleMembers = members.slice(0, 4);
  const extraMembers = members.length - visibleMembers.length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <Link
        href="/projects"
        className="-mt-0.5 text-xs font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300"
      >
        ← Project Saya
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold text-slate-900 dark:text-slate-100">
            {project.name}
          </h1>
          {project.description ? (
            <p
              className="mt-2 text-sm text-slate-500 dark:text-slate-400 truncate"
              title={project.description}
            >
              {project.description}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Belum ada deskripsi
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full sm:w-auto">
          <div className="flex items-end gap-2 shrink-0">
            {createTaskTrigger}
            <div className="relative inline-flex items-center">
              {visibleMembers.map((member) => (
                <UserAvatar
                  key={member.userId}
                  name={member.user.name}
                  image={member.user.avatarUrl}
                  size="sm"
                  className="ring-2 ring-white dark:ring-slate-900 shrink-0"
                />
              ))}
              {extraMembers > 0 && (
                <span className="-ml-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                  +{extraMembers}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        {canViewCode && joinCode && (
          <button
            type="button"
            onClick={copyJoinCode}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            KODE GABUNG{" "}
            <span className="font-mono">{joinCode}</span>
            <Copy className="h-3.5 w-3.5 shrink-0" />
            {copiedCode && <span className="text-emerald-600 dark:text-emerald-400">Tersalin</span>}
          </button>
        )}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold",
            ROLE_BADGE[role] ??
              "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          )}
        >
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          {role === "ADMIN" ? "Admin" : role === "MANAGER" ? "Manager" : role === "VIEWER" ? "Viewer" : "Member"}
        </span>
        <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          Dibuat {formatDayMonthWib(project.createdAt)},{" "}
          {project.createdAt.getFullYear()}
        </span>
      </div>
    </section>
  );
}