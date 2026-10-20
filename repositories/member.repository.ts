import { prisma } from "@/lib/prisma";

export interface GetMemberProfileInput {
  userId: string;
  projectId: string;
}

/** Profil anggota yang boleh ditampilkan ke client (TANPA password, birthDate, gender). */
export interface MemberProfile {
  name: string;
  email: string;
  avatarUrl: string | null;
  coverGradient: string | null;
  headline: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  skills: string[];
  languages: string[];
  website: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  /** Peran dalam project ini (ADMIN / MANAGER / MEMBER / VIEWER). */
  role: string;
  joinedAt: Date;
  /** Jumlah task aktif (status != DONE, tidak terhapus) di project ini yang ditugaskan ke user. */
  activeTaskCount: number;
  /** Jumlah task selesai (status DONE, tidak terhapus) — statistik "Diselesaikan" kartu lama. */
  doneTaskCount: number;
}

// READ — profil satu anggota dalam konteks project. Dipanggil oleh action setelah
// otorisasi (caller adalah member projectId dan target juga member project yang sama).
export async function getMemberProfile({
  userId,
  projectId,
}: GetMemberProfileInput): Promise<MemberProfile | null> {
  const [membership, user, activeTaskCount, doneTaskCount] = await Promise.all([
    // Verifikasi target adalah anggota project ini.
    prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
      select: { role: true, joinedAt: true },
    }),
    // Field profil yang boleh diekspose (tidak ada password / birthDate / gender).
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        // Email ikut karena kartu profil lama menampilkannya dan tabel anggota
        // juga menampilkannya.
        email: true,
        avatarUrl: true,
        coverGradient: true,
        headline: true,
        company: true,
        location: true,
        bio: true,
        skills: true,
        languages: true,
        website: true,
        githubUrl: true,
        linkedinUrl: true,
      },
    }),
    // Task aktif yang ditugaskan ke user di project ini (satu query agregat).
    prisma.task.count({
      where: {
        assigneeId: userId,
        status: { not: "DONE" },
        deletedAt: null,
        list: {
          deletedAt: null,
          projectId,
          // Project soft-deleted: task-nya ikut disembunyikan.
          project: { deletedAt: null },
        },
      },
    }),
    // Task selesai — statistik "Diselesaikan" pada kartu profil lama.
    prisma.task.count({
      where: {
        assigneeId: userId,
        status: "DONE",
        deletedAt: null,
        list: {
          deletedAt: null,
          projectId,
          project: { deletedAt: null },
        },
      },
    }),
  ]);

  if (!membership || !user) return null;

  return {
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    coverGradient: user.coverGradient,
    headline: user.headline,
    company: user.company,
    location: user.location,
    bio: user.bio,
    skills: user.skills ?? [],
    languages: user.languages ?? [],
    website: user.website,
    githubUrl: user.githubUrl,
    linkedinUrl: user.linkedinUrl,
    role: membership.role,
    joinedAt: membership.joinedAt,
    activeTaskCount,
    doneTaskCount,
  };
}
