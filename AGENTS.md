# Project Instructions — ProjectHub (Project Management App)

> File ini adalah sumber kebenaran (source of truth) untuk AI coding agent (Claude Code, Cursor, dll) yang mengerjakan project ini. Ikuti semua keputusan arsitektur, struktur folder, dan konvensi di bawah ini secara konsisten. Jangan mengubah keputusan yang sudah ditetapkan tanpa konfirmasi ke user.
>
> Penanda di dokumen ini:
> - **[BARU]** = ditambahkan pada revisi ini (belum ada di versi sebelumnya).
> - **[ASUMSI — KONFIRMASI USER]** = keputusan yang disimpulkan dari desain/percakapan dan belum dikonfirmasi final. Kerjakan sesuai teks, tapi sebutkan di ringkasan akhir agar user bisa memeriksa.

## 1. Ringkasan Project

Aplikasi manajemen project dan tugas berbasis board, full-stack, dibuat sebagai proyek portofolio. Selain board task, aplikasi punya **kolaborasi tim** (diskusi ala chat per project, inbox notifikasi, aktivitas), **kalender**, **laporan**, serta role **Admin / Wakil Admin / Member** per project. Fokus pada implementasi yang solid dan best-practice, bukan fitur sebanyak-banyaknya.

Desain visual (mockup) sudah dibuat per halaman. Setiap halaman dikerjakan lewat prompt terpisah; dokumen ini menjadi aturan bersama semua prompt itu.

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) |
| Bahasa | TypeScript (strict) |
| UI Library | React |
| Styling | Tailwind CSS |
| Database | PostgreSQL di **Neon** (serverless Postgres) **[BARU]** |
| ORM | Prisma — generator `prisma-client` (pola terbaru, ESM-first, bukan `prisma-client-js`) |
| Koneksi Database | Driver adapter `@prisma/adapter-pg`, dikonfigurasi lewat `prisma.config.ts` (bukan langsung di `schema.prisma`). Runtime memakai alamat **pooled** Neon, CLI memakai alamat **direct** (lihat Bagian 5) |
| Auth | NextAuth.js (Auth.js) — Credentials Provider |
| Drag & Drop | `@dnd-kit` |
| Validasi | Zod |
| Data mutation | Server Actions (bukan REST API terpisah, kecuali daftar pengecualian di Bagian 4) |
| State management | React `useState` bawaan + `revalidatePath` (tanpa Zustand/React Query/SWR) |
| Theme | `next-themes` (dark/light mode, strategi `class`) |
| Upload File | UploadThing (`uploadthing` + `@uploadthing/react`) — foto profil **dan lampiran chat/task** **[BARU]**, token via `UPLOADTHING_TOKEN` di `.env` |
| Modal/Dialog | `@radix-ui/react-dialog` (primitive tanpa styling bawaan), di-style manual pakai Tailwind lewat wrapper `components/ui/dialog.tsx` — BUKAN full shadcn/ui CLI |
| Font | Plus Jakarta Sans lewat `next/font/google` (variabel CSS `--font-jakarta`), di-set langsung di `body` pada `globals.css`. JANGAN kembali ke `font-family: Arial` bawaan template |

**Aturan penting:**
- Jangan menambahkan library state management (Zustand, Redux, React Query, SWR) kecuali diminta eksplisit. Prioritaskan Server Actions + `revalidatePath`.
- **[BARU]** Jangan menambahkan library **kalender** (FullCalendar, dll), **chart** (Recharts, Chart.js, dll), maupun **tanggal** (date-fns, dayjs, moment) tanpa konfirmasi. Kalender dibuat dengan grid Tailwind + `Date`/`Intl`, grafik dibuat dengan komponen SVG/CSS sendiri (`components/charts/`), utilitas tanggal di `lib/date.ts`.
- **[BARU]** Zona waktu aplikasi: simpan semua `DateTime` dalam UTC, tampilkan dan hitung "hari ini / terlambat / minggu ini" dalam **`Asia/Jakarta`**. Konstanta `APP_TIMEZONE` di `lib/date.ts`.

## 3. Daftar Fitur

### 3.1 Fitur inti (sudah ada di versi sebelumnya)

| No | Fitur | Detail |
|---|---|---|
| 1 | Board/List view | Kolom status: To Do, In Progress, Done. Sekarang **satu tab "Task"** dengan toggle Board/Daftar (state di URL `?view=board\|list`) |
| 2 | Task CRUD | Buat, edit, hapus task — judul & deskripsi |
| 3 | Due date | Tanggal deadline per task |
| 4 | Task status | Todo / In Progress / Done |
| 5 | Assignee | Task di-assign ke salah satu member project |
| 6 | Auth & multi-user | Login, register, role per project |
| 7 | Comment di task | Create, edit (badge "diedit" via `updatedAt`), delete (hanya oleh pembuat komentar) |
| 8 | Label/Tag | Kategori berwarna |
| 9 | Search & filter | Cari task by nama, filter by assignee/label/status |
| 10 | Profile | Lihat & edit profil (nama, avatar, bio, dan detail profil) |
| 11 | Project via Join Code | Buat project (jadi Admin) atau gabung pakai kode (jadi Member) |
| 12 | Dark/Light theme | Toggle manual via `next-themes` |
| 13 | Soft Delete | Data "dihapus" ditandai `deletedAt` |

### 3.2 Fitur baru **[BARU]**

| No | Fitur | Detail ringkas | Bagian |
|---|---|---|---|
| 14 | Role **Wakil Admin** (`DEPUTY_ADMIN`) | Menggantikan Admin untuk membuat dan menugaskan task; hanya diberikan/dicabut oleh Admin kepada Member | 8.2, 9.1 |
| 15 | **Aktivitas** | Riwayat kejadian (global dan per project) dari tabel `ActivityLog`; menggantikan menu "Dokumen & File" | 9.2 |
| 16 | **Inbox** (notifikasi) | Task ditugaskan, mention, pengingat tenggat, anggota baru bergabung; tandai dibaca | 9.3 |
| 17 | **Diskusi** (chat grup per project) | Gaya panel chat WhatsApp; khusus anggota project; mention, balasan, lampiran, pesan tersemat, penanda belum dibaca | 9.4 |
| 18 | **Tim & Anggota** | Tabel anggota (global per project terpilih + tab di dalam project), pencarian, filter peran, pagination, ubah peran dan hapus anggota lewat dialog "Kelola" | 9.5 |
| 19 | **Task Saya** | Task milik user lintas project, dikelompokkan per project (accordion), filter member/status | 9.6 |
| 20 | **Kalender** | Tampilan bulan dari `Task.dueDate`, agenda hari ini/mendatang, filter member | 9.6 |
| 21 | **Laporan** | KPI, task selesai per minggu, distribusi status, beban kerja anggota, progres project, task terlambat | 9.7 |
| 22 | **Pengaturan project** (khusus Admin) | Info project, kode gabung (regenerate + saklar), kelola label, ringkasan peran, hapus project | 9.8 |
| 23 | **Ringkasan project** | Tab pertama di dalam project: tenggat terdekat, beban kerja, aktivitas terbaru, status task | 9.9 |
| 24 | **Dashboard** (halaman utama) | Sapaan, 4 angka ringkas, daftar project (card) | 11 |

