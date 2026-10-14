import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { startOfDayWib, wibDayDiff, wibDayKey } from "@/lib/utils";
import { overdueTaskSelect } from "@/lib/selects/report.select";
import type {
  ReportData,
  ReportKpi,
  ReportLabelRow,
  ReportMemberProjectRow,
  ReportOverdueTask,
  ReportPriorityRow,
  ReportProjectProgressRow,
  ReportWeeklyPoint,
  ReportWorkloadRow,
} from "@/types";

export interface FindReportInput {
  /** Pemilik laporan — semua query dibatasi project yang diikutinya. */
  userId: string;
  /** null = semua project yang diikuti user. */
  projectId: string | null;
  /** null = semua member; selain itu id user (assignee task). */
  assigneeId: string | null;
  range: 7 | 30 | 90;
}

// Scope dasar: task tidak soft-deleted, list tidak soft-deleted, project tidak
// soft-deleted, dan user adalah member project itu. Filter project/assignee
// opsional. DITULIS EKSPLISIT di setiap query (AGENTS.md Bagian 4).
function scopeTaskWhere(
  userId: string,
  projectId: string | null,
  assigneeId: string | null
): Prisma.TaskWhereInput {
  return {
    deletedAt: null,
    list: {
      deletedAt: null,
      ...(projectId ? { projectId } : {}),
      project: {
        deletedAt: null,
        members: { some: { userId } },
      },
    },
    ...(assigneeId ? { assigneeId } : {}),
  };
}

/**
 * 6 kunci hari "YYYY-MM-DD" (Senin WIB) untuk minggu berjalan + 5 minggu
 * sebelumnya, diurut dari yang paling lama.
 */
export function weekStartKeysWib(now: Date = new Date()): string[] {
  const todayKey = wibDayKey(now);
  const todayAnchor = new Date(`${todayKey}T12:00:00Z`);
  const backToMonday = (todayAnchor.getUTCDay() + 6) % 7; // Senin=0 … Minggu=6
  const monday = new Date(todayAnchor.getTime() - backToMonday * 86_400_000);
  const keys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    keys.push(wibDayKey(new Date(monday.getTime() - i * 7 * 86_400_000)));
  }
  return keys;
}

/** Fragmen SQL scope yang sama untuk semua $queryRaw (soft-delete eksplisit). */
function rawScopeSql(
  userId: string,
  projectId: string | null,
  assigneeId: string | null
) {
  return Prisma.sql`
    FROM "Task" t
    JOIN "TaskList" tl ON tl."id" = t."listId"
    JOIN "Project" p ON p."id" = tl."projectId"
    WHERE t."deletedAt" IS NULL
      AND tl."deletedAt" IS NULL
      AND p."deletedAt" IS NULL
      AND EXISTS (
        SELECT 1 FROM "ProjectMember" pm
        WHERE pm."projectId" = p."id" AND pm."userId" = ${userId}
      )
      ${projectId ? Prisma.sql`AND tl."projectId" = ${projectId}` : Prisma.empty}
      ${assigneeId ? Prisma.sql`AND t."assigneeId" = ${assigneeId}` : Prisma.empty}
  `;
}

// ===================== READ — KPI =====================

