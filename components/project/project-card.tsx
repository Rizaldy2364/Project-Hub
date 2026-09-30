import Link from "next/link";
import { CalendarDays, CircleCheck } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { DashboardProject } from "@/types";
import { UserAvatar } from "@/components/ui/user-avatar";
import { CopyCodeButton } from "@/components/project/copy-code-button";

function getStatus(total: number, done: number) {
  if (total === 0) {
    return {
      label: "Belum ada task",
      className: "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-slate-400",
    };
  }
  if (done === total) {
    return {
      label: "Selesai",
      className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    };
  }
  return {
    label: "Berjalan",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  };
}

interface ProjectCardProps {
  project: DashboardProject;
  view: "grid" | "list";
}

export function ProjectCard({ project, view }: ProjectCardProps) {
  const isList = view === "list";
  const percent =
    project.taskTotal === 0
      ? 0
      : Math.round((project.taskDone / project.taskTotal) * 100);
  const status = getStatus(project.taskTotal, project.taskDone);
  const extraMembers = project.memberCount - project.members.length;

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all",
        isList && "md:flex-row md:items-center md:gap-6"
      )}
    >
      {/* Badges */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          isList ? "md:w-64 md:shrink-0" : "justify-between"
        )}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide",
              project.role === "ADMIN"
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300"
            )}
          >
            {project.role}
          </span>
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-medium",
              status.className
            )}
          >
            {status.label}
          </span>
        </div>
        {project.joinCode && <CopyCodeButton code={project.joinCode} />}
      </div>

      {/* Judul & deskripsi */}
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-slate-900 dark:text-white truncate">
          <Link
            href={`/projects/${project.id}`}
            className="after:absolute after:inset-0 after:rounded-2xl"
          >
            {project.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2.5rem]">
          {project.description || "Belum ada deskripsi"}
        </p>
      </div>

      {/* Progress */}
      <div className={cn(isList && "md:w-56 md:shrink-0")}>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <CircleCheck className="w-3.5 h-3.5 text-slate-400" />
            {project.taskDone} / {project.taskTotal} Task
          </span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {percent}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              percent === 100 ? "bg-emerald-500" : "bg-indigo-600"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div
        className={cn(
          "flex items-center justify-between gap-4",
          isList && "md:w-64 md:shrink-0"
        )}
      >
        <div className="flex items-center">
          {project.members.map((member, i) => (
            <UserAvatar
              key={member.id}
              name={member.name}
              image={member.avatarUrl}
              size="sm"
              className={cn(
                "ring-2 ring-white dark:ring-zinc-900",
                i > 0 && "-ml-2"
              )}
            />
          ))}
          {extraMembers > 0 && (
            <span className="-ml-2 w-8 h-8 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center">
              +{extraMembers}
            </span>
          )}
        </div>
        <span
          suppressHydrationWarning
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
        >
          <CalendarDays className="w-3.5 h-3.5" />
          {format(new Date(project.createdAt), "d MMM yyyy", { locale: idLocale })}
        </span>
      </div>
    </article>
  );
}