### 3.3 Elemen UI yang SENGAJA TIDAK ADA (jangan ditambahkan sebagai UI dummy/hardcode)
Workspace selector, storage meter, kategori/deadline/status project sebagai field database (status project di card hanyalah turunan progres task), halaman "Dokumen & File" terpisah, global search ⌘K (ditunda, lihat Backlog), halaman "Pengaturan akun" terpisah (tombol Pengaturan di sidebar bawah mengarah ke `/profile`).
**Prinsip: jangan membuat elemen UI yang tidak didukung backend.** Elemen yang kini didukung backend (Inbox, Diskusi, Aktivitas, Laporan, Kalender, Task Saya, Tim & Anggota) dibuat penuh sesuai Bagian 9.

## 4. Prinsip Arsitektur — WAJIB DIIKUTI

**Role tidak melekat pada User secara global.** Role (`ADMIN`/`DEPUTY_ADMIN`/`MEMBER`) disimpan di tabel penghubung `ProjectMember`. Jangan pernah menambahkan field `role` ke model `User`.

**Alur satu arah untuk semua operasi data:**
```
Component (UI)
   ↓
actions/          → otorisasi + validasi input (Zod) + orchestration + revalidatePath
   ↓
repositories/     → query Prisma murni (pakai lib/selects/)
   ↓
Database (PostgreSQL / Neon)
```
- `actions/` TIDAK BOLEH memanggil `prisma` langsung — harus lewat `repositories/`.
- `repositories/` TIDAK BOLEH melakukan validasi, otorisasi, atau `revalidatePath` — murni query data.
- Field sensitif (`password`) TIDAK BOLEH pernah di-`select` kecuali untuk proses autentikasi internal.

**Typing di `repositories/` WAJIB pakai interface eksplisit per operasi, TIDAK BOLEH inline object type.** Penamaan: `Create<Model>Input`, `Update<Model>Input`, `FindAll<Model>Input`, dst.

**Repository berbentuk function biasa yang di-export langsung, BUKAN `class`.** Contoh:
```typescript
export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export async function createUser(data: CreateUserInput) {
  return prisma.user.create({ data });
}
```

**Soft delete wajib diterapkan** pada model: `Project`, `TaskList`, `Task`, `Label`, `Comment`, **`ProjectMessage`**, **`Attachment`** **[BARU: dua terakhir]**. Model `User`, `ProjectMember`, `Notification`, `ActivityLog` TIDAK memakai soft delete.
- Aksi "hapus" pada model bersoft-delete TIDAK BOLEH memakai `delete()` — ganti `update()` yang mengisi `deletedAt`.
- Setiap query "read" pada model-model itu WAJIB menyaring `deletedAt: null`, diterapkan global lewat Prisma Client Extension di `lib/prisma.ts` (daftar model di extension harus ikut diperbarui untuk dua model baru).
- Restore dan halaman Trash bersifat opsional.

### 4.1 Otorisasi **[BARU]** — wajib di server
Menyembunyikan tombol di UI TIDAK cukup. Semua aturan akses dicek di server.
- `lib/permissions.ts` berisi fungsi murni berbasis role, mis. `canCreateTask(role)`, `canManageMembers(role)`, `canEditProjectSettings(role)`. Jangan menulis `role === "ADMIN"` tersebar di banyak file.
- `lib/auth-guards.ts` berisi `requireUser()` dan `requireProjectMember(projectId)` (mengembalikan `{ user, membership }` atau melempar error 401/403). **Setiap** Server Action dan route handler yang menyentuh data project WAJIB memanggil salah satunya di baris awal.
- Setelah menambah nilai enum `DEPUTY_ADMIN`, audit SEMUA tempat yang memakai `Role`/`"ADMIN"` agar tidak ada yang rusak.

### 4.2 Pengecualian terhadap "Server Actions saja" **[BARU]**
Server Actions untuk mutasi tetap aturan utama. Route handler (`app/api/...`) hanya boleh untuk kasus berikut, dan tetap memanggil `repositories/` + guard otorisasi:
1. `api/auth/[...nextauth]` (NextAuth)
2. `api/uploadthing/*` (UploadThing)
3. `GET api/projects/[projectId]/messages` — polling pesan baru (parameter `after` cursor)
4. `GET api/notifications/unread-count` — angka badge Inbox di sidebar
5. `GET api/cron/due-soon` — pemicu pengingat tenggat, dilindungi header rahasia `CRON_SECRET`

Polling dibuat dengan `useEffect` + `fetch` + `useState` biasa (tanpa SWR/React Query), hanya aktif saat tab browser terlihat (`document.visibilityState`), interval 5 detik untuk chat yang sedang dibuka dan 30 detik untuk badge Inbox. Alasan: hemat jam komputasi Neon dan kompatibel dengan hosting serverless (tidak ada WebSocket persisten).

## 5. Prisma Setup — Generator, Datasource, Konfigurasi, dan Neon

Project ini memakai generator `prisma-client` dan driver adapter, BUKAN `prisma-client-js`. Keputusan final.

### `prisma/schema.prisma` — bagian generator & datasource
```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```
- `datasource db` TIDAK berisi `url`; koneksi diatur di `prisma.config.ts`.
- Import Prisma Client eksplisit ke `app/generated/prisma/client`, BUKAN `@prisma/client`.

### Neon: dua alamat koneksi **[BARU]**
Neon menyediakan alamat **pooled** (host berisi `-pooler`, lewat PgBouncer) dan **direct**.
- `DATABASE_URL` = alamat **pooled** → dipakai aplikasi saat runtime (`lib/prisma.ts`).
- `DIRECT_URL` = alamat **direct** → dipakai Prisma CLI (`migrate`, `studio`, `db pull`).

`.env.example` (WAJIB dibuat, tanpa nilai rahasia; `.env` masuk `.gitignore`):
```env
DATABASE_URL="postgres://USER:PASS@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgres://USER:PASS@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"
UPLOADTHING_TOKEN=""
CRON_SECRET=""
```
Gunakan **branch Neon terpisah** untuk development dan production.

### `prisma.config.ts` (root project)
```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL, // CLI memakai koneksi direct (bukan pooled)
  },
});
```
Perintah di production: `pnpm prisma migrate deploy` (bukan `migrate dev`).

### Driver Adapter
Tetap `@prisma/adapter-pg` (JANGAN diganti ke `@prisma/adapter-neon` tanpa konfirmasi). `lib/prisma.ts`:
- Buat `PrismaPg` dengan `connectionString: process.env.DATABASE_URL` (alamat pooled).
- Pasangkan ke `new PrismaClient({ adapter })` yang di-import dari `app/generated/prisma/client`.
- Pakai pola singleton (`globalThis`) agar tidak membuat koneksi baru tiap hot reload.
- Pasang Client Extension soft delete (Bagian 4).

### Package yang wajib ter-install
```bash
pnpm add dotenv @prisma/adapter-pg
```

## 6. Prisma Schema — Data Model Lengkap

