import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { ProjectRole } from "@/types";

export interface ProjectMembership {
  project: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    joinCode: string;
    joinEnabled: boolean;
    members: {
      userId: string;
      role: ProjectRole;
      joinedAt: Date;
      user: { id: string; name: string; email: string; avatarUrl: string | null };
    }[];
  };
  membership: { userId: string; role: ProjectRole; joinedAt: Date };
}

/**
 * Memuat project + keanggotaan user SATU kali per request (React cache()).
 * Layout dan setiap halaman tab memakainya, sehingga query project tidak
 * dijalankan ulang per tab dalam satu render.
 *
 * Mengembalikan `null` bila project tidak ada, sudah soft-deleted, atau user
 * bukan anggotanya — pemanggil wajib memanggil `notFound()` agar tidak
 * membocorkan keberadaan project.
 */
export const getProjectMembership = cache(
  async (projectId: string, userId: string): Promise<ProjectMembership | null> => {
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        joinCode: true,
        joinEnabled: true,
        members: {
          select: {
            userId: true,
            role: true,
            joinedAt: true,
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });
    if (!project) return null;

    const membership = project.members.find((m) => m.userId === userId);
    if (!membership) return null;

    return { project, membership };
  }
);