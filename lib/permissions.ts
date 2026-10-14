import type { ProjectRole } from "@/types";

/** Hanya ADMIN yang boleh mengelola anggota (ubah peran / hapus anggota). */
export function canManageMembers(role: ProjectRole): boolean {
  return role === "ADMIN";
}

/** ADMIN dan DEPUTY_ADMIN boleh membuat dan menugaskan task. */
export function canCreateTask(role: ProjectRole): boolean {
  return role === "ADMIN" || role === "DEPUTY_ADMIN";
}

/** ADMIN dan DEPUTY_ADMIN boleh melihat & menyalin kode gabung; MEMBER tidak. */
export function canViewJoinCode(role: ProjectRole): boolean {
  return role === "ADMIN" || role === "DEPUTY_ADMIN";
}

// ===== Diskusi (chat grup per project) =====

/** Semua anggota project (ADMIN/DEPUTY_ADMIN/MEMBER) boleh membaca & mengirim pesan Diskusi. */
export function canSendChatMessage(role: ProjectRole): boolean {
  return role === "ADMIN" || role === "DEPUTY_ADMIN" || role === "MEMBER";
}

/** Semut pesan: hanya ADMIN dan DEPUTY_ADMIN (asumsi — lihat ringkasan tugas). */
export function canPinChatMessage(role: ProjectRole): boolean {
  return role === "ADMIN" || role === "DEPUTY_ADMIN";
}

/** Hapus pesan: pembuat pesan sendiri, atau ADMIN untuk moderasi. */
export function canDeleteChatMessage(role: ProjectRole, isOwn: boolean): boolean {
  return isOwn || role === "ADMIN";
}
