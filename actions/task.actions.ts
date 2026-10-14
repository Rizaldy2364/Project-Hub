"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  createTaskSchema,
  updateTaskSchema,
} from "@/lib/validations/task.schema";
import { findProjectMember } from "@/repositories/project.repository";
import { canCreateTask } from "@/lib/permissions";
import { ensureDefaultTaskLists, findTaskListById, findTaskListByProjectAndName } from "@/repositories/list.repository";
import {
  createTask,
  updateTask,
  moveTask,
  softDeleteTask,
  findTaskById,
  countTasksByListId,
} from "@/repositories/task.repository";
import { createNotification } from "@/repositories/notification.repository";
import { logActivity } from "@/lib/activity";
import { resolveCompletedAt } from "@/lib/completed-at";

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
  if (!member || !canCreateTask(member.role)) {
    return { error: "Hanya admin dan wakil admin yang boleh membuat task" };
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
    priority: formData.get("priority") || undefined,
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

  // ATURAN completedAt — membuat task langsung DONE langsung dapat timestamp.
  const completedAt = resolveCompletedAt({ nextStatus: parsed.data.status });

  const task = await createTask({
    title: parsed.data.title,
    description: parsed.data.description,
    dueDate: parsed.data.dueDate,
    completedAt,
    listId: parsed.data.listId,
    assigneeId: parsed.data.assigneeId,
    status: parsed.data.status,
    priority: parsed.data.priority,
    labelIds: parsed.data.labelIds,
    order: currentCount,
  });

  // TASK_ASSIGNED (create) — penerima = assignee baru, skip jika actor = assignee.
  if (parsed.data.assigneeId && parsed.data.assigneeId !== session.user.id) {
    await createNotification({
      type: "TASK_ASSIGNED",
      userId: parsed.data.assigneeId,
      actorId: session.user.id,
      projectId,
      taskId: task.id,
    });
  }

  // ACTIVITAS — TASK_CREATED (kegagalan logging tidak menggagalkan aksi).
  await logActivity({
    userId: session.user.id,
    projectId: check.projectId,
    taskId: task.id,
    action: "TASK_CREATED",
    meta: { title: task.title },
  });

  revalidatePath(`/projects/${check.projectId}`);
  revalidatePath("/tasks");
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
    priority: formData.get("priority") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // ATURAN completedAt — SATU aturan untuk semua jalur yang menulis status
  // (edit form, checkbox di /tasks & board, dll): menjadi DONE → isi timestamp;
  // DONE kembali ke status lain → null; tetap DONE → biarkan.
  const completedAt = resolveCompletedAt({
    currentStatus: task.status,
    currentCompletedAt: task.completedAt,
    nextStatus: parsed.data.status ?? task.status,
  });

  await updateTask(taskId, {
    ...parsed.data,
    ...(completedAt !== undefined ? { completedAt } : {}),
  });

  // ACTIVITAS — TASK_COMPLETED bila status berubah menjadi DONE; selain itu
  // TASK_UPDATED untuk judul/tenggat/prioritas/penanggung jawab/status berubah.
  const changed: string[] = [];
  if (parsed.data.title !== undefined && parsed.data.title !== task.title)
    changed.push("title");
  if (parsed.data.priority !== undefined && parsed.data.priority !== task.priority)
    changed.push("priority");
  const statusChanged =
    parsed.data.status !== undefined && parsed.data.status !== task.status;
  if (statusChanged) changed.push("status");
  if (parsed.data.dueDate !== undefined) {
    const nextDue = parsed.data.dueDate?.getTime() ?? null;
    if (nextDue !== (task.dueDate?.getTime() ?? null)) changed.push("dueDate");
  }
  if (
    parsed.data.assigneeId !== undefined &&
    parsed.data.assigneeId !== task.assigneeId
  )
    changed.push("assignee");

  if (changed.length > 0) {
    const becameDone = statusChanged && parsed.data.status === "DONE";
    await logActivity({
      userId: session.user.id,
      projectId: check.projectId,
      taskId,
      action: becameDone ? "TASK_COMPLETED" : "TASK_UPDATED",
      meta: {
        title: task.title, // snapshot judul sebelum perubahan
        kind: becameDone ? "completed" : statusChanged ? "status" : "edit",
        ...(statusChanged
          ? { from: task.status, to: parsed.data.status }
          : {}),
      },
    });
  }

  // TASK_ASSIGNED (ganti assignee) — hanya saat assignee diisi/diganti.
  const nextAssignee = parsed.data.assigneeId;
  if (nextAssignee && nextAssignee !== task.assigneeId && nextAssignee !== session.user.id) {
    await createNotification({
      type: "TASK_ASSIGNED",
      userId: nextAssignee,
      actorId: session.user.id,
      projectId: check.projectId,
      taskId,
    });
  }

  revalidatePath(`/projects/${check.projectId}`);
  revalidatePath("/tasks");
  revalidatePath("/calendar");
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
  revalidatePath("/tasks");
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
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  return { success: true };
}