Satu file: `prisma/schema.prisma`. Ini adalah schema TARGET (gabungan model yang sudah ada + **[BARU]**). Terapkan bertahap sesuai roadmap (Bagian 12), satu migrasi per tahap.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  password      String
  avatarUrl     String?
  bio           String?
  coverGradient String?

  // Detail profil
  headline    String?
  company     String?
  location    String?
  website     String?
  githubUrl   String?
  linkedinUrl String?
  birthDate   DateTime?
  gender      Gender?
  skills      String[]  @default([])
  languages   String[]  @default([])

  lastActiveAt DateTime? // [BARU] indikator aktif, diperbarui paling sering 1x/menit

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  memberships   ProjectMember[]
  assignedTasks Task[]    @relation("TaskAssignee")
  createdTasks  Task[]    @relation("TaskCreator")                    // [BARU]
  comments      Comment[]

  messages               ProjectMessage[]                              // [BARU]
  notifications          Notification[] @relation("NotificationRecipient") // [BARU]
  triggeredNotifications Notification[] @relation("NotificationActor")     // [BARU]
  attachments            Attachment[]                                  // [BARU]
  activityLogs           ActivityLog[]                                 // [BARU]
}

enum Gender {
  MALE
  FEMALE
  OTHER
  UNDISCLOSED
}

model Project {
  id          String    @id @default(cuid())
  name        String
  description String?
  joinCode    String    @unique
  joinEnabled Boolean   @default(true) // [BARU] saklar "izinkan bergabung lewat kode"
  createdAt   DateTime  @default(now())
  deletedAt   DateTime?

  members     ProjectMember[]
  lists       TaskList[]
  labels      Label[]

  messages      ProjectMessage[] // [BARU]
  notifications Notification[]   // [BARU]
  attachments   Attachment[]     // [BARU]
  activityLogs  ActivityLog[]    // [BARU]
}

model ProjectMember {
  id         String    @id @default(cuid())
  role       Role      @default(MEMBER)
  joinedAt   DateTime  @default(now()) // [BARU] backfill: isi dengan Project.createdAt untuk baris lama
  lastReadAt DateTime? // [BARU] penanda belum dibaca di Diskusi

  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([userId, projectId])
  @@index([projectId])
}

enum Role {
  ADMIN
  DEPUTY_ADMIN // [BARU] Wakil Admin
  MEMBER
}

model TaskList {
  id        String    @id @default(cuid())
  name      String
  order     Int
  deletedAt DateTime?

  projectId String
  project   Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks     Task[]

  @@index([projectId])
}

model Task {
  id          String       @id @default(cuid())
  title       String
  description String?
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?
  completedAt DateTime?    // [BARU] diisi saat status menjadi DONE, dikosongkan bila status kembali
  order       Int
  createdAt   DateTime     @default(now())
  deletedAt   DateTime?

  listId      String
  list        TaskList   @relation(fields: [listId], references: [id], onDelete: Cascade)

  assigneeId  String?
  assignee    User?      @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)

  createdById String?    // [BARU] pembuat/penugas task
  createdBy   User?      @relation("TaskCreator", fields: [createdById], references: [id], onDelete: SetNull)

  labels      Label[]    @relation("TaskLabels")
  comments    Comment[]

  attachments   Attachment[]   // [BARU]
  activityLogs  ActivityLog[]  // [BARU]
  notifications Notification[] // [BARU]

  @@index([listId])
  @@index([assigneeId])
  @@index([dueDate])
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}

model Label {
  id        String    @id @default(cuid())
  name      String
  color     String
  deletedAt DateTime?

  projectId String
  project   Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks     Task[]    @relation("TaskLabels")

  @@index([projectId])
}

model Comment {
  id        String    @id @default(cuid())
  content   String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  taskId    String
  task      Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  notifications Notification[] // [BARU] notifikasi mention

  @@index([taskId])
}

// ===================== [BARU] Diskusi =====================

enum MessageKind {
  USER
  SYSTEM // pesan sistem, mis. "Firdaus bergabung ke project"
}

model ProjectMessage {
  id        String      @id @default(cuid())
  kind      MessageKind @default(USER)
  content   String
  pinnedAt  DateTime?   // pesan tersemat
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  deletedAt DateTime?

  projectId String
  project   Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId    String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  replyToId String?
  replyTo   ProjectMessage?  @relation("MessageReply", fields: [replyToId], references: [id], onDelete: SetNull)
  replies   ProjectMessage[] @relation("MessageReply")

  attachments   Attachment[]
  notifications Notification[]

  @@index([projectId, createdAt])
}

// ===================== [BARU] Inbox =====================

enum NotificationType {
  TASK_ASSIGNED
  MENTION
  DUE_SOON
  MEMBER_JOINED
}

model Notification {
  id        String           @id @default(cuid())
  type      NotificationType
  readAt    DateTime?
  createdAt DateTime         @default(now())
  dedupeKey String?          @unique // mis. DUE_SOON: "<userId>:<taskId>:<yyyy-mm-dd>"

  userId    String           // penerima
  user      User             @relation("NotificationRecipient", fields: [userId], references: [id], onDelete: Cascade)

  actorId   String?          // pelaku
  actor     User?            @relation("NotificationActor", fields: [actorId], references: [id], onDelete: SetNull)

  projectId String?
  project   Project?         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  taskId    String?
  task      Task?            @relation(fields: [taskId], references: [id], onDelete: Cascade)
  commentId String?
  comment   Comment?         @relation(fields: [commentId], references: [id], onDelete: Cascade)
  messageId String?
  message   ProjectMessage?  @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@index([userId, readAt, createdAt])
  @@index([userId, type, createdAt])
}

// ===================== [BARU] Lampiran (chat dan task) =====================

model Attachment {
  id        String    @id @default(cuid())
  name      String
  url       String
  key       String    // file key UploadThing (untuk penghapusan file)
  size      Int       // byte
  mimeType  String
  createdAt DateTime  @default(now())
  deletedAt DateTime?

  projectId    String
  project      Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  taskId       String?
  task         Task?           @relation(fields: [taskId], references: [id], onDelete: Cascade)
  messageId    String?
  message      ProjectMessage? @relation(fields: [messageId], references: [id], onDelete: Cascade)
  uploadedById String
  uploadedBy   User            @relation(fields: [uploadedById], references: [id], onDelete: Cascade)

  @@index([projectId, createdAt])
  @@index([taskId])
  @@index([messageId])
}

// ===================== [BARU] Aktivitas =====================

enum ActivityAction {
  PROJECT_CREATED
  TASK_CREATED
  TASK_UPDATED
  TASK_COMPLETED
  COMMENT_ADDED
  FILE_UPLOADED
  MEMBER_JOINED
  MEMBER_ROLE_CHANGED
  MEMBER_REMOVED
}

