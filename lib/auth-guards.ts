import { auth } from "@/lib/auth";
import { findProjectMember } from "@/repositories/project.repository";

/**
 * Guard otorisasi untuk Server Action / route handler (AGENTS.md 4.1).
 *
 * `requireProjectMember(projectId)` mengembalikan `{ user, membership }` bila
 * lolos, atau `{ error, status }` — 401 bila belum login, 403 bila bukan
 * anggota project. Pemanggil WAJIB berhenti saat `"error" in result`.
 *
 * Catatan: Server Action Next.js selalu dieksekusi lewat POST yang merespons
 * 200 untuk hasil yang valid; "401/403" diekspresikan lewat field `status`
 * pada payload agar tetap bisa ditolak dan diaudit di sisi client maupun
 * server (walau action dipanggil langsung).
 */
export async function requireProjectMember(projectId: string) {
  const session = await auth();
  if (!session) {
    return { error: "Unauthorized" as const, status: 401 as const };
  }

  const membership = await findProjectMember(session.user.id, projectId);
  if (!membership) {
    return {
      error: "Kamu bukan member project ini" as const,
      status: 403 as const,
    };
  }

  return { user: session.user, membership };
}

/** Guard: wajib login. Mengembalikan `{ user }` atau `{ error, status: 401 }`. */
export async function requireUser() {
  const session = await auth();
  if (!session) {
    return { error: "Unauthorized" as const, status: 401 as const };
  }
  return { user: session.user };
}
