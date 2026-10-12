-- AlterEnum: tambah peran Wakil Admin
ALTER TYPE "Role" ADD VALUE 'DEPUTY_ADMIN';

-- AlterTable: tambah joinedAt di ProjectMember (default sementara = now())
ALTER TABLE "ProjectMember" ADD COLUMN "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill: baris yang sudah ada diisi dengan Project.createdAt milik project-nya
UPDATE "ProjectMember" pm
SET "joinedAt" = p."createdAt"
FROM "Project" p
WHERE pm."projectId" = p."id";

-- Index projectId
CREATE INDEX "ProjectMember_projectId_idx" ON "ProjectMember"("projectId");
