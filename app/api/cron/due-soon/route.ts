import { NextResponse } from "next/server";
import { runDueSoonCheck } from "@/lib/due-soon";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // Tanpa CRON_SECRET: tolak semua (kecuali development localhost agar mudah dites).
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const header =
    req.headers.get("x-cron-secret") ?? req.headers.get("authorization");
  if (!header) return false;
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  return token === secret;
}

// GET /api/cron/due-soon — dipanggil cron harian (mis. Vercel Cron).
// Lindungi dengan header `x-cron-secret: <CRON_SECRET>`.
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runDueSoonCheck();
  return NextResponse.json({ success: true, ...result });
}
