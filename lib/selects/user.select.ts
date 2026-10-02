import type { Prisma } from "@/app/generated/prisma/client";

// Field profil yang boleh dikirim ke client (TANPA password).
export const profileUserSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  bio: true,
  coverGradient: true,
  headline: true,
  company: true,
  location: true,
  website: true,
  githubUrl: true,
  linkedinUrl: true,
  birthDate: true,
  gender: true,
  skills: true,
  languages: true,
} satisfies Prisma.UserSelect;
