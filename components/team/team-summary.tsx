"use client";

import { useState } from "react";
import { Check, Copy, Crown, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamSummary } from "@/types";
import { spacedCode } from "@/components/team/team-meta";

interface SummaryProps {
  summary: TeamSummary;
  joinCode: string | null;
  projectName: string;
}

const cards = [
  {
    key: "total",
    label: "Total Anggota",
    icon: Users,
    box: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/10 dark:text-[#8FAAFF]",
  },
  {
    key: "admin",
    label: "Admin",
    icon: Crown,
    box: "bg-violet-500/10 text-violet-600 dark:bg-[rgba(167,139,250,.16)] dark:text-[#C4B5FD]",
  },
  {
    key: "deputy",
    label: "Wakil Admin",
    icon: ShieldCheck,
    box: "bg-pink-500/10 text-pink-600 dark:bg-[rgba(244,114,182,.16)] dark:text-[#F9A8D4]",
  },
  {
    key: "member",
    label: "Member",
    icon: Users,
    box: "bg-slate-500/10 text-slate-500 dark:bg-[rgba(148,163,184,.16)] dark:text-[#B6C0D2]",
  },
] as const;

export function TeamSummaryCards({ summary, joinCode, projectName }: SummaryProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!joinCode) return;
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Browser dapat menolak akses clipboard.
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
      {cards.map(({ key, label, icon: Icon, box }) => (
        <div
          key={key}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <span
            aria-hidden
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              box
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <p className="mt-3 text-xs text-slate-500 dark:text-[#8B96AD]">{label}</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-[#E6EAF2]">
            {summary[key]}
          </p>
        </div>
      ))}

      {joinCode && (
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-1 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-[#8B96AD]">
            Kode gabung {projectName}
          </p>
          <p className="mt-1 text-xl font-bold tracking-widest text-slate-900 dark:text-[#E6EAF2]">
            {spacedCode(joinCode)}
          </p>
          <button
            type="button"
            onClick={copyCode}
            className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" /> Kode disalin
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Salin
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
