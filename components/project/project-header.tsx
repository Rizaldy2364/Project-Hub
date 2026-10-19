"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CalendarDays, Copy, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDayMonthWib } from "@/lib/utils";
import { Toast, useToast } from "@/components/ui/toast";

export interface ProjectHeaderProgress {
  todo: number;
  inProgress: number;
  done: number;
  total: number;
  percent: number;
}

export interface ProjectHeaderProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    joinCode?: string;
  };
  role: string;
  /** Strip progres digabung ke dalam kartu header (di bawah baris chip). */
  progress: ProjectHeaderProgress;
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

/** Hitungan per status — selalu ditampilkan ketiganya (termasuk 0). */
const STATUS_COUNTS: {
  key: keyof ProjectHeaderProgress;
  label: string;
  dot: string;
}[] = [
  { key: "todo", label: "Belum", dot: "bg-slate-400 dark:bg-slate-500" },
  { key: "inProgress", label: "Dikerjakan", dot: "bg-blue-500" },
  { key: "done", label: "Selesai", dot: "bg-emerald-500" },
];

export function ProjectHeader({
  project,
  role,
  progress,
  createTaskTrigger,
  joinCode,
  canViewJoinCode: canViewCode,
}: ProjectHeaderProps) {
  const { toast, show } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);

  async function copyJoinCode() {
    if (!joinCode) return;
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopiedCode(true);
      show("Kode disalin", "success");
      window.setTimeout(() => setCopiedCode(false), 1400);
    } catch {
      // Fallback ke hidden textarea bila Clipboard API tidak tersedia.
      try {
        const textarea = document.createElement("textarea");
        textarea.value = joinCode;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopiedCode(true);
        show("Kode disalin", "success");
        window.setTimeout(() => setCopiedCode(false), 1400);
      } catch {
        show("Gagal menyalin kode", "error");
      }
    }
  }

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

        {/* Satu-satunya tombol add global: "Buat task" (canCreateTask). */}
        {createTaskTrigger && (
          <div className="flex shrink-0 items-center">{createTaskTrigger}</div>
        )}
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

      {/* Strip progres — digabung ke kartu header, dipisah garis tipis. */}
      <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500"
              aria-hidden
            />
            <span className="text-slate-700 dark:text-slate-300">Progres project</span>
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {progress.done} / {progress.total} task · {progress.percent}%
          </span>
        </div>
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percent}
          aria-label="Progres penyelesaian task"
        >
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {STATUS_COUNTS.map(({ key, label, dot }) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
              <span className="text-slate-600 dark:text-slate-400">
                {label}: {progress[key]}
              </span>
            </span>
          ))}
        </div>
      </div>
      <Toast toast={toast} />
    </section>
  );
}