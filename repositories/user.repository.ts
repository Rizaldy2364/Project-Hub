import { prisma } from "@/lib/prisma";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  password?: string;
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