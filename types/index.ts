export type ProjectRole = "ADMIN" | "DEPUTY_ADMIN" | "MEMBER";

export interface DashboardProject {
  id: string;
  name: string;
  description: string | null;
  /** Hanya terisi bila role user di project itu ADMIN atau DEPUTY_ADMIN. */
  joinCode?: string;
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

export type TaskPriorityValue = "LOW" | "MEDIUM" | "HIGH";

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
  priority: TaskPriorityValue;
  dueDate: string | null; // ISO string
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  labels: BoardLabel[];
  commentCount: number;
}

export interface BoardProject {
  id: string;
  name: string;
  /** Hanya terisi bila role user di project itu ADMIN atau DEPUTY_ADMIN. */
  joinCode?: string;
  createdAt: string; // ISO string
  role: ProjectRole;
  lists: { id: string; name: string }[];
  labels: BoardLabel[];
  members: BoardMember[];
  tasks: BoardTask[];
}

// ===== Halaman Task Project (/tasks) — semua task dikelompokkan per project =====

export interface MyTaskItem extends BoardTask {
  projectId: string;
  projectName: string;
  projectDescription: string | null;
}

export interface MyTasksProjectGroup {
  id: string;
  name: string;
  description: string | null;
  tasks: MyTaskItem[];
  taskTotal: number;
  taskDone: number;
}

// ===== Inbox (/inbox) — notifikasi =====

export type NotificationTypeValue =
  | "TASK_ASSIGNED"
  | "MENTION"
  | "DUE_SOON"
  | "MEMBER_JOINED"
  | "PROJECT_COMPLETED"
  | "TASK_COMMENT";

export type NotificationTabValue = "all" | "unread" | "mention" | "task" | "invite";

export interface InboxActor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface InboxTask {
  id: string;
  title: string;
  priority: TaskPriorityValue;
  dueDate: string | null; // ISO string
  status: BoardTaskStatus;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  projectId: string;
}

export interface InboxNotification {
  id: string;
  type: NotificationTypeValue;
  readAt: string | null; // ISO string
  createdAt: string; // ISO string
  actor: InboxActor | null;
  task: InboxTask | null;
  project: { id: string; name: string } | null;
  /** Komentar pemicu notifikasi (MENTION/TASK_COMMENT) — terbaru bila di-coalesce. */
  comment: {
    id: string;
    content: string;
    createdAt: string; // ISO string
    author: InboxActor | null;
  } | null;
}

export interface NotificationTabCounts {
  all: number;
  unread: number;
  mention: number;
  task: number;
  invite: number;
}

// ===== Halaman Tim (/tim) — anggota project =====

export type TeamRoleFilter = "all" | ProjectRole;
export type TeamSort = "joined_desc" | "joined_asc" | "name_asc" | "name_desc";

export interface TeamMemberRow {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: ProjectRole;
  joinedAt: string; // ISO string
  activeTaskCount: number;
}

export interface TeamSummary {
  total: number;
  admin: number;
  deputy: number;
  member: number;
}

export interface TeamProjectOption {
  id: string;
  name: string;
}

// ===== Halaman Kalender (/calendar) — task yang punya due date =====

export interface CalendarTask extends BoardTask {
  /** Selalu terisi di halaman kalender — hanya task ber-due date yang tampil. */
  dueDate: string;
  projectId: string;
  projectName: string;
  /** Role user di project pemilik task — menentukan izin aksi (mis. edit/hapus). */
  isAdmin: boolean;
}

// ===== Halaman Aktivitas (/aktivitas) =====

export type ActivityActionValue =
  | "PROJECT_CREATED"
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_COMPLETED"
  | "COMMENT_ADDED"
  | "FILE_UPLOADED"
  | "MEMBER_JOINED"
  | "MEMBER_ROLE_CHANGED"
  | "MEMBER_REMOVED";

export type ActivityTypeFilterValue = "all" | "task" | "comment" | "file" | "member";
export type ActivityRangeValue = 7 | 30 | 90;

export interface ActivityActor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ActivityItem {
  id: string;
  action: ActivityActionValue;
  /** Snapshot saat kejadian (title/from/to/targetName/…) agar tetap render
   * walaupun data asli di-rename/di-soft-delete. */
  meta: Record<string, unknown> | null;
  createdAt: string; // ISO string (UTC)
  actor: ActivityActor;
  project: { id: string; name: string };
}

export interface ActivitySummary {
  taskCompleted: number;
  taskCreated: number;
  commentAdded: number;
  fileUploaded: number;
}

export interface ActivityProjectOption {
  id: string;
  name: string;
}

export interface ActivityMemberOption {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ActivityTopMember extends ActivityMemberOption {
  count: number;
}