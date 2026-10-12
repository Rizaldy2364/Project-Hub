"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { canManageMembers } from "@/lib/permissions";
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
import { findProjectMember } from "@/repositories/project.repository";
import { prisma } from "@/lib/prisma";

async function requireMembership(userId: string, projectId: string) {
  const member = await findProjectMember(userId, projectId);
  if (!member) return { error: "Kamu bukan member project ini" as const };
  return { member };
}

// DAFTAR PROJECT milik user (untuk dropdown).
export async function listMyProjectsForTeamAction() {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };
  const projects = await findProjectsForMemberDropdown(session.user.id);
  return { success: true as const, projects };
}

// DAFTAR ANGGOTA + ringkasan + joinCode (hanya untuk ADMIN).
export async function listTeamMembersAction(query: {
  projectId: string;
  role?: string;
  q?: string;
  sort?: string;
  page?: number | string;
  pageSize?: number | string;
}) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsed = listMembersQuerySchema.safeParse(query);
  if (!parsed.success) return { error: "Parameter tidak valid" };

  const check = await requireMembership(session.user.id, parsed.data.projectId);
  if ("error" in check) return { error: check.error };

  const [result, summary, project] = await Promise.all([
    findProjectMembers(parsed.data),
    countProjectMembersByRole(parsed.data.projectId),
    prisma.project.findUnique({
      where: { id: parsed.data.projectId, deletedAt: null },
      select: { id: true, name: true, joinCode: true },
    }),
  ]);
  if (!project) return { error: "Project tidak ditemukan" };

  const myRole = check.member.role;
  return {
    success: true as const,
    ...result,
    summary,
    myRole,
    project: {
      id: project.id,
      name: project.name,
      joinCode: myRole === "ADMIN" ? project.joinCode : null,
    },
  };
}

// UBAH PERAN — hanya ADMIN; dalam satu transaksi.
export async function updateMemberRoleAction(input: {
  projectId: string;
  targetUserId: string;
  role: string;
}) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsed = updateMemberRoleSchema.safeParse(input);
  if (!parsed.success) return { error: "Parameter tidak valid" };
  const { projectId, targetUserId, role } = parsed.data;

  const check = await requireMembership(session.user.id, projectId);
  if ("error" in check) return { error: check.error };
  if (!canManageMembers(check.member.role)) {
    return { error: "Hanya admin yang boleh mengubah peran anggota" };
  }

  if (targetUserId === session.user.id) {
    return { error: "Admin tidak bisa mengubah perannya sendiri" };
  }

  const target = await findProjectMember(targetUserId, projectId);
  if (!target) return { error: "Anggota tidak ditemukan di project ini" };
  if (target.role === "ADMIN") {
    return { error: "Peran admin tidak bisa diubah lewat fitur ini" };
  }
  // DEPUTY hanya boleh diberikan ke MEMBER, dicabut kembali ke MEMBER.
  if (role === "DEPUTY_ADMIN" && target.role !== "MEMBER") {
    return { error: "Wakil admin hanya bisa diberikan kepada member" };
  }
  if (role === "MEMBER" && target.role !== "DEPUTY_ADMIN") {
    return { error: "Hanya peran wakil admin yang bisa dicabut ke member" };
  }

  await updateProjectMemberRole({ projectId, targetUserId, role });
  revalidatePath("/tim");
  return { success: true as const };
}

// HAPUS ANGGOTA — hanya ADMIN; unassign task + hapus dalam satu transaksi.
export async function removeTeamMemberAction(input: {
  projectId: string;
  targetUserId: string;
}) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsed = removeMemberSchema.safeParse(input);
  if (!parsed.success) return { error: "Parameter tidak valid" };
  const { projectId, targetUserId } = parsed.data;

  const check = await requireMembership(session.user.id, projectId);
  if ("error" in check) return { error: check.error };
  if (!canManageMembers(check.member.role)) {
    return { error: "Hanya admin yang boleh menghapus anggota" };
  }

  if (targetUserId === session.user.id) {
    return { error: "Admin tidak bisa menghapus dirinya sendiri" };
  }

  const target = await findProjectMember(targetUserId, projectId);
  if (!target) return { error: "Anggota tidak ditemukan di project ini" };
  if (target.role === "ADMIN") {
    return { error: "Admin tidak bisa dihapus lewat fitur ini" };
  }

  await removeProjectMemberWithUnassign(projectId, targetUserId);
  revalidatePath("/tim");
  return { success: true as const };
}
