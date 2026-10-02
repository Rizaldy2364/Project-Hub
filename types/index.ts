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
  /** Tenggat terdekat dari task yang belum selesai (turunan, bukan field database). */
  nextDueDate: string | null;
  /** Apakah `nextDueDate` sudah lewat (dihitung saat pembacaan data di server). */
  isOverdue: boolean;
}

// ===== Halaman detail project (board) =====

export type BoardTaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface BoardLabel {
  id: string;
  name: string;
  color: string;
}

export type GenderValue = "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED";

export interface BoardMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: ProjectRole;
  bio: string | null;
  coverGradient: string | null;
  headline: string | null;
  company: string | null;
  location: string | null;
  website: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  birthDate: string | null; // ISO string
  gender: GenderValue | null;
  skills: string[];
  languages: string[];
}

export interface BoardTask {
  id: string;
  title: string;
  description: string | null;
  status: BoardTaskStatus;
  dueDate: string | null; // ISO string
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  labels: BoardLabel[];
  commentCount: number;
}

export interface BoardProject {
  id: string;
  name: string;
  joinCode: string;
  createdAt: string; // ISO string
  role: ProjectRole;
  lists: { id: string; name: string }[];
  labels: BoardLabel[];
  members: BoardMember[];
  tasks: BoardTask[];
}