import { z } from "zod";

export const createTaskListSchema = z.object({
  name: z.string().min(1, "Nama list wajib diisi").max(50, "Maksimal 50 karakter"),
  projectId: z.string().cuid(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200, "Maksimal 200 karakter"),
  description: z.string().max(2000, "Maksimal 2000 karakter").optional(),
  dueDate: z.coerce.date().optional(),
  listId: z.string().cuid(),
  assigneeId: z.string().cuid().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  dueDate: z.coerce.date().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  assigneeId: z.string().cuid().optional().nullable(),
});

export const moveTaskSchema = z.object({
  taskId: z.string().cuid(),
  newListId: z.string().cuid(),
  newOrder: z.number().int().min(0),
});

export type CreateTaskListInput = z.infer<typeof createTaskListSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;