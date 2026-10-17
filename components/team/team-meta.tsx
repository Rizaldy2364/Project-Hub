"use client";

import type { ProjectRole } from "@/types";

export const ROLE_META: Record<
  ProjectRole,
  { label: string; short: string; badge: string }
> = {
  ADMIN: {
    label: "Admin",
    short: "Admin",
    badge:
      "bg-violet-500/10 text-violet-700 dark:bg-[rgba(167,139,250,.16)] dark:text-[#C4B5FD]",
  },
  MANAGER: {
    label: "Manager",
    short: "Manager",
    badge:
      "bg-pink-500/10 text-pink-700 dark:bg-[rgba(244,114,182,.16)] dark:text-[#F9A8D4]",
  },
  VIEWER: {
    label: "Viewer",
    short: "Viewer",
    badge:
      "bg-[#9CA3AF]/10 text-[#9CA3AF] dark:bg-[rgba(156,163,175,.16)] dark:text-[#94A3B8]",
  },
  MEMBER: {
    label: "Member",
    short: "Member",
    badge:
      "bg-slate-500/10 text-slate-600 dark:bg-[rgba(148,163,184,.16)] dark:text-[#B6C0D2]",
  },
};

export function formatJoinedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
