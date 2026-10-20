import type { InboxNotification } from "@/types";

export function formatInboxTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function groupLabel(iso: string): "HARI INI" | "KEMARIN" | "LEBIH LAMA" {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / 86_400_000
  );
  if (diffDays <= 0) return "HARI INI";
  if (diffDays === 1) return "KEMARIN";
  return "LEBIH LAMA";
}

export function dueInDays(dueIso: string | null): number | null {
  if (!dueIso) return null;
  const due = new Date(dueIso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86_400_000);
}

export function dueLabel(dueIso: string | null): string | null {
  const n = dueInDays(dueIso);
  if (n === null) return null;
  if (n < 0) return `lewat ${Math.abs(n)} hari`;
  if (n === 0) return "hari ini";
  return `${n} hari lagi`;
}

export function taskLink(item: InboxNotification): string {
  // Link ke board project; anchor task bila ada. Project soft-deleted →
  // fallback aman (detail panel menonaktifkan tombolnya, lihat inbox-detail).
  if (item.project?.deleted) return "/inbox";
  const projectId = item.task?.projectId ?? item.project?.id;
  if (!projectId) return "/dashboard";
  return item.task
    ? `/projects/${projectId}#task-${item.task.id}`
    : `/projects/${projectId}`;
}

export function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
