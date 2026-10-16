import type { ProjectRole } from "@/types";

// ===== Task =====

/** Membuat task & menugaskan/mengganti assignee: ADMIN & MANAGER. */
export function canCreateTask(role: ProjectRole): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

/** Mengedit task (judul, deskripsi, due date, prioritas, label): ADMIN & MANAGER. */
export function canEditTask(role: ProjectRole): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

/**
 * Mengubah status task: ADMIN/MANAGER bebas; MEMBER hanya task yang
 * ditugaskan kepadanya; VIEWER tidak bisa sama sekali.
 */
export function canChangeTaskStatus(
  role: ProjectRole,
  isAssignee: boolean
): boolean {
  if (role === "ADMIN" || role === "MANAGER") return true;
  return role === "MEMBER" && isAssignee;
}

/** Menghapus task (soft delete): hanya ADMIN. */
export function canDeleteTask(role: ProjectRole): boolean {
  return role === "ADMIN";
}

/** Boleh menjadi penanggung jawab / muncul di daftar assignee: semua kecuali VIEWER. */
export function canBeAssigned(role: ProjectRole): boolean {
  return role !== "VIEWER";
}

/** Boleh disebut lewat "@" di komentar atau Diskusi: semua kecuali VIEWER. */
export function canBeMentioned(role: ProjectRole): boolean {
  return role !== "VIEWER";
}

// ===== Komentar =====

/** Komentar di task; edit/hapus komentar sendiri: semua kecuali VIEWER. */
export function canComment(role: ProjectRole): boolean {
  return role !== "VIEWER";
}

// ===== Diskusi (chat grup per project) =====

/** Kirim pesan Diskusi: semua kecuali VIEWER. */
export function canSendChatMessage(role: ProjectRole): boolean {
  return role !== "VIEWER";
}

/** Sematkan/lepas pesan: ADMIN & MANAGER. */
export function canPinChatMessage(role: ProjectRole): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

/** Hapus pesan: pembuat pesan sendiri (bukan VIEWER), atau ADMIN untuk moderasi. */
export function canDeleteChatMessage(role: ProjectRole, isOwn: boolean): boolean {
  if (role === "ADMIN") return true;
  if (role === "VIEWER") return false;
  return isOwn;
}

// ===== Anggota & project =====

/** Mengelola anggota (ubah peran / hapus anggota): hanya ADMIN. */
export function canManageMembers(role: ProjectRole): boolean {
  return role === "ADMIN";
}

/** Melihat & menyalin kode gabung: ADMIN & MANAGER. */
export function canViewJoinCode(role: ProjectRole): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

/** Membuat ulang kode gabung, edit info project, hapus project: hanya ADMIN. */
export function canEditProjectSettings(role: ProjectRole): boolean {
  return role === "ADMIN";
}
