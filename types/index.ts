export type ProjectRole = "ADMIN" | "MEMBER";

export interface DashboardProject {
  id: string;
  name: string;
  description: string | null;
  joinCode: string | null; // hanya terisi jika user adalah ADMIN
  createdAt: string; // ISO string
  role: ProjectRole;
  memberCount: number;
  members: { id: string; name: string; avatarUrl: string | null }[];
  taskTotal: number;
  taskDone: number;
}