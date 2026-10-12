import { prisma } from "@/lib/prisma";
import {
  findDueSoonTasks,
  existsDueSoonToday,
  createNotification,
} from "@/repositories/notification.repository";

export interface RunDueSoonResult {
  checked: number;
  created: number;
  skipped: number;
}

/**
 * Job harian DUE_SOON: task tidak terhapus, status bukan DONE, punya assignee,
 * dueDate dalam 3 hari ke depan. Cegah duplikat: satu notifikasi per
 * (userId, taskId) per hari.
 */
export async function runDueSoonCheck(): Promise<RunDueSoonResult> {
  const tasks = await findDueSoonTasks();
  let created = 0;
  let skipped = 0;

  for (const task of tasks) {
    if (!task.assigneeId) {
      skipped += 1;
      continue;
    }
    const full = await prisma.task.findUnique({
      where: { id: task.id },
      select: { list: { select: { projectId: true } } },
    });
    if (!full) {
      skipped += 1;
      continue;
    }
    const already = await existsDueSoonToday(task.assigneeId, task.id);
    if (already) {
      skipped += 1;
      continue;
    }
    await createNotification({
      type: "DUE_SOON",
      userId: task.assigneeId,
      actorId: null,
      projectId: full.list.projectId,
      taskId: task.id,
    });
    created += 1;
  }

  return { checked: tasks.length, created, skipped };
}

// TODO(PROJECT_COMPLETED): belum ada konsep "project selesai" di database —
// jangan membuat notifikasi PROJECT_COMPLETED sampai konsep itu ada.
// Jangan menambah field baru di Project untuk ini tanpa diskusi.