model ActivityLog {
  id        String         @id @default(cuid())
  action    ActivityAction
  meta      Json?          // data tambahan, mis. { title, from, to }
  createdAt DateTime       @default(now())

  userId    String
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  projectId String
  project   Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  taskId    String?
  task      Task?          @relation(fields: [taskId], references: [id], onDelete: SetNull)

  @@index([projectId, createdAt])
  @@index([userId, createdAt])
}
```

**Catatan relasi:** `onDelete: Cascade` di relasi turunan (Project → TaskList → Task → Comment/Label/Attachment) agar tidak ada data yatim bila terjadi hard delete di level atas. `assignee` dan `createdBy` pada `Task` memakai `SetNull`. Aplikasi sendiri memakai soft delete, sehingga cascade hanya jaring pengaman.

**Catatan migrasi:** ubah `Role` (nilai baru enum) dan tambah `ProjectMember.joinedAt` pada migrasi yang sama; backfill `joinedAt` dengan `Project.createdAt` lewat SQL di file migrasi.

## 7. Zod Validation — Batas Tiap Field

| Field | Batas | Alasan |
|---|---|---|
| `name` (user) | 2–50 karakter | Nama pendek, cegah spam |
| `name` (project) | 1–100 karakter | Nama project |
| `email` | max 255, format email valid | Standar |
| `password` | 8–72 karakter, minimal 1 huruf besar & 1 angka | 72 = limit fisik bcrypt |
| `bio` | max 160 karakter | Konvensi umum |
| `project description` | max 500 karakter | Ringkas tapi cukup detail |
| `task title` | 1–200 karakter | Judul singkat |
| `task description` | max 2000 karakter | Boleh lebih detail |
| `comment content` | 1–1000 karakter | Diskusi per task |
| `label name` | 1–30 karakter | Tampil sebagai badge kecil |
| `label color` | regex hex `^#[0-9A-Fa-f]{6}$` | Validasi format warna |
| `message content` **[BARU]** | 1–2000 karakter (setelah trim) | Pesan chat |
| `attachment` **[BARU]** | tipe: gambar, PDF, dokumen Office, zip; maks 8 MB per file (konfigurasi di router UploadThing) | Batasi penyimpanan |
| `members query` **[BARU]** | `pageSize` hanya 10 / 25 / 50; `q` max 100 karakter | Cegah query berlebihan |
| `role change` **[BARU]** | nilai hanya `DEPUTY_ADMIN` atau `MEMBER` | `ADMIN` tidak bisa di-set lewat fitur ini |

## 8. Auth & Authorization Flow

```
Register/Login → hanya bikin akun, TIDAK ada pilihan role saat register/login
   ↓
Dashboard → dua aksi utama:
   ├─ Buat Project → auto jadi ADMIN + generate joinCode unik (8 karakter)
   └─ Gabung Project → input joinCode → jadi MEMBER (jika valid dan joinEnabled = true)
   ↓
proxy.ts memproteksi semua route di dalam (dashboard)/*
   ↓
Setiap akses ke project tertentu: requireProjectMember(projectId) → cek keanggotaan dan role
```

### 8.1 Keamanan Join Code (wajib)
1. **Regenerate code** — hanya ADMIN, dari Pengaturan project (kode lama otomatis tidak berlaku karena di-overwrite).
2. **Rate limiting** — maks 5 percobaan join per menit per user (in-memory `Map` di `lib/rate-limit.ts`; catat sebagai known-limitation di README).
3. **Cek duplikat member** sebelum insert `ProjectMember`; kembalikan pesan ramah, jangan andalkan constraint error Prisma.
4. **[BARU]** Tolak join bila `Project.joinEnabled = false`, dengan pesan "Pendaftaran anggota project ini sedang ditutup".
5. `joinCode` HANYA dikirim ke client bila role user di project itu `ADMIN` atau `DEPUTY_ADMIN` (**[ASUMSI — KONFIRMASI USER]**: Member tidak boleh melihat kode). Untuk Member, kode tidak boleh ada di payload sama sekali (bukan sekadar disembunyikan lewat CSS/UI).

```typescript
import { customAlphabet } from "nanoid"
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8)
export function generateJoinCode(): string {
  return nanoid()
}
```

### 8.2 Matriks izin per role **[BARU]**
Diterapkan lewat `lib/permissions.ts` dan dicek di server. Baris bertanda ◆ adalah **[ASUMSI — KONFIRMASI USER]**.

| Aksi | ADMIN | DEPUTY_ADMIN | MEMBER |
|---|:-:|:-:|:-:|
| Melihat project, task, anggota, diskusi, aktivitas | ✓ | ✓ | ✓ |
| Membuat task, menugaskan/mengganti assignee | ✓ | ✓ | ✗ |
| Mengedit task (judul, deskripsi, due date, prioritas, label) ◆ | ✓ | ✓ | ✗ |
| Mengubah status task | ✓ | ✓ | hanya task yang ditugaskan kepadanya |
| Menghapus task (soft delete) ◆ | ✓ | ✗ | ✗ |
| Komentar di task; edit/hapus komentar sendiri | ✓ | ✓ | ✓ |
| Kirim pesan Diskusi, mention, balas, lampirkan file; hapus pesan sendiri | ✓ | ✓ | ✓ |
| Menyematkan pesan Diskusi ◆ | ✓ | ✓ | ✗ |
| Menghapus pesan orang lain (moderasi) ◆ | ✓ | ✗ | ✗ |
| Mengubah peran anggota, menghapus anggota | ✓ | ✗ | ✗ |
| Melihat dan menyalin kode gabung ◆ | ✓ | ✓ | ✗ |
| Membuat ulang kode gabung, saklar `joinEnabled` | ✓ | ✗ | ✗ |
| Mengelola label, mengedit info project, menghapus project (soft delete) | ✓ | ✗ | ✗ |
| Melihat tab Pengaturan | ✓ | ✗ | ✗ |

**Aturan perubahan peran (validasi server):**
- Hanya `ADMIN` yang boleh mengubah peran.
- `DEPUTY_ADMIN` hanya boleh diberikan kepada user yang saat ini `MEMBER`, dan hanya dicabut (kembali `MEMBER`) oleh `ADMIN`.
- `ADMIN` tidak bisa diubah atau dihapus lewat fitur ini; Admin tidak bisa mengubah/menghapus dirinya sendiri.
- Perubahan role dijalankan dalam satu transaksi; tolak dengan 403 (bukan admin) atau 400/422 (melanggar aturan).
- Saat anggota dihapus: dalam satu transaksi, set `assigneeId = null` pada task project itu yang ditugaskan kepadanya, lalu hapus `ProjectMember`-nya. Catat `MEMBER_REMOVED` di `ActivityLog`.

## 9. Spesifikasi Fitur Baru **[BARU]**

Semua halaman memakai tema gelap/terang dengan token warna yang sudah ada di app (acuan mockup gelap: latar `#0B0F19`, kartu `#131A2B`, area dalam `#0F1524`, hover `#1B2438`, border `rgba(255,255,255,.08)`, teks `#E6EAF2`, teks redup `#8B96AD`, primary `#3B66EE`, aksen `#8FAAFF`). Badge peran: Admin ungu (`#C4B5FD`), Wakil Admin pink (`#F9A8D4`), Member abu (`#B6C0D2`). Semua teks UI berbahasa Indonesia. Setiap halaman wajib punya skeleton loading, empty state, error state dengan tombol coba lagi, fokus keyboard yang terlihat, dan responsif.

### 9.1 Wakil Admin
Ikuti Bagian 8.2. Badge peran tampil di tabel anggota, daftar anggota Diskusi, dan pesan chat. **Mengubah peran dan menghapus anggota dilakukan lewat tombol "Kelola" di baris anggota, yang membuka dialog modal (BUKAN menu dropdown "⋯").** Tombol "Kelola" hanya tampil untuk ADMIN, hanya untuk anggota selain dirinya dan selain ADMIN lain. DEPUTY_ADMIN dan MEMBER TIDAK melihat tombol ini, dan server menolak `changeMemberRoleAction`/`removeMemberAction` dari mereka (403) walau dipanggil langsung.

