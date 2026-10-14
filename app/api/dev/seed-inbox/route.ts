import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DEV ONLY — seed 5 notifikasi contoh untuk user yang sedang login.
 * Jangan dipanggil di production.
 *
 * Membuat (jika belum ada data pendukung):
 * - TASK_ASSIGNED (belum dibaca)
 * - MENTION (belum dibaca)
 * - DUE_SOON (belum dibaca)
 * - MEMBER_JOINED (sudah dibaca)
 * - PROJECT_COMPLETED (sudah dibaca)
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Hanya untuk development" }, { status: 403 });
  }
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  // Cari project + task milik user sebagai bahan contoh.
  const membership = await prisma.projectMember.findFirst({
    where: { userId, project: { deletedAt: null } },
    select: { projectId: true },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Buat atau gabung project dulu sebelum seed inbox" },
      { status: 400 }
    );
  }
  const projectId = membership.projectId;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true },
  });
  const task = await prisma.task.findFirst({
    where: { deletedAt: null, list: { projectId } },
    select: { id: true, title: true },
  });
  if (!project || !task) {
    return NextResponse.json(
      { error: "Project butuh minimal 1 task sebelum seed inbox" },
      { status: 400 }
    );
  }
  const otherMember = await prisma.projectMember.findFirst({
    where: { projectId, userId: { not: userId } },
    select: { userId: true, user: { select: { id: true, name: true } } },
  });
  // Aktor contoh = member lain bila ada, kalau tidak pakai diri sendiri.
  const actorId = otherMember?.userId ?? userId;
  const comment = await prisma.comment.create({
    data: {
      content: `Contoh komentar mention untuk @${session.user.name ?? "kamu"}`,
      taskId: task.id,
      userId: actorId,
    },
  });

  const now = Date.now();
  const created = await prisma.$transaction([
    prisma.notification.create({
      data: {
        type: "TASK_ASSIGNED",
        userId,
        actorId,
        projectId,
        taskId: task.id,
        createdAt: new Date(now - 1000 * 60 * 20),
      },
    }),
    prisma.notification.create({
      data: {
        type: "MENTION",
        userId,
        actorId,
        projectId,
        taskId: task.id,
        commentId: comment.id,
        createdAt: new Date(now - 1000 * 60 * 60 * 3),
      },
    }),
    prisma.notification.create({
      data: {
        type: "DUE_SOON",
        userId,
        actorId: null,
        projectId,
        taskId: task.id,
        createdAt: new Date(now - 1000 * 60 * 60 * 26),
      },
    }),
    prisma.notification.create({
      data: {
        type: "MEMBER_JOINED",
        userId,
        actorId,
        projectId,
        readAt: new Date(now - 1000 * 60 * 60 * 5),
        createdAt: new Date(now - 1000 * 60 * 60 * 30),
      },
    }),
    prisma.notification.create({
      data: {
        type: "PROJECT_COMPLETED",
        userId,
        actorId,
        projectId,
        readAt: new Date(now - 1000 * 60 * 60 * 8),
        createdAt: new Date(now - 1000 * 60 * 60 * 50),
      },
    }),
    prisma.notification.create({
      data: {
        type: "TASK_COMMENT",
        userId,
        actorId,
        projectId,
        taskId: task.id,
        commentId: comment.id,
        createdAt: new Date(now - 1000 * 60 * 90),
      },
    }),
  ]);

  return NextResponse.json({ success: true, count: created.length });
}
