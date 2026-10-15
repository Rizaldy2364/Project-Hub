import { prisma } from "@/lib/prisma";
import {
  searchProjectSelect,
  searchTaskSelect,
} from "@/lib/selects/search.select";

export interface SearchProjectsInput {
  userId: string;
  /** Teks yang sudah di-escape untuk LIKE (%, _, \). */
  query: string;
  take: number;
}

export interface SearchTasksInput {
  userId: string;
  /** Teks yang sudah di-escape untuk LIKE (%, _, \). */
  query: string;
  take: number;
}

// READ — project tempat user menjadi anggota (tidak terhapus), nama mengandung
// query (case-insensitive). Filter soft-delete ditulis eksplisit. Peringkat
// "diawali query" + potongan 5 dilakukan di route.
export async function searchProjects(data: SearchProjectsInput) {
  return prisma.project.findMany({
    where: {
      deletedAt: null,
      members: { some: { userId: data.userId } },
      name: { contains: data.query, mode: "insensitive" },
    },
    select: searchProjectSelect,
    orderBy: { createdAt: "desc" },
    take: data.take,
  });
}

// READ — task di list project anggota user (task & list tidak terhapus), judul
// mengandung query (case-insensitive). Filter soft-delete ditulis eksplisit.
export async function searchTasks(data: SearchTasksInput) {
  return prisma.task.findMany({
    where: {
      deletedAt: null,
      list: {
        deletedAt: null,
        project: {
          deletedAt: null,
          members: { some: { userId: data.userId } },
        },
      },
      title: { contains: data.query, mode: "insensitive" },
    },
    select: searchTaskSelect,
    orderBy: { createdAt: "desc" },
    take: data.take,
  });
}