Dialog "Kelola anggota" (komponen `MemberManageDialog` di `components/members/`, memakai `components/ui/dialog.tsx` yang sudah ada; tanpa library baru):
- Header: avatar atau inisial, nama, email dan tanggal bergabung, tombol tutup.
- Bagian PERAN: dua kartu pilihan radio — "Member" (Mengerjakan task yang ditugaskan.) dan "Wakil Admin" (Membuat dan menugaskan task menggantikan Admin.). Pilihan awal = peran saat ini. Peran Admin tidak ditawarkan.
- Bagian "Hapus dari project" (kartu merah tipis): menyebut jumlah task aktif milik anggota yang akan menjadi tanpa penanggung jawab, dan tombol "Hapus anggota". Menekannya membuka dialog konfirmasi kedua ("Hapus {nama} dari project?") dengan tombol Batal dan Hapus.
- Footer: "Batal" dan "Simpan perubahan" (nonaktif sampai peran berubah). Setelah sukses: toast, dialog tertutup, `revalidatePath`.
- Dialog harus bisa dipakai dengan keyboard (fokus terkunci di dalam dialog, Escape menutup, fokus kembali ke tombol "Kelola").

### 9.2 Aktivitas
- Tulis log lewat helper `lib/activity.ts` → `logActivity({ userId, projectId, taskId?, action, meta? })`, dipanggil di Server Action yang sama setelah aksi sukses (idealnya dalam transaksi yang sama): buat project, buat/ubah/selesaikan task, komentar, unggah file, anggota bergabung, ubah peran, hapus anggota.
- Halaman global `/activity` (semua project user) dan tab "Aktivitas" di project (`projectId` terisi) memakai **satu komponen yang sama** dengan prop `projectId?`.
- Filter: jenis (Semua, Task, Komentar, File, Anggota), project, member, rentang waktu (7/30/90 hari). Dikelompokkan per tanggal (Hari ini, Kemarin, tanggal). Pagination cursor + tombol "Muat lebih banyak".
- Panel samping: ringkasan 7 hari (jumlah per jenis) dan anggota paling aktif (hitung jumlah log per user).
- Data grafik "Pengguna Aktif" = jumlah `userId` unik di `ActivityLog` per hari.

### 9.3 Inbox
- **Kapan notifikasi dibuat** (di Server Action yang sudah ada, lewat helper `lib/notify.ts`; jangan membuat notifikasi untuk diri sendiri):

| Tipe | Pemicu | Penerima |
|---|---|---|
| `TASK_ASSIGNED` | assignee task diisi atau diganti | assignee baru (kecuali pelaku = assignee) |
| `MENTION` | komentar task atau pesan Diskusi menyebut member project | user yang disebut (bukan penulis) |
| `DUE_SOON` | job harian: task tidak terhapus, status bukan DONE, punya assignee, `dueDate` ≤ 3 hari ke depan | assignee; `dedupeKey` = `<userId>:<taskId>:<yyyy-mm-dd>` agar tidak dobel |
| `MEMBER_JOINED` | user bergabung lewat kode gabung | semua `ADMIN` project (kecuali user itu) |

- **Mention:** komposer menyisipkan token `@[userId]` ke dalam teks. Server mengekstrak token dengan `lib/mentions.ts` → `extractMentions(content)`, memverifikasi tiap `userId` adalah anggota project yang sama, lalu membuat notifikasi. UI merender token menjadi `@Nama` dengan menyocokkan ke daftar anggota (jika tidak ketemu, tampilkan `@pengguna`). Jangan memakai `dangerouslySetInnerHTML`.
- **Halaman `/inbox`:** dua kolom (daftar + panel detail 400px sticky). Tab: Semua, Belum dibaca, Mention, Tugas (`TASK_ASSIGNED` + `DUE_SOON`), Undangan (`MEMBER_JOINED`), masing-masing dengan jumlah dari server. Dikelompokkan Hari ini / Kemarin / Lebih lama. Klik item = pilih + tandai dibaca (optimistic update, rollback jika gagal). Tombol "Tandai semua dibaca". Panel detail menampilkan info task (project, ditugaskan ke, prioritas, tenggat, status), tombol "Buka Task", "Tandai dibaca", dan kolom balas (membuat `Comment` lewat action komentar yang sudah ada). Cursor pagination 20 per halaman.
- **Badge sidebar:** angka belum dibaca lewat `GET /api/notifications/unread-count` (polling 30 detik, hanya saat tab terlihat).
- **Pengingat tenggat:** `GET /api/cron/due-soon` (header `Authorization: Bearer $CRON_SECRET`), dijadwalkan harian lewat mekanisme cron di platform hosting.

### 9.4 Diskusi (chat grup per project, gaya panel chat kanan WhatsApp)
**Dua tempat, satu komponen `ChatPanel`:**
1. **Tab "Diskusi" di dalam project** (`/projects/[projectId]/discussion`): chat memenuhi lebar halaman, tanpa panel samping; user tetap di halaman project.
2. **Halaman global `/discussions`**: daftar project di kiri (340px: pencarian, filter Semua/Belum dibaca, pratinjau pesan terakhir, waktu, badge belum dibaca) dan `ChatPanel` project terpilih di kanan. Di layar kecil, daftar dan chat bergantian tampil.

**Akses: khusus anggota project.** Setiap baca/kirim/mention WAJIB lolos `requireProjectMember(projectId)` di server; mention hanya boleh menyebut anggota project itu.

**Tampilan `ChatPanel`:**
- Header: avatar project, nama, subjudul daftar nama anggota; tombol cari pesan dan menu.
- Strip "Pesan tersemat" tipis di bawah header (jika ada `pinnedAt`).
- Area pesan (scroll sendiri, tinggi tetap): penanda tanggal di tengah, pesan sistem (`kind = SYSTEM`), gelembung pesan sendiri di kanan (biru, tanda terbaca) dan pesan orang lain di kiri (nama pengirim berwarna), waktu di dalam gelembung, balasan berkutip (`replyTo`), mention, lampiran file (nama + ukuran).
- Komposer: tombol emoji dan lampiran, input berbentuk pil (ketik `@` memunculkan daftar anggota project), tombol kirim. Enter kirim, Shift+Enter baris baru.
- Catatan di awal percakapan: "Percakapan ini khusus anggota project."

**Data dan perilaku:**
- Kirim pesan = Server Action `sendMessageAction` (Zod, rate limit 30 pesan/menit/user lewat `lib/rate-limit.ts`). Pesan sistem dibuat oleh action lain (project dibuat, anggota bergabung) lewat repository.
- Pesan baru: **polling** `GET /api/projects/[projectId]/messages?after=<cursor>` tiap 5 detik hanya saat chat terbuka dan tab terlihat. Muat riwayat dengan cursor ke belakang (50 pesan per halaman). **Jangan** menambahkan WebSocket/library real-time tanpa konfirmasi (lihat Backlog).
- **Belum dibaca:** jumlah pesan milik orang lain dengan `createdAt > ProjectMember.lastReadAt`. `lastReadAt` diperbarui saat chat dibuka dan saat pesan baru terlihat.
- Lampiran lewat UploadThing (router `chatAttachment`, cek keanggotaan di `.middleware()`); simpan baris `Attachment` dengan `messageId`.
- Hapus pesan = soft delete (pemilik pesan, atau ADMIN untuk moderasi); tampilkan "Pesan ini dihapus".

