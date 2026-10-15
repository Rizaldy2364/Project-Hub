import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { searchQuerySchema } from "@/lib/validations/search.schema";
import {
  searchProjects,
  searchTasks,
} from "@/repositories/search.repository";
import type {
  SearchResponse,
  SearchProjectResult,
  SearchTaskResult,
} from "@/types";

// Batas pencarian: 60 permintaan / menit / user.
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;
// Ambil lebih banyak dari 5 agar peringkat "diawali query" tetap masuk, lalu
// dipotong di route.
const FETCH_TAKE = 20;
const RESULT_LIMIT = 5;

/**
 * Escape wildcard LIKE (%, _, \) agar dicari sebagai teks biasa. Backslash
 * harus di-escape lebih dulu. Backslash adalah escape default PostgreSQL LIKE.
 */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

/**
 * Peringkat: nama yang DIAWALI query lebih dulu, lalu sisanya. Urutan relatif
 * di dalam tiap grup dipertahankan (input sudah terurut terbaru lebih dulu),
 * sehingga "terbaru" menjadi pemecah seri.
 */
function rankByPrefix<T>(
  rows: T[],
  getText: (row: T) => string,
  query: string
): T[] {
  const q = query.toLowerCase();
  const startsWith: T[] = [];
  const others: T[] = [];
  for (const row of rows) {
    if (getText(row).toLowerCase().startsWith(q)) startsWith.push(row);
    else others.push(row);
  }
  return [...startsWith, ...others];
}

/**
 * GET /api/search?q= — pencarian project & task milik user (top bar).
 * Read-only; non-login 401; query < 2 karakter 400 tanpa sentuh DB; dibatasi
 * 60 permintaan/menit/user (429). Scope selalu dari keanggotaan user di server,
 * tidak pernah dari id yang dikirim client.
 */
export async function GET(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const url = new URL(request.url);
  const parsed = searchQuerySchema.safeParse({ q: url.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    // Terlalu pendek / tidak valid: hasil kosong, TANPA menyentuh database.
    const empty: SearchResponse = { projects: [], tasks: [] };
    return NextResponse.json(empty, { status: 400 });
  }

  const rate = checkRateLimit(
    `search:${guard.user.id}`,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak pencarian, coba lagi sebentar" },
      { status: 429 }
    );
  }

  const query = parsed.data.q;
  const escaped = escapeLike(query);

  const [projectRows, taskRows] = await Promise.all([
    searchProjects({ userId: guard.user.id, query: escaped, take: FETCH_TAKE }),
    searchTasks({ userId: guard.user.id, query: escaped, take: FETCH_TAKE }),
  ]);

  const projects: SearchProjectResult[] = rankByPrefix(
    projectRows,
    (p) => p.name,
    query
  )
    .slice(0, RESULT_LIMIT)
    .map((p) => ({
      id: p.id,
      name: p.name,
      memberCount: p._count.members,
    }));

  const tasks: SearchTaskResult[] = rankByPrefix(
    taskRows,
    (t) => t.title,
    query
  )
    .slice(0, RESULT_LIMIT)
    .map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      project: { id: t.list.project.id, name: t.list.project.name },
    }));

  return NextResponse.json({ projects, tasks } satisfies SearchResponse);
}
