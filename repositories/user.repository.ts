import { prisma } from "@/lib/prisma";
import { profileUserSelect } from "@/lib/selects/user.select";
import type { GenderValue } from "@/types";

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
  // Detail profil (Personal Information)
  headline?: string | null;
  company?: string | null;
  location?: string | null;
  website?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  birthDate?: Date | null;
  gender?: GenderValue | null;
  skills?: string[];
  languages?: string[];
}

export interface ProfileUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  coverGradient: string | null;
  headline: string | null;
  company: string | null;
  location: string | null;
  website: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  birthDate: Date | null;
  gender: GenderValue | null;
  skills: string[];
  languages: string[];
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
  return prisma.user.findUnique({
    where: { id },
    select: profileUserSelect,
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

export async function updateUserCoverGradient(id: string, coverGradient: string) {
  return prisma.user.update({
    where: { id },
    data: { coverGradient },
  });
}

// DELETE (hard delete — User tidak pakai soft delete)
export async function deleteUser(id: string) {
  return prisma.user.delete({
    where: { id },
  });
}
