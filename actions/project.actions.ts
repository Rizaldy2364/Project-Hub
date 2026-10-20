"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  createProjectSchema,
  deleteProjectConfirmSchema,
  joinProjectSchema,
} from "@/lib/validations/project.schema";
import {
  createProject,
  createProjectMember,
  findProjectByJoinCode,
  findProjectMember,
  regenerateProjectJoinCode,
  setProjectJoinEnabled,
  softDeleteProjectIfNameMatches,
  updateProject,
  removeProjectMember,
} from "@/repositories/project.repository";
import { createManyNotifications } from "@/repositories/notification.repository";
import { ensureDefaultTaskLists } from "@/repositories/list.repository";
import { createMessage } from "@/repositories/message.repository";
import {
  canEditProjectSettings,
  canManageMembers,
} from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

// PESAN SISTEM — dicatat ke Diskusi saat project dibuat / anggota bergabung.
// Kegagalan TIDAK PERNAH menggagalkan aksi utama (dicek di tempat pemanggil).
async function logSystemMessage(
  projectId: string,
  userId: string,
  content: string
) {
  try {
    await createMessage({ projectId, userId, content, kind: "SYSTEM" });
  } catch (error) {
    console.error("[project] gagal membuat pesan sistem:", error);
  }
}

// CREATE PROJECT
export async function createProjectAction(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const project = await createProject({
    name: parsed.data.name,
    description: parsed.data.description,
    ownerId: session.user.id,
  });
  await ensureDefaultTaskLists({ projectId: project.id });

  // PESAN SISTEM — "{nama} membuat project {project}".
  await logSystemMessage(
    project.id,
    session.user.id,
    `${session.user.name ?? "Seseorang"} membuat project ${parsed.data.name}`
  );

  // ACTIVITAS — PROJECT_CREATED (kegagalan logging tidak menggagalkan aksi).
  await logActivity({
    userId: session.user.id,
    projectId: project.id,
    action: "PROJECT_CREATED",
    meta: { title: parsed.data.name },
  });

  revalidatePath("/dashboard");
  return { success: true, projectId: project.id };
}

// JOIN PROJECT
export async function joinProjectAction(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const rateLimit = checkRateLimit(`join:${session.user.id}`);
  if (!rateLimit.allowed) {
    return { error: "Terlalu banyak percobaan, coba lagi nanti" };
  }

  const parsed = joinProjectSchema.safeParse({
    joinCode: formData.get("joinCode"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const project = await findProjectByJoinCode(parsed.data.joinCode);
  if (!project) {
    return { error: "Kode tidak valid" };
  }

  // Saklar "Izinkan bergabung lewat kode" (Pengaturan → Kode gabung). Hanya
  // ADMIN yang bisa mematikannya; pesan tidak membocorkan info lain.
  if (!project.joinEnabled) {
    return { error: "Pendaftaran anggota project ini sedang ditutup" };
  }

  const existingMember = await findProjectMember(session.user.id, project.id);
  if (existingMember) {
    return { error: "Kamu sudah tergabung di project ini" };
  }

  await createProjectMember({
    userId: session.user.id,
    projectId: project.id,
    role: "MEMBER",
  });

  // PESAN SISTEM — "{nama} bergabung ke project lewat kode gabung".
  await logSystemMessage(
    project.id,
    session.user.id,
    `${session.user.name ?? "Seseorang"} bergabung ke project lewat kode gabung`
  );

  // MEMBER_JOINED — penerima = semua ADMIN project (kecuali user itu sendiri).
  const admins = await prisma.projectMember.findMany({
    where: { projectId: project.id, role: "ADMIN", userId: { not: session.user.id } },
    select: { userId: true },
  });
  await createManyNotifications(
    admins.map((a) => ({
      type: "MEMBER_JOINED" as const,
      userId: a.userId,
      actorId: session.user.id,
      projectId: project.id,
    }))
  );

  // ACTIVITAS — MEMBER_JOINED (kegagalan logging tidak menggagalkan aksi).
  await logActivity({
    userId: session.user.id,
    projectId: project.id,
    action: "MEMBER_JOINED",
    meta: { projectName: project.name },
  });

  revalidatePath("/dashboard");
  return { success: true, projectId: project.id };
}

// UPDATE PROJECT (Admin only) — Umum: nama & deskripsi.
export async function updateProjectAction(
  projectId: string,
  formData: FormData
) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const member = await findProjectMember(session.user.id, projectId);
  if (!member || !canEditProjectSettings(member.role)) {
    return { error: "Tidak punya izin" };
  }

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await updateProject(projectId, parsed.data);

  // Segarkan header project (nama), semua tab project, daftar Project Saya,
  // dan dashboard (kartu project menampilkan nama yang sama).
  revalidatePath("/projects/[projectId]", "layout");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true };
}

// REGENERATE JOIN CODE (Admin only)
export async function regenerateJoinCodeAction(projectId: string) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const member = await findProjectMember(session.user.id, projectId);
  if (!member || !canEditProjectSettings(member.role)) {
    return { error: "Tidak punya izin" };
  }

  const updated = await regenerateProjectJoinCode(projectId);
  // Chip kode di header project & kartu Project Saya ikut diperbarui.
  revalidatePath("/projects/[projectId]", "layout");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true, joinCode: updated.joinCode };
}

// SAKLAR JOIN ENABLED (Admin only) — "Izinkan bergabung lewat kode".
export async function setJoinEnabledAction(projectId: string, enabled: boolean) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const member = await findProjectMember(session.user.id, projectId);
  if (!member || !canEditProjectSettings(member.role)) {
    return { error: "Tidak punya izin" };
  }

  if (typeof enabled !== "boolean") {
    return { error: "Parameter tidak valid" };
  }

  await setProjectJoinEnabled(projectId, enabled);
  return { success: true };
}

// DELETE PROJECT (Admin only, soft delete) — nama project harus diketik ulang
// dan diverifikasi ulang di server (Zod + cek persis di dalam transaksi).
// Setelah sukses: redirect ke /projects dengan flag toast ?terhapus=1.
export async function deleteProjectAction(projectId: string, formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const member = await findProjectMember(session.user.id, projectId);
  if (!member || !canEditProjectSettings(member.role)) {
    return { error: "Tidak punya izin" };
  }

  const parsed = deleteProjectConfirmSchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const deleted = await softDeleteProjectIfNameMatches(
    projectId,
    parsed.data.name.trim()
  );
  if (!deleted) {
    return { error: "Nama project tidak sesuai" };
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/tim");
  // Post-redirect toast: ?terhapus=1 dibaca sekali oleh halaman /projects.
  redirect("/projects?terhapus=1");
}


// REMOVE MEMBER (Admin only)
export async function removeProjectMemberAction(projectId: string, targetUserId: string) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const member = await findProjectMember(session.user.id, projectId);
  if (!member || !canManageMembers(member.role)) {
    return { error: "Hanya admin yang boleh menendang member" };
  }

  // Admin cant kick themselves here, or maybe they can? Safest to prevent.
  if (session.user.id === targetUserId) {
    return { error: "Anda tidak bisa menendang diri sendiri" };
  }

  await removeProjectMember(targetUserId, projectId);
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
