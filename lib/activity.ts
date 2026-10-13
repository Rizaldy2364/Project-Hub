import { createActivityLog } from "@/repositories/activity.repository";
import { activityLogDetailSelect } from "@/lib/selects/activity.select";
import type { ActivityAction, Prisma } from "@/app/generated/prisma/client";
import type { ActivityItem } from "@/types";

export interface LogActivityInput {
  userId: string;
  projectId: string;
  taskId?: string | null;
  action: ActivityAction;
  meta?: Prisma.InputJsonValue;
}

/**
 * Menulis satu baris ActivityLog (AGENTS.md 9.2).
 *
 * Dipanggil SETELAH aksi utama sukses, kecuali untuk aksi yang sudah memakai
 * transaksi di repository-nya (ubah peran / hapus anggota) — di situ baris log
 * ikut masuk ke transaksi yang sama lewat input `activity`.
 *
 * Kegagalan logging TIDAK PERNAH menggagalkan aksi utama: error ditangkap dan
 * dicatat ke console server saja.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await createActivityLog(input);
  } catch (error) {
    console.error("[activity] gagal menulis ActivityLog:", error);
  }
}

export type ActivityLogRow = Prisma.ActivityLogGetPayload<{
  select: typeof activityLogDetailSelect;
}>;

/** Map baris Prisma ke DTO aman-serial untuk komponen client. */
export function toActivityItem(row: ActivityLogRow): ActivityItem {
  return {
    id: row.id,
    action: row.action,
    meta: (row.meta as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
    actor: row.user,
    project: row.project,
  };
}
