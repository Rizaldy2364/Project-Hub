"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  createProjectSchema,
  joinProjectSchema,
} from "@/lib/validations/project.schema";
import {
  createProject,
  createProjectMember,
  findProjectByJoinCode,
  findProjectById,
  findProjectMember,
  regenerateProjectJoinCode,
  softDeleteProject,
  updateProject,
} from "@/repositories/project.repository";
import { ensureDefaultTaskLists } from "@/repositories/list.repository";

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

  const existingMember = await findProjectMember(session.user.id, project.id);
  if (existingMember) {
    return { error: "Kamu sudah tergabung di project ini" };
  }

  await createProjectMember({
    userId: session.user.id,
    projectId: project.id,
    role: "MEMBER",
  });

  revalidatePath("/dashboard");
  return { success: true, projectId: project.id };
}

// UPDATE PROJECT (Admin only)
export async function updateProjectAction(
  projectId: string,
  formData: FormData
) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const member = await findProjectMember(session.user.id, projectId);
  if (!member || member.role !== "ADMIN") {
    return { error: "Hanya admin yang boleh mengubah project" };
  }

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await updateProject(projectId, parsed.data);
  revalidatePath(`/projects/${projectId}/settings`);
  return { success: true };
}

// REGENERATE JOIN CODE (Admin only)
export async function regenerateJoinCodeAction(projectId: string) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const member = await findProjectMember(session.user.id, projectId);
  if (!member || member.role !== "ADMIN") {
    return { error: "Hanya admin yang boleh regenerate code" };
  }

  const updated = await regenerateProjectJoinCode(projectId);
  revalidatePath(`/projects/${projectId}/settings`);
  return { success: true, joinCode: updated.joinCode };
}

// DELETE PROJECT (Admin only, soft delete)
export async function deleteProjectAction(projectId: string) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const member = await findProjectMember(session.user.id, projectId);
  if (!member || member.role !== "ADMIN") {
    return { error: "Hanya admin yang boleh menghapus project" };
  }

  await softDeleteProject(projectId);
  revalidatePath("/dashboard");
  return { success: true };
}
