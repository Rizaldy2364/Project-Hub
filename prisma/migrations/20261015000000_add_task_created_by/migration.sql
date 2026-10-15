-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "createdById" TEXT;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: pembuat task lama diambil dari log ActivityLog TASK_CREATED yang
-- terawal per task (userId-nya). Bila tidak ada log, biarkan NULL (fallback
-- pemberitahuan komentar akan memakai ADMIN/WAKIL ADMIN project).
UPDATE "Task" AS t
SET "createdById" = al."userId"
FROM (
  SELECT DISTINCT ON ("taskId") "taskId", "userId"
  FROM "ActivityLog"
  WHERE "action" = 'TASK_CREATED' AND "taskId" IS NOT NULL
  ORDER BY "taskId", "createdAt" ASC
) AS al
WHERE t."createdById" IS NULL
  AND al."taskId" = t."id";
