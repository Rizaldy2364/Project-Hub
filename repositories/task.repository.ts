import { prisma } from "@/lib/prisma";
import { calendarTaskSelect, myTaskSelect } from "@/lib/selects/task.select";
import type { CalendarTask, MyTasksProjectGroup } from "@/types";

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: Date;
  completedAt?: Date | null;
  listId: string;
  assigneeId?: string;
  status?: "TODO" | "IN_PROGRESS" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  labelIds?: string[];
  order: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: Date | null;
  completedAt?: Date | null;
  status?: "TODO" | "IN_PROGRESS" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  assigneeId?: string | null;
}

export interface TaskFilterParams {
  projectId: string;
  search?: string;
  assigneeId?: string;
  labelId?: string;
  status?: "TODO" | "IN_PROGRESS" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH";
}

// CREATE
export async function createTask(data: CreateTaskInput) {
  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      completedAt: data.completedAt,
      listId: data.listId,
      assigneeId: data.assigneeId,
      status: data.status,
      priority: data.priority,
      order: data.order,
      ...(data.labelIds?.length && { labels: { connect: data.labelIds.map((id) => ({ id })) } }),
    },
  });
}

// READ
export async function findTaskById(id: string) {
  return prisma.task.findUnique({
    where: { id, deletedAt: null },
  });
}

export async function findTasksByListId(listId: string) {
  return prisma.task.findMany({
    where: { listId, deletedAt: null },
    orderBy: { order: "asc" },
  });
}

export async function countTasksByListId(listId: string) {
  return prisma.task.count({
    where: { listId, deletedAt: null },
  });
}

// UPDATE
export async function updateTask(id: string, data: UpdateTaskInput) {
  return prisma.task.update({
    where: { id },
    data,
  });
}

// MOVE TASK — pindah ke list lain dan/atau ubah urutan (buat drag-and-drop)
export async function moveTask(
  taskId: string,
  newListId: string,
  newOrder: number
) {
  return prisma.task.update({
    where: { id: taskId },
    data: {
      listId: newListId,
      order: newOrder,
    },
  });
}

// SEARCH & FILTER
export async function findTasksWithFilters(params: TaskFilterParams) {
  return prisma.task.findMany({
    where: {
      deletedAt: null,
      list: {
        projectId: params.projectId,
      },
      ...(params.search && {
        title: {
          contains: params.search,
          mode: "insensitive",
        },
      }),
      ...(params.assigneeId && {
        assigneeId: params.assigneeId,
      }),
      ...(params.labelId && {
        labels: {
          some: { id: params.labelId },
        },
      }),
      ...(params.status && {
        status: params.status,
      }),
      ...(params.priority && {
        priority: params.priority,
      }),
    },
    orderBy: { order: "asc" },
    include: {
      assignee: {
        select: { id: true, name: true, avatarUrl: true },
      },
      labels: {
        select: { id: true, name: true, color: true },
      },
    },
  });
}

// TASK PROJECT — semua task dari project yang diikuti user, dikelompokkan per project
export async function findMyTasksByUserId(
  userId: string
): Promise<MyTasksProjectGroup[]> {
  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      list: {
        deletedAt: null,
        project: {
          deletedAt: null,
          members: { some: { userId } },
        },
      },
    },
    orderBy: [{ dueDate: "asc" }, { order: "asc" }],
    select: myTaskSelect,
  });

  const groups = new Map<string, MyTasksProjectGroup>();
  for (const task of tasks) {
    const project = task.list.project;
    let group = groups.get(project.id);
    if (!group) {
      group = {
        id: project.id,
        name: project.name,
        description: project.description,
        tasks: [],
        taskTotal: 0,
        taskDone: 0,
      };
      groups.set(project.id, group);
    }
    group.tasks.push({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString() ?? null,
      assignee: task.assignee,
      labels: task.labels,
      commentCount: 0,
      projectId: project.id,
      projectName: project.name,
      projectDescription: project.description,
    });
    group.taskTotal += 1;
    if (task.status === "DONE") group.taskDone += 1;
  }

  return [...groups.values()];
}

// KALENDER — semua task yang punya due date dari project yang diikuti user
export interface FindCalendarTasksInput {
  userId: string;
  /** Filter project (dropdown di halaman kalender); kosong = semua project. */
  projectId?: string;
}

export async function findCalendarTasksByUserId({
  userId,
  projectId,
}: FindCalendarTasksInput): Promise<CalendarTask[]> {
  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      dueDate: { not: null },
      list: {
        deletedAt: null,
        ...(projectId ? { projectId } : {}),
        project: {
          deletedAt: null,
          members: { some: { userId } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
    select: calendarTaskSelect,
  });

  return tasks.map((task) => {
    const project = task.list.project;
    const membership = project.members.find((m) => m.userId === userId);
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate!.toISOString(),
      assignee: task.assignee,
      labels: task.labels,
      commentCount: task._count.comments,
      projectId: project.id,
      projectName: project.name,
      isAdmin: membership?.role === "ADMIN",
    };
  });
}


// SOFT DELETE
export async function softDeleteTask(id: string) {
  return prisma.task.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

//hitung task yang di tugaskan ke user 
export async function countAssignedTasks(userId: string) {
  const activeScope = {
    assigneeId: userId,
    deletedAt: null,
    list: { deletedAt: null, project: { deletedAt: null } },
  };

  const [pending, done] = await Promise.all([
    prisma.task.count({
      where: { ...activeScope, status: { not: "DONE" as const } },
    }),
    prisma.task.count({
      where: { ...activeScope, status: "DONE" as const },
    }),
  ]);

  return { pending, done };
}