### 9.5 Tim & Anggota
- **Global `/team`:** dropdown project, kartu ringkasan (Total Anggota, Admin, Wakil Admin, Member), kartu kode gabung (tampil untuk ADMIN dan DEPUTY_ADMIN, TIDAK tampil untuk MEMBER; tombol Salin dengan toast "Kode disalin"; jika kartu disembunyikan, empat kartu ringkasan mengisi lebar penuh), lalu tabel.
- **Tab "Anggota" di project:** komponen tabel yang sama untuk project itu, plus banner kode gabung. TIDAK ADA tombol "Undang Anggota" dan TIDAK ADA tabel/fitur undangan; satu-satunya cara masuk adalah kode gabung.
- **Tabel:** kolom Anggota (avatar atau inisial berwarna, nama tebal dengan akhiran "(kamu)", email), Peran (badge), Task Aktif, Bergabung (`joinedAt`, format `21 Sep 2026`, locale id-ID), tombol "Kelola" yang membuka dialog (Bagian 9.1).
- **Toolbar:** pil filter peran dengan jumlah, pencarian nama/email (debounce 300 ms), urutan (`joined_desc` default, `joined_asc`, `name_asc`, `name_desc`), pagination (10/25/50 per halaman). Pencarian, filter, urutan, dan pagination dikerjakan di database. State di URL (`project`, `role`, `q`, `sort`, `page`, `pageSize`).
- **Task Aktif** = jumlah task project itu (lewat `TaskList.projectId`) dengan `assigneeId` = user itu, `status != DONE`, `deletedAt = null`; hitung satu halaman sekaligus dengan satu query `groupBy`, bukan query per baris.
- TIDAK ada kartu informasi "Hak akses peran" di halaman ini (sengaja dihapus). Penjelasan singkat peran hanya muncul di dialog Kelola anggota dan di Pengaturan project.
- Tabel TIDAK boleh punya scroll internal (tidak ada `max-height`/`overflow-y` pada daftar baris); jumlah baris dibatasi pagination dan hanya halaman yang scroll.

### 9.6 Task Saya dan Kalender
- **`/tasks` (Task Saya):** task yang `assigneeId`-nya user saat ini, dikelompokkan per project (accordion buka/tutup, project pertama terbuka). Baris: centang bulat, judul, penanggung jawab, prioritas, tenggat, status. Filter member (dropdown dengan pencarian), filter status, pencarian, urutan tenggat. Kartu ringkasan: Total, Belum, Dikerjakan, Selesai.
- **`/calendar` (Kalender):** grid bulan (Senin–Minggu, zona Asia/Jakarta) dari `Task.dueDate` task di project yang diikuti. Warna per status. Navigasi bulan, tombol "Hari ini", toggle Bulan/Minggu/Agenda. Panel samping satu card "Agenda" (tinggi tetap, scroll di dalam): Hari ini dan Mendatang. Filter member dalam dropdown (bukan chip). Satu hari dengan banyak task menampilkan 2 task + "+N lagi". Tidak ada tombol "Buat task" di halaman ini.

### 9.7 Laporan
`/reports`: filter project, member, rentang waktu (7/30/90 hari); tombol Ekspor (CSV) hanya jika diminta eksplisit (Backlog).
- **KPI:** Task Selesai (`DONE` dalam rentang `completedAt`), Tingkat Penyelesaian (selesai ÷ total task project terpilih), Task Terlambat (status ≠ `DONE` dan `dueDate` < awal hari ini WIB), Rata-rata Penyelesaian (rata-rata `completedAt − createdAt` dalam hari).
- **Grafik (komponen SVG sendiri):** batang task selesai per minggu (6 minggu), donut distribusi status, batang bertumpuk beban kerja per anggota, progres per project.
- **Tabel:** task terlambat (task, project, penanggung jawab, tenggat, lama terlambat).
- Semua angka dihitung di `repositories/report.repository.ts` dengan query agregat (`groupBy`/`count`), bukan memuat semua task lalu menghitung di JS.

### 9.8 Pengaturan Project (khusus Admin)
Route `/projects/[projectId]/settings`; tab disembunyikan untuk non-ADMIN dan route menolak mereka (403). Tata letak: menu bagian di kiri (Umum, Kode gabung, Label, Peran dan izin, Zona berbahaya) dan **satu panel isi di kanan sesuai pilihan**, dengan baris pengaturan berpola label-kiri/kontrol-kanan dan footer tombol Batal/Simpan. TIDAK ada banner "halaman ini hanya terlihat oleh Admin".
- **Umum:** nama (1–100), deskripsi (maks 500), tanggal dibuat (baca saja).
- **Kode gabung:** tampilkan kode, Salin, "Buat ulang kode", saklar `joinEnabled`.
- **Label:** daftar label (swatch warna, nama, ubah, hapus soft delete), "+ Label baru".
- **Peran dan izin:** jumlah per peran + link ke tab Anggota.
- **Zona berbahaya:** hapus project (soft delete) dengan dialog yang meminta mengetik nama project.

### 9.9 Ringkasan Project
Tab pertama project (`/projects/[projectId]`): Tenggat terdekat, Beban kerja anggota, Aktivitas terbaru (5 log), kartu Tentang project, donut Status task, ringkasan Anggota. Semua dihitung dari tabel yang ada; tidak ada field baru.

## 10. Struktur Folder Lengkap

