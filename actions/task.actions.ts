"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  createTaskSchema,
  updateTaskSchema,
} from "@/lib/validations/task.schema";
import { findProjectMember } from "@/repositories/project.repository";
import { ensureDefaultTaskLists, findTaskListById, findTaskListByProjectAndName } from "@/repositories/list.repository";
import {
  createTask,
  updateTask,
  moveTask,
  softDeleteTask,
  findTaskById,
  countTasksByListId,
} from "@/repositories/task.repository";

// Helper internal — cek user adalah member dari project pemilik task ini
async function getProjectIdAndCheckMembership(userId: string, listId: string) {
  const list = await findTaskListById(listId);
  if (!list) return { error: "List tidak ditemukan" };

  const member = await findProjectMember(userId, list.projectId);
  if (!member) return { error: "Kamu bukan member project ini" };

  return { projectId: list.projectId };
}

// CREATE
export async function createTaskAction(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string") return { error: "Project tidak valid" };

  const member = await findProjectMember(session.user.id, projectId);
  if (!member || member.role !== "ADMIN") {
    return { error: "Hanya admin yang boleh membuat task" };
  }

  await ensureDefaultTaskLists({ projectId });
  const status = formData.get("status");
  const listName = status === "IN_PROGRESS" ? "In Progress" : status === "DONE" ? "Done" : "To Do";
  const targetList = await findTaskListByProjectAndName(projectId, listName);
  if (!targetList) return { error: "Kolom task tidak ditemukan" };

  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    listId: targetList.id,
    assigneeId: formData.get("assigneeId") || undefined,
    status: status || "TODO",
    labelIds: formData.getAll("labelIds").filter((id): id is string => typeof id === "string"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const check = await getProjectIdAndCheckMembership(
    session.user.id,
    parsed.data.listId
  );
  if ("error" in check) return { error: check.error };

  if (check.projectId !== projectId) return { error: "Kolom task tidak sesuai dengan project" };

  const currentCount = await countTasksByListId(parsed.data.listId);

  const task = await createTask({
    title: parsed.data.title,
    description: parsed.data.description,
    dueDate: parsed.data.dueDate,
    listId: parsed.data.listId,
    assigneeId: parsed.data.assigneeId,
    status: parsed.data.status,
    labelIds: parsed.data.labelIds,
    order: currentCount,
  });

  revalidatePath(`/projects/${check.projectId}`);
  return { success: true, taskId: task.id };
}

// UPDATE
export async function updateTaskAction(taskId: string, formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const task = await findTaskById(taskId);
  if (!task) return { error: "Task tidak ditemukan" };

  const check = await getProjectIdAndCheckMembership(session.user.id, task.listId);
  if ("error" in check) return { error: check.error };

  const parsed = updateTaskSchema.safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    status: formData.get("status") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await updateTask(taskId, parsed.data);
  revalidatePath(`/projects/${check.projectId}`);
  return { success: true };
}

// MOVE TASK (drag-and-drop)
export async function moveTaskAction(
  taskId: string,
  newListId: string,
  newOrder: number
) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const check = await getProjectIdAndCheckMembership(session.user.id, newListId);
  if ("error" in check) return { error: check.error };

  await moveTask(taskId, newListId, newOrder);
  revalidatePath(`/projects/${check.projectId}`);
  return { success: true };
}

// DELETE (soft delete)
export async function deleteTaskAction(taskId: string) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const task = await findTaskById(taskId);
  if (!task) return { error: "Task tidak ditemukan" };

  const check = await getProjectIdAndCheckMembership(session.user.id, task.listId);
  if ("error" in check) return { error: check.error };

  await softDeleteTask(taskId);
  revalidatePath(`/projects/${check.projectId}`);
  return { success: true };
}
