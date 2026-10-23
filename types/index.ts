export type ProjectRole = "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";

export interface DashboardProject {
  id: string;
  name: string;
  description: string | null;
  /** Hanya terisi bila role user di project itu ADMIN atau MANAGER. */
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
  createdAt: string; // ISO string
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
  /** Hanya terisi bila role user di project itu ADMIN atau MANAGER. */
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
  completedAt?: string | null; // ISO string atau null
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
  /** `deleted: true` bila project sudah di-soft-delete — tampil sebagai "Project dihapus" dengan target non-klik. */
  project: { id: string; name: string; deleted: boolean } | null;
  /** Komentar pemicu notifikasi (MENTION/TASK_COMMENT) — terbaru bila di-coalesce. */
  comment: {
    id: string;
    content: string;
    createdAt: string; // ISO string
    author: InboxActor | null;
  } | null;
  /** Pesan Diskusi pemicu notifikasi MENTION di chat (tanpa taskId). */
  message: {
    id: string;
    content: string;
    createdAt: string; // ISO string
    deleted: boolean;
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
export type TeamSort = "role" | "joined_desc" | "joined_asc" | "name_asc" | "name_desc";

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
  manager: number;
  member: number;
  viewer: number;
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
  /** Izin aksi user di project pemilik task (dihitung dari role — matriks 8.2). */
  canEdit: boolean;
  canDelete: boolean;
  canComment: boolean;
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

// ===== Diskusi (/diskusi) — chat grup per project =====

export type ChatMessageKindValue = "USER" | "SYSTEM";

export interface ChatAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
  /** Role penulis DI project ini (bukan global). */
  role: ProjectRole;
}

export interface ChatReplyPreview {
  id: string;
  content: string;
  deleted: boolean;
  authorName: string;
  createdAt: string; // ISO string
}

export interface ChatMessage {
  id: string;
  kind: ChatMessageKindValue;
  content: string;
  pinned: boolean;
  createdAt: string; // ISO string
  deleted: boolean;
  author: ChatAuthor;
  replyTo: ChatReplyPreview | null;
  /** Optimistic: sedang dikirim (client-only). */
  pending?: boolean;
  /** Optimistic: gagal dikirim, bisa dicoba lagi (client-only). */
  failed?: boolean;
}

export interface ChatMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: ProjectRole;
}

export interface DiscussionLastMessage {
  authorName: string;
  /** Teks pratinjau (token mention sudah menjadi @Nama). */
  text: string;
  kind: ChatMessageKindValue;
  deleted: boolean;
  createdAt: string; // ISO string
}

export interface DiscussionSummaryItem {
  projectId: string;
  name: string;
  lastMessage: DiscussionLastMessage | null;
  unreadCount: number;
}

// ===== Laporan (/laporan) =====

export type ReportRangeValue = 7 | 30 | 90;

export interface ReportProjectOption {
  id: string;
  name: string;
}

export interface ReportMemberOption {
  id: string;
  name: string;
  avatarUrl: string | null;
}

/** Baris "Task selesai per minggu" (6 minggu terakhir, Senin WIB). */
export interface ReportWeeklyPoint {
  /** "YYYY-MM-DD" (Senin minggu itu, menurut WIB). */
  weekStart: string;
  count: number;
}

/** Satu baris "Beban kerja anggota" (batang bertumpuk per status). */
export interface ReportWorkloadRow {
  assigneeId: string | null; // null = tanpa penanggung jawab
  name: string;
  avatarUrl: string | null;
  TODO: number;
  IN_PROGRESS: number;
  DONE: number;
  total: number;
}

/** Satu baris "Task per project" untuk satu member (batang bertumpuk). */
export interface ReportMemberProjectRow {
  projectId: string;
  projectName: string;
  TODO: number;
  IN_PROGRESS: number;
  DONE: number;
  total: number;
}

/** Satu baris "Task per label" (top label). */
export interface ReportLabelRow {
  labelId: string;
  name: string;
  color: string;
  count: number;
}

/** Satu baris "Progres per project". */
export interface ReportProjectProgressRow {
  projectId: string;
  projectName: string;
  done: number;
  total: number;
  percent: number;
}

/** Satu baris "Task per prioritas" (satu project dipilih). */
export interface ReportPriorityRow {
  priority: TaskPriorityValue;
  label: string;
  count: number;
  percent: number;
}

/** Satu baris tabel "Task terlambat". */
export interface ReportOverdueTask {
  id: string;
  title: string;
  projectName: string;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  dueDate: string; // ISO string
  daysLate: number;
}

export interface ReportKpi {
  /** Task selesai dalam rentang. */
  completedInRange: number;
  /** Total task dalam scope (tanpa filter rentang). */
  scopeTaskTotal: number;
  /** Persen bulat; null bila dasar (denominator) 0 → tampilkan "—". */
  completionRatePercent: number | null;
  /** Selisih poin persen vs periode lalu; null = sembunyikan delta. */
  completionRateDelta: number | null;
  overdueCount: number;
  /** Rata-rata penyelesaian dalam hari; null = tidak ada data. */
  avgCompletionDays: number | null;
}

/** Kartu kanan "Beban kerja anggota" — bisa diganti adaptif. */
export type ReportWorkloadCard =
  | { kind: "workload"; rows: ReportWorkloadRow[] }
  | { kind: "member-projects"; rows: ReportMemberProjectRow[] }
  | { kind: "labels"; rows: ReportLabelRow[] };

/** Kartu kiri "Progres per project" — bisa diganti adaptif. */
export type ReportProgressCard =
  | { kind: "projects"; rows: ReportProjectProgressRow[] }
  | { kind: "priority"; rows: ReportPriorityRow[] };

export interface ReportData {
  kpi: ReportKpi;
  /** 6 titik, minggu berjalan di akhir array; tidak terpengaruh filter rentang. */
  weekly: ReportWeeklyPoint[];
  status: { TODO: number; IN_PROGRESS: number; DONE: number; total: number };
  workloadCard: ReportWorkloadCard;
  progressCard: ReportProgressCard;
  overdueTasks: ReportOverdueTask[];
}

// ===== Pencarian top bar (GET /api/search) =====

export interface SearchProjectResult {
  id: string;
  name: string;
  memberCount: number;
}

export interface SearchTaskResult {
  id: string;
  title: string;
  status: BoardTaskStatus;
  /** ISO string, atau null bila task tidak punya tenggat. */
  dueDate: string | null;
  project: { id: string; name: string };
}

export interface SearchResponse {
  projects: SearchProjectResult[];
  tasks: SearchTaskResult[];
}