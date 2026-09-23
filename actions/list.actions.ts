"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createTaskListSchema } from "@/lib/validations/task.schema";
import { findProjectMember } from "@/repositories/project.repository";
import {
  createTaskList,
  updateTaskList,
  softDeleteTaskList,
  findTaskListById,
  countTaskListsByProjectId,
} from "@/repositories/list.repository";

// CREATE
export async function createTaskListAction(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsed = createTaskListSchema.safeParse({
    name: formData.get("name"),
    projectId: formData.get("projectId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const member = await findProjectMember(session.user.id, parsed.data.projectId);
  if (!member) {
    return { error: "Kamu bukan member project ini" };
  }

  const currentCount = await countTaskListsByProjectId(parsed.data.projectId);

  const list = await createTaskList({
    name: parsed.data.name,
    projectId: parsed.data.projectId,
    order: currentCount, // otomatis taruh di urutan paling akhir
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true, listId: list.id };
}

// UPDATE (rename list)
export async function updateTaskListAction(listId: string, name: string) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const list = await findTaskListById(listId);
  if (!list) return { error: "List tidak ditemukan" };

  const member = await findProjectMember(session.user.id, list.projectId);
  if (!member) return { error: "Kamu bukan member project ini" };

  await updateTaskList(listId, { name });
  revalidatePath(`/projects/${list.projectId}`);
  return { success: true };
}

// DELETE (soft delete)
export async function deleteTaskListAction(listId: string) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const list = await findTaskListById(listId);
  if (!list) return { error: "List tidak ditemukan" };

  const member = await findProjectMember(session.user.id, list.projectId);
  if (!member) return { error: "Kamu bukan member project ini" };

  await softDeleteTaskList(listId);
  revalidatePath(`/projects/${list.projectId}`);
  return { success: true };
}