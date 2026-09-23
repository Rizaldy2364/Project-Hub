"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createLabelSchema } from "@/lib/validations/label.schema";
import { findProjectMember } from "@/repositories/project.repository";
import {
  createLabel,
  updateLabel,
  softDeleteLabel,
  findLabelById,
  assignLabelToTask,
  unassignLabelFromTask,
} from "@/repositories/label.repository";

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

  const member = await findProjectMember(session.user.id, parsed.data.projectId);
  if (!member) return { error: "Kamu bukan member project ini" };

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

  const member = await findProjectMember(session.user.id, label.projectId);
  if (!member) return { error: "Kamu bukan member project ini" };

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

  const member = await findProjectMember(session.user.id, label.projectId);
  if (!member) return { error: "Kamu bukan member project ini" };

  await softDeleteLabel(labelId);
  revalidatePath(`/projects/${label.projectId}`);
  return { success: true };
}

// ASSIGN / UNASSIGN ke task
export async function toggleLabelOnTaskAction(
  taskId: string,
  labelId: string,
  action: "assign" | "unassign"
) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  if (action === "assign") {
    await assignLabelToTask(taskId, labelId);
  } else {
    await unassignLabelFromTask(taskId, labelId);
  }

  return { success: true };
}