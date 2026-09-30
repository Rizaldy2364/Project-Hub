import { prisma } from "@/lib/prisma";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  bio?: string | null;
  avatarUrl?: string;
  password?: string;
}

export interface ProfileUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  coverGradient: string | null;
}

// CREATE
export async function createUser(data: CreateUserInput) {
  return prisma.user.create({
    data,
  });
}

// READ
export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function findProfileUserById(id: string): Promise<ProfileUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      bio: true,
    },
  });

  if (!user) return null;

  const [cover] = await prisma.$queryRaw<{ coverGradient: string | null }[]>`
    SELECT "coverGradient" FROM "User" WHERE "id" = ${id}
  `;

  return { ...user, coverGradient: cover?.coverGradient ?? null };
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

// UPDATE
export async function updateUser(id: string, data: UpdateUserInput) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

// DELETE (hard delete — User tidak pakai soft delete)
export async function deleteUser(id: string) {
  return prisma.user.delete({
    where: { id },
  });
}

export async function updateUserCoverGradient(id: string, coverGradient: string) {
  return prisma.$executeRaw`
    UPDATE "User" SET "coverGradient" = ${coverGradient} WHERE "id" = ${id}
  `;
}
