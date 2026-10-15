import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guards";
import { countUnreadNotifications } from "@/repositories/notification.repository";

/**
 * GET /api/notifications/unread-count — jumlah notifikasi BELUM DIBACA user.
 *
 * - Tanpa sesi: 401.
 * - Query: satu aggregate query `countUnreadNotifications` (tidak ada join).
 * - Scope: hanya notifikasi milik user yang meminta (repository menegaskan
 *   `userId` di WHERE).
 */
export async function GET() {
  const guard = await requireUser();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const count = await countUnreadNotifications(guard.user.id);
  return NextResponse.json({ count });
}
