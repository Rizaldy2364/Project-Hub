import type { ProjectRole } from "@/types";

/** Hanya ADMIN yang boleh mengelola anggota (ubah peran / hapus anggota). */
export function canManageMembers(role: ProjectRole): boolean {
  return role === "ADMIN";
}

/** ADMIN dan DEPUTY_ADMIN boleh membuat dan menugaskan task. */
export function canCreateTask(role: ProjectRole): boolean {
  return role === "ADMIN" || role === "DEPUTY_ADMIN";
}