async function computeKpi({
  userId,
  projectId,
  assigneeId,
  range,
}: FindReportInput): Promise<ReportKpi> {
  const now = new Date();
  const rangeStart = new Date(now.getTime() - range * 86_400_000);
  const startOfToday = startOfDayWib(now);
  const scope = scopeTaskWhere(userId, projectId, assigneeId);

  const [
    scopeTaskTotal,
    completedInRange,
    completedNow,
    completedPrev,
    createdPrev,
    overdueCount,
  ] = await Promise.all([
    prisma.task.count({ where: scope }),
    prisma.task.count({
      where: { ...scope, completedAt: { gte: rangeStart, lte: now } },
    }),
    // E = now: dasar = semua task scope (createdAt selalu <= now).
    prisma.task.count({ where: { ...scope, completedAt: { not: null } } }),
    // E = now − range: dasar = task yang sudah ada saat itu.
    prisma.task.count({
      where: { ...scope, completedAt: { not: null, lte: rangeStart } },
    }),
    prisma.task.count({ where: { ...scope, createdAt: { lte: rangeStart } } }),
    prisma.task.count({
      where: {
        ...scope,
        status: { not: "DONE" },
        dueDate: { not: null, lt: startOfToday },
      },
    }),
  ]);

  // Tingkat penyelesaian + delta poin persen vs periode lalu.
  const completionRatePercent =
    scopeTaskTotal > 0 ? Math.round((completedNow / scopeTaskTotal) * 100) : null;
  let completionRateDelta: number | null = null;
  if (completionRatePercent !== null && createdPrev > 0) {
    const prevPercent = Math.round((completedPrev / createdPrev) * 100);
    completionRateDelta = completionRatePercent - prevPercent;
  }

  // Rata-rata penyelesaian (dalam hari) — satu query agregat parameterized.
  const avgRows = await prisma.$queryRaw<{ avg_seconds: number | null }[]>(
    Prisma.sql`
      SELECT AVG(EXTRACT(EPOCH FROM (t."completedAt" - t."createdAt")))::float AS avg_seconds
      ${rawScopeSql(userId, projectId, assigneeId)}
        AND t."completedAt" >= ${rangeStart}
        AND t."completedAt" <= ${now}
    `
  );
  const avgSeconds = avgRows[0]?.avg_seconds ?? null;

  return {
    completedInRange,
    scopeTaskTotal,
    completionRatePercent,
    completionRateDelta,
    overdueCount,
    avgCompletionDays: avgSeconds != null ? avgSeconds / 86_400 : null,
  };
}


// ===================== READ — grafik =====================

/** Task selesai per minggu (6 minggu terakhir, Senin WIB) — TIDAK kena filter rentang. */
async function findWeeklyCompleted(
  input: FindReportInput
): Promise<ReportWeeklyPoint[]> {
  const keys = weekStartKeysWib();
  const oldestMonday = new Date(`${keys[0]}T00:00:00+07:00`);

  const rows = await prisma.$queryRaw<{ week: string; count: number }[]>(
    Prisma.sql`
      SELECT to_char(date_trunc('week', t."completedAt" + interval '7 hours'), 'YYYY-MM-DD') AS week,
             COUNT(*)::int AS count
      ${rawScopeSql(input.userId, input.projectId, input.assigneeId)}
        AND t."completedAt" >= ${oldestMonday}
      GROUP BY 1
      ORDER BY 1
    `
  );

  const byWeek = new Map(rows.map((r) => [r.week, r.count]));
  return keys.map((weekStart) => ({
    weekStart,
    count: byWeek.get(weekStart) ?? 0,
  }));
}

/** Distribusi status task dalam scope. */
async function findStatusDistribution(
  input: FindReportInput
): Promise<{ TODO: number; IN_PROGRESS: number; DONE: number; total: number }> {
  const groups = await prisma.task.groupBy({
    by: ["status"],
    where: scopeTaskWhere(input.userId, input.projectId, input.assigneeId),
    _count: { _all: true },
  });
  const byStatus = new Map(groups.map((g) => [g.status, g._count._all]));
  const TODO = byStatus.get("TODO") ?? 0;
  const IN_PROGRESS = byStatus.get("IN_PROGRESS") ?? 0;
  const DONE = byStatus.get("DONE") ?? 0;
  return { TODO, IN_PROGRESS, DONE, total: TODO + IN_PROGRESS + DONE };
}

/** Beban kerja per anggota (top 8 + baris "Tanpa penanggung jawab"). */
async function findWorkloadByMember(
  input: FindReportInput
): Promise<ReportWorkloadRow[]> {
  const groups = await prisma.task.groupBy({
    by: ["assigneeId", "status"],
    where: scopeTaskWhere(input.userId, input.projectId, input.assigneeId),
    _count: { _all: true },
  });

  const byAssignee = new Map<
    string | null,
    { TODO: number; IN_PROGRESS: number; DONE: number; total: number }
  >();
  for (const g of groups) {
    const row = byAssignee.get(g.assigneeId) ?? {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
      total: 0,
    };
    row[g.status] = g._count._all;
    row.total += g._count._all;
    byAssignee.set(g.assigneeId, row);
  }

  const assigneeIds = [...byAssignee.keys()].filter(
    (id): id is string => id !== null
  );
  const users =
    assigneeIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: assigneeIds } },
          select: { id: true, name: true, avatarUrl: true },
        })
      : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const rows: ReportWorkloadRow[] = [];
  let unassigned: ReportWorkloadRow | null = null;
  for (const [assigneeId, counts] of byAssignee) {
    if (assigneeId === null) {
      unassigned = {
        assigneeId: null,
        name: "Tanpa penanggung jawab",
        avatarUrl: null,
        ...counts,
      };
      continue;
    }
    const user = userMap.get(assigneeId);
    if (!user) continue; // user sudah dihapus — lewati
    rows.push({ assigneeId, name: user.name, avatarUrl: user.avatarUrl, ...counts });
  }

  rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "id"));
  const top = rows.slice(0, 8);
  if (unassigned) top.push(unassigned);
  return top;
}


