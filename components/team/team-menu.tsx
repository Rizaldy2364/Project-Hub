"use client";

import type { ProjectRole, TeamMemberRow } from "@/types";

/**
 * Kontrol aksi baris anggota (tombol "Kelola") hanya untuk ADMIN, dan hanya
 * untuk anggota selain dirinya serta selain ADMIN lain. DEPUTY_ADMIN & MEMBER
 * tidak melihatnya. Aturan akses server tetap dijaga terpisah di actions.
 */
export function canShowMenu(
  myRole: ProjectRole | null,
  member: TeamMemberRow,
  myUserId: string
): boolean {
  if (myRole !== "ADMIN") return false;
  if (member.id === myUserId) return false;
  if (member.role === "ADMIN") return false;
  return true;
}

