import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guards";
import { getDiscussionSummaries } from "@/lib/discussions";

/**
 * GET /api/discussions/summary — daftar percakapan user (pesan terakhir +
 * jumlah belum dibaca), dipakai polling daftar di /diskusi (15 detik).
 * Non-login mendapat 401; project non-ikut serta tidak ikut ( query dibatasi
 * keanggotaan user di repository ).
 */
export async function GET() {
  const guard = await requireUser();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const items = await getDiscussionSummaries(guard.user.id);
  return NextResponse.json({ items });
}