// ===================== READ — tabel & kartu adaptif =====================

/** Progres per project (done/total & persen), urut nama. */
async function findProjectProgress(
  input: FindReportInput
): Promise<ReportProjectProgressRow[]> {
  const rows = await prisma.$queryRaw<
    { project_id: string; project_name: string; total: number; done: number }[]
  >(
    Prisma.sql`
      SELECT p."id" AS project_id,
             p."name" AS project_name,
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE t."status" = 'DONE')::int AS done
      ${rawScopeSql(input.userId, input.projectId, input.assigneeId)}
      GROUP BY p."id", p."name"
      ORDER BY p."name" ASC
    `
  );
  return rows.map((r) => ({
    projectId: r.project_id,
    projectName: r.project_name,
    done: r.done,
    total: r.total,
    percent: r.total > 0 ? Math.round((r.done / r.total) * 100) : 0,
  }));
}

/** Task terlambat (top 10, paling telat dulu). */
async function findOverdueTasks(
  input: FindReportInput
): Promise<ReportOverdueTask[]> {
  const now = new Date();
  const tasks = await prisma.task.findMany({
    where: {
      ...scopeTaskWhere(input.userId, input.projectId, input.assigneeId),
      status: { not: "DONE" },
      dueDate: { not: null, lt: startOfDayWib(now) },
    },
    orderBy: { dueDate: "asc" },
    take: 10,
    select: overdueTaskSelect,
  });

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    projectName: t.list.project.name,
    assignee: t.assignee,
    dueDate: t.dueDate!.toISOString(),
    daysLate: wibDayDiff(t.dueDate!, now),
  }));
}

