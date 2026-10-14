-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Task_completedAt_idx" ON "Task"("completedAt");

-- CreateIndex
CREATE INDEX "Task_listId_idx" ON "Task"("listId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");

-- Backfill: task DONE lama mendapat perkiraan waktu selesai —
-- log TASK_COMPLETED terakhir bila ada, kalau tidak createdAt.
UPDATE "Task" SET "completedAt" = COALESCE((SELECT MAX(a."createdAt") FROM "ActivityLog" a WHERE a."taskId" = "Task"."id" AND a."action" = 'TASK_COMPLETED'), "createdAt") WHERE "status" = 'DONE' AND "completedAt" IS NULL;
