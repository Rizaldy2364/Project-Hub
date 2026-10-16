"use server";

import { revalidatePath } from "next/cache";
import { requireProjectMember, requireUser } from "@/lib/auth-guards";
import { canManageMembers, canViewJoinCode } from "@/lib/permissions";
import {
  listMembersQuerySchema,
  updateMemberRoleSchema,
  removeMemberSchema,
} from "@/lib/validations/team.schema";
import {
  findProjectsForMemberDropdown,
  findProjectMembers,
  countProjectMembersByRole,
  updateProjectMemberRole,
  removeProjectMemberWithUnassign,
} from "@/repositories/team.repository";
import { findProjectMember, findProjectNameById } from "@/repositories/project.repository";
import { findProfileUserById } from "@/repositories/user.repository";

// DAFTAR PROJECT milik user (untuk dropdown).
export async function listMyProjectsForTeamAction() {
  const guard = await requireUser();
  if ("error" in guard) return { error: guard.error, status: guard.status };
  const projects = await findProjectsForMemberDropdown(guard.user.id);
  return { success: true as const, projects };
}

// DAFTAR ANGGOTA + ringkasan + joinCode (hanya untuk ADMIN & MANAGER).
export async function listTeamMembersAction(query: {
  projectId: string;
  role?: string;
  q?: string;
  sort?: string;
  page?: number | string;
  pageSize?: number | string;
}) {
  // (1) Otorisasi — wajib anggota project (401 bila belum login, 403 bila
  // bukan anggota), lewat requireProjectMember dari lib/auth-guards.
  const guard = await requireProjectMember(query?.projectId ?? "");
  if ("error" in guard) return { error: guard.error, status: guard.status };

  // (2) Validasi Zod.
  const parsed = listMembersQuerySchema.safeParse(query);
  if (!parsed.success) return { error: "Parameter tidak valid", status: 400 as const };

  const myRole = guard.membership.role;
  const canViewCode = canViewJoinCode(myRole);

  const [result, summary, project] = await Promise.all([
    findProjectMembers(parsed.data),
    countProjectMembersByRole(parsed.data.projectId),
    // joinCode hanya dibaca dari DB bila role diizinkan melihatnya; untuk
    // MEMBER field ini tidak pernah dibaca apalagi dikirim ke client.
    findProjectNameById({
      projectId: parsed.data.projectId,
      withJoinCode: canViewCode,
    }),
  ]);
  if (!project) return { error: "Project tidak ditemukan", status: 404 as const };

  return {
    success: true as const,
    ...result,
    summary,
    myRole,
    // joinCode hanya untuk ADMIN & MANAGER; untuk MEMBER field ini
    // tidak ikut di payload yang dikirim ke client (bukan sekadar disembunyikan).
    project:
      canViewCode && project.joinCode !== undefined
        ? { id: parsed.data.projectId, name: project.name, joinCode: project.joinCode }
        : { id: parsed.data.projectId, name: project.name },
  };
}

// UBAH PERAN — hanya ADMIN; ditolak dengan 403 bila bukan admin (AGENTS 8.2/9.1;
// di dokumen dikenal sebagai changeMemberRoleAction).
export async function updateMemberRoleAction(input: {
  projectId: string;
  targetUserId: string;
  role: string;
}) {
  // (1) Otorisasi — requireProjectMember (401/403) + canManageMembers (403).
  // Dicek di server sehingga MANAGER/MEMBER/VIEWER tetap ditolak walau action
  // dipanggil langsung dari luar UI.
  const guard = await requireProjectMember(input?.projectId ?? "");
  if ("error" in guard) return { error: guard.error, status: guard.status };
  if (!canManageMembers(guard.membership.role)) {
    return {
      error: "Hanya admin yang boleh mengubah peran anggota",
      status: 403 as const,
    };
  }

  // (2) Validasi Zod — role hanya MANAGER/MEMBER/VIEWER (bukan ADMIN).
  const parsed = updateMemberRoleSchema.safeParse(input);
  if (!parsed.success) return { error: "Parameter tidak valid", status: 400 as const };
  const { projectId, targetUserId, role } = parsed.data;

  // (3) Aturan perubahan peran (AGENTS 8.2) — tolak 422.
  if (targetUserId === guard.user.id) {
    return {
      error: "Admin tidak bisa mengubah perannya sendiri",
      status: 422 as const,
    };
  }

  const target = await findProjectMember(targetUserId, projectId);
  if (!target) {
    return { error: "Anggota tidak ditemukan di project ini", status: 404 as const };
  }
  if (target.role === "ADMIN") {
    return {
      error: "Peran admin tidak bisa diubah lewat fitur ini",
      status: 422 as const,
    };
  }
  // Perpindahan antara MANAGER / MEMBER / VIEWER bebas (AGENTS 8.2).

  // (4) Repositori — transaksi; menjadi VIEWER sekaligus men-unassign task
  // aktif dalam transaksi yang sama; baris ActivityLog ikut transaksi.
  const targetProfile = await findProfileUserById(targetUserId);
  await updateProjectMemberRole({
    projectId,
    targetUserId,
    role,
    activity: {
      userId: guard.user.id,
      projectId,
      action: "MEMBER_ROLE_CHANGED",
      meta: {
        targetUserId,
        targetName: targetProfile?.name ?? "Anggota",
        from: target.role,
        to: role,
      },
    },
  });
  revalidatePath("/tim");
  return { success: true as const };
}

// HAPUS ANGGOTA — hanya ADMIN; ditolak dengan 403 bila bukan admin (AGENTS 8.2/9.1;
// di dokumen dikenal sebagai removeMemberAction).
export async function removeTeamMemberAction(input: {
  projectId: string;
  targetUserId: string;
}) {
  // (1) Otorisasi — requireProjectMember (401/403) + canManageMembers (403).
  // Dicek di server sehingga MANAGER/MEMBER/VIEWER tetap ditolak walau action
  // dipanggil langsung dari luar UI.
  const guard = await requireProjectMember(input?.projectId ?? "");
  if ("error" in guard) return { error: guard.error, status: guard.status };
  if (!canManageMembers(guard.membership.role)) {
    return {
      error: "Hanya admin yang boleh menghapus anggota",
      status: 403 as const,
    };
  }

  // (2) Validasi Zod.
  const parsed = removeMemberSchema.safeParse(input);
  if (!parsed.success) return { error: "Parameter tidak valid", status: 400 as const };
  const { projectId, targetUserId } = parsed.data;

  // (3) Aturan penghapusan (AGENTS 8.2) — tolak 422.
  if (targetUserId === guard.user.id) {
    return {
      error: "Admin tidak bisa menghapus dirinya sendiri",
      status: 422 as const,
    };
  }

  const target = await findProjectMember(targetUserId, projectId);
  if (!target) {
    return { error: "Anggota tidak ditemukan di project ini", status: 404 as const };
  }
  if (target.role === "ADMIN") {
    return {
      error: "Admin tidak bisa dihapus lewat fitur ini",
      status: 422 as const,
    };
  }

  // (4) Repositori — unassign task + hapus membership dalam satu transaksi;
  // baris ActivityLog ikut transaksi yang sama.
  const targetProfile = await findProfileUserById(targetUserId);
  await removeProjectMemberWithUnassign({
    projectId,
    targetUserId,
    activity: {
      userId: guard.user.id,
      projectId,
      action: "MEMBER_REMOVED",
      meta: {
        targetUserId,
        targetName: targetProfile?.name ?? "Anggota",
      },
    },
  });
  revalidatePath("/tim");
  return { success: true as const };
}