/** "Task per prioritas" — pengganti "Progres per project" saat scope 1 project. */
async function findPriorityBreakdown(
  input: FindReportInput
): Promise<ReportPriorityRow[]> {
  const groups = await prisma.task.groupBy({
    by: ["priority"],
    where: scopeTaskWhere(input.userId, input.projectId, input.assigneeId),
    _count: { _all: true },
  });
  const total = groups.reduce((sum, g) => sum + g._count._all, 0);
  const labels: Record<"HIGH" | "MEDIUM" | "LOW", string> = {
    HIGH: "Tinggi",
    MEDIUM: "Sedang",
    LOW: "Rendah",
  };
  const byPriority = new Map(groups.map((g) => [g.priority, g._count._all]));
  const order: ("HIGH" | "MEDIUM" | "LOW")[] = ["HIGH", "MEDIUM", "LOW"];
  // Tampilkan hanya prioritas yang punya task.
  return order
    .filter((priority) => (byPriority.get(priority) ?? 0) > 0)
    .map((priority) => {
      const count = byPriority.get(priority) ?? 0;
      return {
        priority,
        label: labels[priority],
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });
}

/** "Task per project" untuk SATU member (batang bertumpuk per status). */
async function findMemberProjectBreakdown(
  input: FindReportInput & { assigneeId: string }
): Promise<ReportMemberProjectRow[]> {
  const rows = await prisma.$queryRaw<
    {
      project_id: string;
      project_name: string;
      todo: number;
      in_progress: number;
      done: number;
      total: number;
    }[]
  >(
    Prisma.sql`
      SELECT p."id" AS project_id,
             p."name" AS project_name,
             COUNT(*) FILTER (WHERE t."status" = 'TODO')::int AS todo,
             COUNT(*) FILTER (WHERE t."status" = 'IN_PROGRESS')::int AS in_progress,
             COUNT(*) FILTER (WHERE t."status" = 'DONE')::int AS done,
             COUNT(*)::int AS total
      ${rawScopeSql(input.userId, input.projectId, input.assigneeId)}
      GROUP BY p."id", p."name"
      ORDER BY p."name" ASC
    `
  );
  return rows.map((r) => ({
    projectId: r.project_id,
    projectName: r.project_name,
    TODO: r.todo,
    IN_PROGRESS: r.in_progress,
    DONE: r.done,
    total: r.total,
  }));
}

/** "Task per label" (top 6) — pengganti saat kartu adaptif hanya berisi 1 baris. */
async function findTopLabels(input: FindReportInput): Promise<ReportLabelRow[]> {
  const rows = await prisma.$queryRaw<
    { label_id: string; name: string; color: string; count: number }[]
  >(
    Prisma.sql`
      SELECT lb."id" AS label_id, lb."name", lb."color", COUNT(*)::int AS count
      FROM "Task" t
      JOIN "TaskList" tl ON tl."id" = t."listId"
      JOIN "Project" p ON p."id" = tl."projectId"
      JOIN "_TaskLabels" tlbl ON tlbl."B" = t."id"
      JOIN "Label" lb ON lb."id" = tlbl."A"
      WHERE t."deletedAt" IS NULL
        AND tl."deletedAt" IS NULL
        AND p."deletedAt" IS NULL
        AND lb."deletedAt" IS NULL
        AND EXISTS (
          SELECT 1 FROM "ProjectMember" pm
          WHERE pm."projectId" = p."id" AND pm."userId" = ${input.userId}
        )
        ${input.projectId ? Prisma.sql`AND tl."projectId" = ${input.projectId}` : Prisma.empty}
        ${input.assigneeId ? Prisma.sql`AND t."assigneeId" = ${input.assigneeId}` : Prisma.empty}
      GROUP BY lb."id", lb."name", lb."color"
      ORDER BY count DESC, lb."name" ASC
      LIMIT 6
    `
  );
  return rows.map((r) => ({
    labelId: r.label_id,
    name: r.name,
    color: r.color,
    count: r.count,
  }));
}

/** Jumlah project dalam scope (user adalah member, tidak soft-deleted). */
function countScopeProjects(userId: string, projectId: string | null) {
  return prisma.project.count({
    where: {
      deletedAt: null,
      members: { some: { userId } },
      ...(projectId ? { id: projectId } : {}),
    },
  });
}

// ===================== READ — orkestrasi =====================

/**
 * Satu fungsi baca untuk halaman /laporan: KPI + grafik + tabel dalam query
 * agregat (groupBy/count/$queryRaw), tanpa loop per baris dan tanpa N+1.
 * Semua batas hari/minggu dihitung dalam WIB; penyimpanan tetap UTC.
 */
export async function findReportData(input: FindReportInput): Promise<ReportData> {
  const [kpi, weekly, status, scopeProjectCount, memberBasis] = await Promise.all([
    computeKpi(input),
    findWeeklyCompleted(input),
    findStatusDistribution(input),
    countScopeProjects(input.userId, input.projectId),
    input.assigneeId
      ? // Filter member tunggal → kartu kanan jadi "Task per project" orang itu.
        findMemberProjectBreakdown({ ...input, assigneeId: input.assigneeId })
      : findWorkloadByMember(input),
  ]);

  // Kartu kanan (Beban kerja anggota → adaptif).
  let workloadCard: ReportData["workloadCard"];
  if (input.assigneeId) {
    const rows = memberBasis as ReportMemberProjectRow[];
    workloadCard =
      rows.length === 1
        ? { kind: "labels", rows: await findTopLabels(input) }
        : { kind: "member-projects", rows };
  } else {
    workloadCard = { kind: "workload", rows: memberBasis as ReportWorkloadRow[] };
  }

  // Kartu kiri (Progres per project → "Task per prioritas" saat scope 1 project).
  let progressCard: ReportData["progressCard"];
  if (scopeProjectCount === 1) {
    progressCard = { kind: "priority", rows: await findPriorityBreakdown(input) };
  } else {
    progressCard = { kind: "projects", rows: await findProjectProgress(input) };
  }

  const overdueTasks = await findOverdueTasks(input);

  return { kpi, weekly, status, workloadCard, progressCard, overdueTasks };
}