```
project-management-app/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                      # navbar + sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx                    # Project Saya (card)
│   │   │   ├── new/page.tsx
│   │   │   ├── join/page.tsx
│   │   │   └── [projectId]/
│   │   │       ├── layout.tsx              # header project + tab
│   │   │       ├── page.tsx                # tab Ringkasan
│   │   │       ├── tasks/page.tsx          # tab Task (?view=board|list)
│   │   │       ├── members/page.tsx        # tab Anggota
│   │   │       ├── discussion/page.tsx     # tab Diskusi
│   │   │       ├── activity/page.tsx       # tab Aktivitas
│   │   │       └── settings/page.tsx       # tab Pengaturan (ADMIN)
│   │   ├── tasks/page.tsx                  # Task Saya
│   │   ├── calendar/page.tsx
│   │   ├── inbox/page.tsx
│   │   ├── team/page.tsx                   # Tim & Anggota (global)
│   │   ├── discussions/page.tsx            # Diskusi (global, gaya WhatsApp)
│   │   ├── activity/page.tsx               # Aktivitas (global)
│   │   ├── reports/page.tsx
│   │   └── profile/page.tsx
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── uploadthing/{core.ts,route.ts}
│       ├── projects/[projectId]/messages/route.ts   # GET polling
│       ├── notifications/unread-count/route.ts      # GET
│       └── cron/due-soon/route.ts                   # GET (CRON_SECRET)
│
├── actions/                    # "use server" — otorisasi + Zod + orchestration
│   ├── project.actions.ts
│   ├── list.actions.ts
│   ├── task.actions.ts
│   ├── comment.actions.ts
│   ├── label.actions.ts
│   ├── user.actions.ts
│   ├── member.actions.ts          # [BARU] ubah peran, hapus anggota
│   ├── message.actions.ts         # [BARU] kirim/hapus/semat pesan, tandai dibaca
│   └── notification.actions.ts    # [BARU] tandai dibaca / semua dibaca
│
├── repositories/               # query Prisma murni
│   ├── project.repository.ts
│   ├── list.repository.ts
│   ├── task.repository.ts
│   ├── comment.repository.ts
│   ├── label.repository.ts
│   ├── user.repository.ts
│   ├── member.repository.ts        # [BARU]
│   ├── message.repository.ts       # [BARU]
│   ├── notification.repository.ts  # [BARU]
│   ├── activity.repository.ts      # [BARU]
│   ├── attachment.repository.ts    # [BARU]
│   └── report.repository.ts        # [BARU]
│
├── components/
│   ├── ui/                     # button, input, dialog, avatar, badge, toggle, dropdown, theme-toggle
│   ├── board/                  # Board, TaskList, TaskCard
│   ├── task/                   # TaskDetailModal, TaskForm, CommentSection, LabelPicker
│   ├── project/                # ProjectCard, ProjectHeader, ProjectTabs, ProjectForm
│   ├── members/                # [BARU] MemberTable, MemberFilterDropdown, RoleBadge, MemberMenu
│   ├── chat/                   # [BARU] ChatPanel, MessageBubble, Composer, ConversationList
│   ├── inbox/                  # [BARU] NotificationList, NotificationDetail
│   ├── activity/               # [BARU] ActivityFeed
│   ├── calendar/               # [BARU] MonthGrid, AgendaPanel
│   ├── charts/                 # [BARU] BarChart, DonutChart, StackedBar (SVG manual)
│   ├── search/                 # SearchFilterBar
│   └── layout/                 # Navbar, Sidebar, SidebarNav, SidebarUser
│
├── lib/
│   ├── prisma.ts                # singleton + adapter pg + soft-delete extension
│   ├── auth.ts                  # NextAuth config
│   ├── auth-guards.ts           # [BARU] requireUser, requireProjectMember
│   ├── permissions.ts           # [BARU] canCreateTask, canManageMembers, ...
│   ├── activity.ts              # [BARU] logActivity
│   ├── notify.ts                # [BARU] createNotification helpers
│   ├── mentions.ts              # [BARU] extractMentions, render token @[userId]
│   ├── date.ts                  # [BARU] APP_TIMEZONE, startOfDayWIB, formatID, dll
│   ├── rate-limit.ts
│   ├── uploadthing.ts
│   ├── selects/                 # task, project, user, member, message, notification, activity
│   ├── validations/             # task, project, comment, label, auth, message, member, notification
│   ├── providers/theme-provider.tsx
│   └── utils.ts                 # generateJoinCode, dll
│
├── types/index.ts
├── proxy.ts
├── public/
├── .env  /  .env.example
├── next.config.js
├── tailwind.config.ts           # darkMode: "class"
├── tsconfig.json
└── package.json
```

Project TIDAK memakai folder `src/`.

## 11. Navigasi dan Layout

**Layout dashboard:** navbar atas sticky (brand di kiri, `ThemeToggle` pill Sun/Moon di kanan, tanpa tombol Buat) + sidebar kiri (tersembunyi di bawah `lg`; navbar menampilkan avatar + tombol keluar `lg:hidden` sebagai fallback). Sidebar sticky setinggi layar: area menu di tengah bisa di-scroll sendiri, "Pengaturan" (→ `/profile`) dan kartu user ("Profil Saya", "Keluar" lewat `logoutAction`) menempel di bawah. Modal create/join project menerima prop `className` dan `children` agar trigger bisa dipakai ulang di sidebar dan hero banner. Nama panjang di kartu user dipotong dengan ellipsis.

**Menu sidebar (dikelompokkan):**
- UTAMA: Dashboard, Project Saya, Task Saya, Kalender, Inbox (badge belum dibaca)
- KOLABORASI: Tim & Anggota, Diskusi, Aktivitas
- ANALITIK: Laporan

**Tab di dalam project (6):** Ringkasan | Task (jumlah) | Anggota (jumlah) | Diskusi (badge belum dibaca) | Aktivitas | Pengaturan (ikon gembok, hanya tampil untuk ADMIN). Tab "Task" memuat toggle **Board | Daftar** di toolbar (satu halaman, satu sumber data; filter cari/anggota/label berlaku untuk keduanya). Header project: tautan kembali ke Project Saya, nama, deskripsi, chip kode gabung (hanya ADMIN), peran user, tanggal dibuat, avatar anggota, tombol "+ Buat task" (hanya ADMIN dan DEPUTY_ADMIN), dan strip progres (1/3 task, persentase, hitungan per status).

**Halaman Project Saya:** kartu ringkasan (Total Project, Sebagai Admin, Sebagai Member, Project Selesai), tab filter, pencarian, urutan, toggle kartu/daftar, kartu project (badge peran, status turunan progres task, kode, progres, avatar, label deadline bila ada), plus kartu "Buat project baru" dan "Gabung via kode".

## 12. Roadmap Pengerjaan (Backend Dulu)

| Tahap | Pekerjaan |
|---|---|
| 1 | Setup project — `create-next-app`, dependencies (termasuk `dotenv`, `@prisma/adapter-pg`), `.env` + `.env.example`, `prisma.config.ts`, **database Neon (branch dev)** |
| 2 | Prisma schema inti (User, Project, ProjectMember, TaskList, Task, Label, Comment + `deletedAt`) + `pnpm prisma migrate dev` |
| 3 | `lib/prisma.ts` (adapter `PrismaPg` + extension soft delete), `lib/utils.ts` |
| 4 | Auth — NextAuth + Server Action register/login |
| 5 | `proxy.ts` — proteksi route dashboard |
| 6 | Project: create + join + regenerate code + rate limiting + cek duplikat member |
| 7 | List & Task CRUD (repository → action) |
| 8 | Label & Comment |
| 9 | Search & filter |
| 10 | Profile update (+ upload foto profil via UploadThing) |
| 11 | UI: Board drag-and-drop (`@dnd-kit`), komponen lainnya |
| 12 | Dark/Light theme toggle |
| **13 [BARU]** | **Role Wakil Admin:** enum `DEPUTY_ADMIN`, `ProjectMember.joinedAt`, `lib/permissions.ts`, `lib/auth-guards.ts`; audit semua pengecekan role; terapkan matriks izin ke action task yang sudah ada |
| **14 [BARU]** | **Tim & Anggota:** `member.repository` + `member.actions` (ubah peran, hapus anggota), halaman `/team` dan tab Anggota |
| **15 [BARU]** | **Aktivitas:** model `ActivityLog`, `lib/activity.ts`, sisipkan `logActivity` ke action yang ada, halaman `/activity` + tab project |
| **16 [BARU]** | **Inbox:** model `Notification`, `lib/notify.ts`, `lib/mentions.ts`, pemicu di action, halaman `/inbox`, endpoint unread-count, job `due-soon` |
| **17 [BARU]** | **Task Saya dan Kalender:** `/tasks`, `/calendar`, `lib/date.ts` |
| **18 [BARU]** | **Diskusi:** model `ProjectMessage` + `Attachment`, `ProjectMember.lastReadAt`, `ChatPanel`, endpoint polling, lampiran UploadThing, tab Diskusi dan `/discussions` |
| **19 [BARU]** | **Laporan:** `report.repository`, komponen chart SVG, `/reports` |
| **20 [BARU]** | **Pengaturan project + Ringkasan project:** `Project.joinEnabled`, panel pengaturan, tab Ringkasan, halaman Dashboard dan Project Saya final |
| **21 [BARU]** | **Production:** branch Neon produksi, `prisma migrate deploy`, cron `due-soon`, variabel lingkungan hosting |

