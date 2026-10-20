"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLabelSchema, updateLabelSchema } from "@/lib/validations/label.schema";
import { findProjectMember } from "@/repositories/project.repository";
import { requireProjectMember } from "@/lib/auth-guards";
import { findTaskById } from "@/repositories/task.repository";
import { findTaskListById } from "@/repositories/list.repository";
import { canEditProjectSettings, canEditTask } from "@/lib/permissions";
import {
  createLabel,
  updateLabel,
  softDeleteLabel,
  findLabelById,
  assignLabelToTask,
  unassignLabelFromTask,
} from "@/repositories/label.repository";

// Helper internal — cek anggota project pemilik label; VIEWER ditolak
// (matriks 8.2 — label adalah mutasi, viewer hanya membaca).
async function checkLabelManageable(userId: string, projectId: string) {
  const member = await findProjectMember(userId, projectId);
  if (!member) return { error: "Kamu bukan member project ini" };
  if (member.role === "VIEWER") {
    return { error: "Kamu hanya bisa melihat project ini" };
  }
  return {};
}

// CREATE
export async function createLabelAction(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsed = createLabelSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
    projectId: formData.get("projectId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const check = await checkLabelManageable(
    session.user.id,
    parsed.data.projectId
  );
  if ("error" in check) return { error: check.error };

  // Guard: tolak nama label duplikat (case-insensitive, trim, project yang sama).
  const existing = await prisma.label.findFirst({
    where: {
      projectId: parsed.data.projectId,
      deletedAt: null,
      name: {
        equals: parsed.data.name.trim(),
        mode: "insensitive",
      },
    },
  });
  if (existing) {
    return { error: "Label dengan nama itu sudah ada" };
  }

  const label = await createLabel(parsed.data);
  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true, labelId: label.id };
}

// UPDATE
export async function updateLabelAction(
  labelId: string,
  data: { name?: string; color?: string }
) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const label = await findLabelById(labelId);
  if (!label) return { error: "Label tidak ditemukan" };

  const check = await checkLabelManageable(session.user.id, label.projectId);
  if ("error" in check) return { error: check.error };

  // Guard rename: tolak nama label duplikat (case-insensitive, trim, project
  // yang sama, kecuali label itu sendiri).
  if (data.name !== undefined) {
    const existing = await prisma.label.findFirst({
      where: {
        projectId: label.projectId,
        deletedAt: null,
        id: { not: labelId },
        name: {
          equals: data.name.trim(),
          mode: "insensitive",
        },
      },
    });
    if (existing) {
      return { error: "Label dengan nama itu sudah ada" };
    }
  }

  await updateLabel(labelId, data);
  revalidatePath(`/projects/${label.projectId}`);
  return { success: true };
}

// DELETE
export async function deleteLabelAction(labelId: string) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const label = await findLabelById(labelId);
  if (!label) return { error: "Label tidak ditemukan" };

  const check = await checkLabelManageable(session.user.id, label.projectId);
  if ("error" in check) return { error: check.error };

  await softDeleteLabel(labelId);
  revalidatePath(`/projects/${label.projectId}`);
  return { success: true };
}

// ===== Varian ADMIN-only — panel Pengaturan → Label (matriks 8.2: mengelola
// label hanya ADMIN). Action lama di atas TIDAK diubah karena dipakai ulang di
// form task (inline label); ketiganya tetap menolak VIEWER di sana. =====

async function requireProjectAdmin(projectId: string) {
  const guard = await requireProjectMember(projectId);
  if ("error" in guard) {
    return { error: guard.error, status: guard.status };
  }
  if (!canEditProjectSettings(guard.membership.role)) {
    return { error: "Tidak punya izin", status: 403 as const };
  }
  return { userId: guard.user.id };
}

/** Guard nama duplikat (case-insensitive, trim, per project) — dipakai create & update. */
async function assertLabelNameAvailable(
  projectId: string,
  name: string,
  excludeLabelId?: string
) {
  const existing = await prisma.label.findFirst({
    where: {
      projectId,
      deletedAt: null,
      ...(excludeLabelId ? { id: { not: excludeLabelId } } : {}),
      name: { equals: name.trim(), mode: "insensitive" },
    },
    select: { id: true },
  });
  return existing === null;
}

// CREATE (ADMIN only)
// Input eksplisit (bukan FormData) supaya pemanggil client tidak perlu
// menyisipkan hidden input; validasi tetap Zod di server.
export async function adminCreateLabelAction(
  projectId: string,
  data: { name: string; color: string }
) {
  const parsed = createLabelSchema.safeParse({
    name: data.name,
    color: data.color,
    projectId,
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const authCheck = await requireProjectAdmin(parsed.data.projectId);
  if ("error" in authCheck) return { error: authCheck.error };

  if (!(await assertLabelNameAvailable(parsed.data.projectId, parsed.data.name))) {
    return { error: "Label dengan nama itu sudah ada" };
  }

  const label = await createLabel({
    name: parsed.data.name.trim(),
    color: parsed.data.color,
    projectId: parsed.data.projectId,
  });
  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true, labelId: label.id };
}

// UPDATE (ADMIN only)
export async function adminUpdateLabelAction(
  labelId: string,
  data: { name?: string; color?: string }
) {
  const label = await findLabelById(labelId);
  if (!label) return { error: "Label tidak ditemukan" };

  const authCheck = await requireProjectAdmin(label.projectId);
  if ("error" in authCheck) return { error: authCheck.error };

  const parsed = updateLabelSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  if (
    parsed.data.name !== undefined &&
    !(await assertLabelNameAvailable(label.projectId, parsed.data.name, labelId))
  ) {
    return { error: "Label dengan nama itu sudah ada" };
  }

  await updateLabel(labelId, {
    ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
    ...(parsed.data.color !== undefined ? { color: parsed.data.color } : {}),
  });
  revalidatePath(`/projects/${label.projectId}`);
  return { success: true };
}

// DELETE (ADMIN only, soft delete)
export async function adminDeleteLabelAction(labelId: string) {
  const label = await findLabelById(labelId);
  if (!label) return { error: "Label tidak ditemukan" };

  const authCheck = await requireProjectAdmin(label.projectId);
  if ("error" in authCheck) return { error: authCheck.error };

  await softDeleteLabel(labelId);
  revalidatePath(`/projects/${label.projectId}`);
  return { success: true };
}

// ASSIGN / UNASSIGN ke task — edit task = ADMIN/MANAGER saja (matriks 8.2).
export async function toggleLabelOnTaskAction(
  taskId: string,
  labelId: string,
  action: "assign" | "unassign"
) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const task = await findTaskById(taskId);
  if (!task) return { error: "Task tidak ditemukan" };
  const list = await findTaskListById(task.listId);
  if (!list) return { error: "List tidak ditemukan" };

  const member = await findProjectMember(session.user.id, list.projectId);
  if (!member) return { error: "Kamu bukan member project ini" };
  if (!canEditTask(member.role)) {
    return {
      error:
        member.role === "VIEWER"
          ? "Kamu hanya bisa melihat project ini"
          : "Hanya admin dan manager yang boleh mengubah label task",
    };
  }

  if (action === "assign") {
    await assignLabelToTask(taskId, labelId);
  } else {
    await unassignLabelFromTask(taskId, labelId);
  }

  return { success: true };
}