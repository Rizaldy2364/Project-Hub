"use server";

import { requireProjectMember } from "@/lib/auth-guards";
import { findProjectMember } from "@/repositories/project.repository";
import { getMemberProfile } from "@/repositories/member.repository";
import { getMemberProfileSchema } from "@/lib/validations/member.schema";

// AMBIL PROFIL ANGGOTA (project-scoped).
// Caller wajib merupakan member projectId, dan target (userId) juga harus
// menjadi member project yang sama. Kembalikan { error } bila salah satu
// kondisi tidak terpenuhi (401/403/404). Tidak pernah expose password,
// birthDate atau gender; email ikut karena kartu lama & tabel anggota
// menampilkannya. Tautan luar divalidasi hanya http/https.
export async function getMemberProfileAction(input: {
  userId: string;
  projectId: string;
}) {
  const parsed = getMemberProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Parameter tidak valid", status: 400 as const };
  }
  const { userId, projectId } = parsed.data;

  // (1) Caller harus anggota project.
  const guard = await requireProjectMember(projectId);
  if ("error" in guard) return { error: guard.error, status: guard.status };

  // (2) Target harus juga anggota project yang sama.
  const target = await findProjectMember(userId, projectId);
  if (!target) {
    return {
      error: "Pengguna bukan anggota project ini",
      status: 403 as const,
    };
  }

  // (3) Ambil profil (repository sudah select hanya field yang aman).
  const profile = await getMemberProfile({ userId, projectId });
  if (!profile) {
    return { error: "Profil tidak ditemukan", status: 404 as const };
  }

  return {
    success: true as const,
    data: { ...profile, website: safeExternalUrl(profile.website), githubUrl: safeExternalUrl(profile.githubUrl), linkedinUrl: safeExternalUrl(profile.linkedinUrl) },
  };
}

// Hanya URL http/https yang valid yang boleh sampai ke client (tautan luar
// pada kartu profil dibuka di tab baru — cegah javascript:/data: URL).
function safeExternalUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return value;
    return null;
  } catch {
    return null;
  }
}
