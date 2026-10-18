import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * DEV ONLY — fixture uji kartu profil anggota (restore kartu lama).
 * Membuat: caller ADMIN (profil terisi) + target MEMBER (profil kosong) +
 * outsider (project lain), 1 project uji, 1 list, 2 task milik target
 * (1 aktif TODO + 1 selesai DONE). Idempotent via upsert. BUKAN production.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Hanya untuk development" }, { status: 403 });
  }
  const password = await bcrypt.hash("Test1234", 10);

  const caller = await prisma.user.upsert({
    where: { email: "profil-caller@example.test" },
    update: { password },
    create: {
      name: "Caller CardTest",
      email: "profil-caller@example.test",
      password,
      headline: "QA Engineer",
      company: "CardTest Inc",
      location: "Jakarta",
      bio: "Profil caller untuk uji kartu.",
      skills: ["Testing"],
      languages: ["Indonesia"],
      website: "https://example.test/caller",
    },
    select: { id: true },
  });

  const target = await prisma.user.upsert({
    where: { email: "profil-target@example.test" },
    update: {
      password,
      bio: null,
      headline: null,
      company: null,
      location: null,
      website: null,
      githubUrl: null,
      linkedinUrl: null,
      skills: [],
      languages: [],
    },
    create: { name: "Target Kosong", email: "profil-target@example.test", password },
    select: { id: true },
  });

  const outsider = await prisma.user.upsert({
    where: { email: "profil-outsider@example.test" },
    update: { password },
    create: { name: "Outsider", email: "profil-outsider@example.test", password },
    select: { id: true },
  });

  const project = await prisma.project.upsert({
    where: { joinCode: "CARDTEST" },
    update: {},
    create: { name: "CardTest Project", joinCode: "CARDTEST" },
    select: { id: true },
  });
  const other = await prisma.project.upsert({
    where: { joinCode: "CARDOTHR" },
    update: {},
    create: { name: "CardTest Other", joinCode: "CARDOTHR" },
    select: { id: true },
  });

  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId: caller.id, projectId: project.id } },
    update: { role: "ADMIN" },
    create: { userId: caller.id, projectId: project.id, role: "ADMIN" },
  });
  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId: target.id, projectId: project.id } },
    update: {},
    create: { userId: target.id, projectId: project.id, role: "MEMBER" },
  });
  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId: outsider.id, projectId: other.id } },
    update: {},
    create: { userId: outsider.id, projectId: other.id, role: "MEMBER" },
  });

  const list = await prisma.taskList.upsert({
    where: { id: "cardtestlist000000000001" },
    update: {},
    create: { id: "cardtestlist000000000001", name: "Uji", order: 0, projectId: project.id },
    select: { id: true },
  });
  await prisma.task.upsert({
    where: { id: "cardtesttask000000000001" },
    update: { status: "TODO", deletedAt: null },
    create: {
      id: "cardtesttask000000000001",
      title: "Task aktif target",
      status: "TODO",
      order: 0,
      listId: list.id,
      assigneeId: target.id,
    },
  });
  await prisma.task.upsert({
    where: { id: "cardtesttask000000000002" },
    update: { status: "DONE", deletedAt: null },
    create: {
      id: "cardtesttask000000000002",
      title: "Task selesai target",
      status: "DONE",
      order: 1,
      listId: list.id,
      assigneeId: target.id,
    },
  });

  return NextResponse.json({
    ok: true,
    callerId: caller.id,
    targetId: target.id,
    outsiderId: outsider.id,
    projectId: project.id,
  });
}
