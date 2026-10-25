"use client";

import { Crown, ShieldCheck, Users } from "lucide-react";
import type { TeamSummary } from "@/types";

interface SummaryProps {
  summary: TeamSummary;
}

const cards = [
  {
    key: "admin",
    label: "Admin",
    icon: Crown,
    box: "bg-violet-500/10 text-violet-600 dark:bg-[rgba(167,139,250,.16)] dark:text-[#C4B5FD]",
  },
  {
    key: "manager",
    label: "Manager",
    icon: ShieldCheck,
    box: "bg-pink-500/10 text-pink-600 dark:bg-[rgba(244,114,182,.16)] dark:text-[#F9A8D4]",
  },
  {
    key: "member",
    label: "Member",
    icon: Users,
    box: "bg-slate-500/10 text-slate-500 dark:bg-[rgba(148,163,184,.16)] dark:text-[#B6C0D2]",
  },
  {
    key: "viewer",
    label: "Viewer",
    icon: Users,
    box: "bg-[#9CA3AF]/10 text-[#6B7280] dark:bg-[rgba(156,163,175,.16)] dark:text-[#94A3B8]",
  },
] as const;

/** Kartu ringkasan anggota: Admin, Manager, Member, Viewer.
 * 2 kolom di layar kecil, 2+2 mulai lg (1024px), 4 kolom penuh mulai xl (1280px). */
export function TeamSummaryCards({ summary }: SummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ key, label, icon: Icon, box }) => (
        <div
          key={key}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[.08] dark:bg-[#131A2B]"
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${box}`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {summary[key]}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-[#8B96AD]">
                {label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