Satu tahap = satu prompt = satu migrasi. Ikuti urutan kecuali user meminta lompat tahap. Tahap 13 harus selesai sebelum 14–20.

## 13. Upload File — Arsitektur UploadThing

File dikirim langsung dari browser ke server UploadThing (bukan lewat server aplikasi). Jangan membuat Server Action tambahan untuk proses upload.

File wajib:
- `app/api/uploadthing/core.ts` — `FileRouter`:
  - `profileImageUploader`: `.middleware()` cek auth, `.onUploadComplete()` menyimpan `file.url` ke `avatarUrl` lewat `updateUser`.
  - **[BARU]** `chatAttachment` dan `taskAttachment`: `.middleware()` memverifikasi `requireProjectMember(projectId)` (projectId dari input router), `.onUploadComplete()` membuat baris `Attachment` lewat `attachment.repository` (menyimpan `url`, `key`, `size`, `mimeType`, `messageId`/`taskId`) dan memanggil `logActivity` (`FILE_UPLOADED`).
- `app/api/uploadthing/route.ts` — handler `GET`/`POST` dari `createRouteHandler`.
- `lib/uploadthing.ts` — komponen bertipe via `generateUploadButton`/`generateUploadDropzone`.

`.env` wajib punya `UPLOADTHING_TOKEN` (bukan `UPLOADTHING_SECRET`). Saat `Attachment` di-soft-delete, hapus juga file di UploadThing lewat `key` (di dalam action, bukan di repository).

## 14. Catatan untuk AI Agent

- Project ini pakai Next.js 16, yang mengganti nama `middleware.ts` menjadi `proxy.ts` (export function-nya `proxy`). Selalu gunakan `proxy.ts`, JANGAN buat `middleware.ts`.
- Data dashboard memakai tipe `DashboardProject` (`types/index.ts`) dan select `projectDashboardSelect` (`lib/selects/project.select.ts`). `joinCode` HANYA dikirim ke client bila role user di project itu `ADMIN` atau `DEPUTY_ADMIN` (dipastikan di `findDashboardProjectsByUserId`, jangan dipindah ke client; untuk MEMBER field ini tidak ikut dikirim).
- Ikuti urutan roadmap kecuali user meminta lompat tahap.
- Setiap Server Action WAJIB: (1) otorisasi lewat `lib/auth-guards.ts` + `lib/permissions.ts`, (2) validasi Zod dari `lib/validations/`, baru (3) panggil `repositories/`.
- Setiap query Prisma memakai `select` eksplisit dari `lib/selects/` (bukan `include` tanpa filter) agar field sensitif tidak ter-expose.
- Konsisten TypeScript strict — hindari `any`.
- Semua komponen baru mengikuti dark mode dengan class Tailwind `dark:` sesuai `darkMode: "class"`.
- Jangan menambahkan dependency baru di luar tech stack tanpa konfirmasi (khususnya: library state management, kalender, chart, tanggal, real-time/WebSocket).
- Fungsi "delete" di repository untuk model bersoft-delete HARUS soft delete; setiap fungsi "read" HARUS menyertakan `deletedAt: null` (dijamin extension, tetapi jangan bergantung padanya untuk query mentah `$queryRaw`).
- Konfigurasi Prisma WAJIB lewat `prisma.config.ts` (bukan `package.json`, bukan `url` di `schema.prisma`) — lihat Bagian 5.
- Schema Prisma tetap SATU file (`prisma/schema.prisma`).
- Import Prisma Client SELALU dari `app/generated/prisma/client`, JANGAN dari `@prisma/client`.
- `lib/prisma.ts` WAJIB memakai driver adapter `PrismaPg`.
- Folder `app/generated/prisma` hasil auto-generate — jangan diedit manual, masuk `.gitignore`.
- Jangan pernah meng-commit `.env`. Jika kredensial Neon bocor, minta user menggantinya di dashboard Neon.
- **[BARU]** Jangan membuat elemen UI dummy untuk fitur yang belum ada backend-nya. Kalau tabel/endpoint untuk sebuah halaman belum ada, buat dulu (sesuai Bagian 6 dan roadmap), baru halamannya.
- **[BARU]** Setiap prompt halaman hanya mengerjakan halaman itu: jangan mengubah sidebar, header, layout global, atau halaman lain, kecuali perubahan izin yang diwajibkan Bagian 8.2.
- **[BARU]** Aturan akses SELALU dicek di server dan diuji lewat pemanggilan langsung (bukan hanya lewat tampilan).
- **[BARU]** Di akhir setiap tahap, tulis ringkasan: file yang diubah/dibuat, perintah migrasi, dan butir **[ASUMSI — KONFIRMASI USER]** yang dipakai.

## 15. Backlog — fitur tambahan (JANGAN dikerjakan kecuali diminta eksplisit)

Urut dari yang paling berguna:
1. **Command palette ⌘K** (pencarian global task/project/anggota).
2. **Upgrade chat ke real-time** (Pusher/Ably/SSE) setelah versi polling stabil.
3. **Timeline/Gantt** untuk jadwal task.
4. **Ekspor laporan** (CSV/PDF).
5. **Notifikasi email** (task ditugaskan, mention, pengingat tenggat) + preferensi notifikasi per user.
6. Subtask/checklist dan template task.
7. Reaksi pada pesan, pencarian pesan penuh, pengeditan pesan.
8. Dokumen & File terpusat per project (daftar semua `Attachment`).
9. Keamanan lanjutan: 2FA, riwayat login, rate limiting berbasis Redis (menggantikan `Map` in-memory).
10. i18n (ID/EN).

## Riwayat Revisi
- **Revisi ini:** menambah role Wakil Admin, Inbox, Diskusi, Aktivitas, Laporan, Kalender, Task Saya, Tim & Anggota, Pengaturan dan Ringkasan project; tabel baru `ProjectMessage`, `Notification`, `Attachment`, `ActivityLog` (+ field `joinedAt`, `lastReadAt`, `joinEnabled`, `completedAt`, `createdById`, `lastActiveAt`); pindah ke database Neon; memperbarui schema (Bagian 6 sekarang satu schema tunggal yang konsisten dengan generator `prisma-client`); memperbarui daftar "Elemen UI yang sengaja tidak ada"; menambah matriks izin, pengecualian route handler, dan roadmap tahap 13–21.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->