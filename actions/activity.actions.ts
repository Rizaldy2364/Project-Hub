"use server";

import { requireUser } from "@/lib/auth-guards";
import { activityFeedSchema } from "@/lib/validations/activity.schema";
import { findActivityLogs } from "@/repositories/activity.repository";
import { toActivityItem } from "@/lib/activity";

// DAFTAR AKTIVITAS — cursor pagination 30/halaman; dipakai tombol
// "Muat lebih banyak" di feed /aktivitas.
export async function listActivityPageAction(input: {
  type?: string;
  project?: string;
  member?: string;
  range?: number | string;
  cursor?: string;
}) {
  // (1) Otorisasi — wajib login.
  const guard = await requireUser();
  if ("error" in guard) return { error: guard.error, status: guard.status };

  // (2) Validasi Zod — nilai asing/tidak valid jatuh ke default; ID project
  // di luar keanggotaan menghasilkan feed kosong (dibatasi scope di repository).
  const parsed = activityFeedSchema.safeParse(input);
  if (!parsed.success) return { error: "Parameter tidak valid", status: 400 as const };

  const { cursor, ...filters } = parsed.data;
  const rows = await findActivityLogs({
    userId: guard.user.id,
    ...filters,
    cursor,
    take: 30,
  });

  const hasMore = rows.length > 30;
  const page = hasMore ? rows.slice(0, 30) : rows;

  return {
    success: true as const,
    items: page.map(toActivityItem),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}
