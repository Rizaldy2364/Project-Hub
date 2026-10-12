"use client";

import {
  AtSign,
  BellRing,
  CheckCheck,
  Inbox as InboxIcon,
  UserPlus,
} from "lucide-react";
import type { InboxNotification, NotificationTypeValue } from "@/types";
import { dueLabel } from "@/lib/inbox-format";

export const TYPE_META: Record<
  NotificationTypeValue,
  { label: string; detailLabel: string; box: string; icon: typeof InboxIcon }
> = {
  TASK_ASSIGNED: {
    label: "Tugas",
    detailLabel: "TASK BARU UNTUKMU",
    box: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/10 dark:text-[#8FAAFF]",
    icon: InboxIcon,
  },
  MENTION: {
    label: "Mention",
    detailLabel: "KAMU DISEBUT",
    box: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/10 dark:text-[#C4B5FD]",
    icon: AtSign,
  },
  DUE_SOON: {
    label: "Pengingat",
    detailLabel: "TENGGAT DEKAT",
    box: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/10 dark:text-[#FBBF4D]",
    icon: BellRing,
  },
  MEMBER_JOINED: {
    label: "Undangan",
    detailLabel: "ANGGOTA BARU",
    box: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/10 dark:text-[#7DD3FC]",
    icon: UserPlus,
  },
  PROJECT_COMPLETED: {
    label: "Selesai",
    detailLabel: "PROJECT SELESAI",
    box: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-[#4ADE80]",
    icon: CheckCheck,
  },
};

export function titleParts(item: InboxNotification): React.ReactNode {
  const actor = item.actor?.name ?? "Seseorang";
  const taskTitle = item.task?.title ?? "";
  const projectName = item.project?.name ?? "";
  switch (item.type) {
    case "TASK_ASSIGNED":
      return (
        <>
          <strong className="font-semibold">{actor}</strong>
          {" menugaskan task "}
          <strong className="font-semibold">{taskTitle}</strong>
          {" kepadamu"}
        </>
      );
    case "MENTION":
      return (
        <>
          <strong className="font-semibold">{actor}</strong>
          {" menyebut kamu di komentar task "}
          <strong className="font-semibold">{taskTitle}</strong>
        </>
      );
    case "DUE_SOON": {
      const n = dueLabel(item.task?.dueDate ?? null) ?? "segera";
      return (
        <>
          {"Task "}
          <strong className="font-semibold">{taskTitle}</strong>
          {` jatuh tempo ${n}`}
        </>
      );
    }
    case "MEMBER_JOINED":
      return (
        <>
          <strong className="font-semibold">{actor}</strong>
          {" bergabung ke project "}
          <strong className="font-semibold">{projectName}</strong>
          {" lewat kode undangan"}
        </>
      );
    default:
      return (
        <>
          {"Project "}
          <strong className="font-semibold">{projectName}</strong>
          {" ditandai selesai"}
        </>
      );
  }
}

export function subTitle(item: InboxNotification): string {
  const project = item.project?.name ?? "";
  const due = item.task?.dueDate ? dueLabel(item.task.dueDate) : null;
  if (item.type === "MEMBER_JOINED") return project;
  if (due) return `${project} • tenggat ${due}`;
  return project;
}
