# Project Instructions — Project Management Mini App

> File ini adalah sumber kebenaran (source of truth) untuk AI coding agent (Claude Code, Cursor, dll) yang mengerjakan project ini. Ikuti semua keputusan arsitektur, struktur folder, dan konvensi di bawah ini secara konsisten. Jangan mengubah keputusan yang sudah ditetapkan tanpa konfirmasi ke user.

## 1. Ringkasan Project

Aplikasi manajemen tugas berbasis board (mirip Trello versi mini), full-stack, dibuat sebagai proyek portofolio. Fokus pada implementasi yang solid dan best-practice, bukan fitur sebanyak-banyaknya.

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js (App Router) |
| Bahasa | TypeScript |
| UI Library | React |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| ORM | Prisma — generator `prisma-client` (pola terbaru, ESM-first, bukan `prisma-client-js`) |
| Koneksi Database | Driver adapter `@prisma/adapter-pg`, dikonfigurasi lewat `prisma.config.ts` (bukan langsung di `schema.prisma`) |
| Auth | NextAuth.js (Auth.js) — Credentials Provider |
| Drag & Drop | `@dnd-kit` |
| Validasi | Zod |
| Data mutation | Server Actions (bukan REST API terpisah, kecuali NextAuth route handler) |
| State management | React `useState` bawaan + `revalidatePath` (tanpa Zustand/React Query/SWR) |
| Theme | `next-themes` (dark/light mode, strategi `class`) |
| Upload File | UploadThing (`uploadthing` + `@uploadthing/react`) — untuk foto profil, token via `UPLOADTHING_TOKEN` di `.env` |
| Modal/Dialog | `@radix-ui/react-dialog` (primitive tanpa styling bawaan), di-style manual pakai Tailwind lewat wrapper `components/ui/dialog.tsx` — BUKAN full shadcn/ui CLI |
| Font | Plus Jakarta Sans lewat `next/font/google` (variabel CSS `--font-jakarta`), di-set langsung di `body` pada `globals.css`. JANGAN kembali ke `font-family: Arial` bawaan template |

**Aturan penting:** Jangan menambahkan library state management (Zustand, Redux, React Query) kecuali diminta eksplisit. Prioritaskan pola Server Actions + `revalidatePath` untuk sinkronisasi data.

## 3. Daftar Fitur

| No | Fitur | Detail |
|---|---|---|
| 1 | Board/List view | Kolom status: To Do, In Progress, Done |
| 2 | Task CRUD | Buat, edit, hapus task — judul & deskripsi |
| 3 | Due date | Tanggal deadline per task |
| 4 | Task status | Todo / In Progress / Done |
| 5 | Assignee | Task di-assign ke salah satu member project |
| 6 | Auth & multi-user | Login, register, role Admin/Member per project |
| 7 | Comment di task | Diskusi per task antar member — bisa create, edit (dengan badge "diedit" via `updatedAt`), dan delete (hanya oleh pembuat komentar) |
| 8 | Label/Tag | Kategori berwarna (bug, feature, urgent, dll) |
| 9 | Search & filter | Cari task by nama, filter by assignee/label/status |
| 10 | Profile | Lihat & edit profil (nama, avatar, bio) |
| 11 | Project via Join Code | Buat project (jadi Admin) atau gabung pakai kode (jadi Member) |
| 12 | Dark/Light theme | Toggle manual, tersimpan di localStorage via `next-themes` |
| 13 | Soft Delete | Data yang "dihapus" tidak benar-benar hilang dari database, ditandai `deletedAt` |

## 4. Prinsip Arsitektur — WAJIB DIIKUTI

**Role tidak melekat pada User secara global.** Role (`ADMIN`/`MEMBER`) disimpan di tabel penghubung `ProjectMember`, karena satu user bisa jadi Admin di satu project dan Member di project lain. Jangan pernah menambahkan field `role` langsung ke model `User`.

**Alur satu arah untuk semua operasi data:**
```
Component (UI)
   ↓
actions/          → validasi input (Zod) + orchestration + revalidatePath
   ↓
repositories/     → query Prisma murni (pakai lib/selects/)
   ↓
Database (PostgreSQL)
```
- `actions/` TIDAK BOLEH memanggil `prisma` langsung — harus lewat `repositories/`.
- `repositories/` TIDAK BOLEH melakukan validasi atau `revalidatePath` — murni query data.
- Field sensitif (`password`) TIDAK BOLEH pernah di-`select` kecuali untuk proses autentikasi internal.

**Typing di `repositories/` WAJIB pakai interface eksplisit per operasi, TIDAK BOLEH inline object type.** Setiap file repository mendefinisikan sendiri interface input-nya di bagian atas file, dengan penamaan konsisten: `Create<Model>Input`, `Update<Model>Input`, `FindAll<Model>Input`, dst — mengikuti field yang benar-benar relevan untuk operasi itu (boleh lebih ringkas dari tipe Prisma otomatis, tidak perlu ikut semua field relasi).

**Repository berbentuk function biasa yang di-export langsung, BUKAN `class` dengan constructor/dependency injection.** Pola `class UserRepository { constructor(private prisma) {...} }` (umum di NestJS) TIDAK dipakai di project ini, karena Next.js App Router (Server Actions) tidak punya dependency injection container bawaan — pakai `class` di sini cuma menambah boilerplate tanpa manfaat. Contoh pola yang benar:
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

**Soft delete wajib diterapkan** pada model: `Project`, `TaskList`, `Task`, `Label`, `Comment`. Model `User` dan `ProjectMember` TIDAK memakai soft delete (hard delete tetap dipakai untuk keduanya).
- Aksi "hapus" pada model-model di atas TIDAK BOLEH melakukan `prisma.<model>.delete()` — harus diganti jadi `update()` yang mengisi field `deletedAt` dengan waktu saat ini.
- Setiap query "read" (`findMany`, `findFirst`, dll) pada model-model tersebut WAJIB menyaring `deletedAt: null`, supaya data yang sudah di-soft-delete tidak muncul kembali.
- Disarankan menerapkan filter ini secara global lewat Prisma Client Extension di `lib/prisma.ts`, bukan ditulis manual berulang di tiap repository, untuk menghindari lupa filter di salah satu query.
- Fitur restore (mengembalikan `deletedAt` ke `null`) dan halaman "Trash/Recently Deleted" bersifat opsional, boleh ditambahkan belakangan setelah CRUD dasar selesai.

## 5. Prisma Setup — Generator, Datasource, dan Konfigurasi

Project ini memakai **pola Prisma terbaru** dengan generator `prisma-client` dan driver adapter, BUKAN pola klasik `prisma-client-js`. Ini keputusan final — jangan diubah kembali ke pola lama tanpa konfirmasi user.

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

Catatan penting:
- `datasource db` di sini **TIDAK** berisi `url` — koneksi database dikonfigurasi terpisah di `prisma.config.ts`.
- `output` menentukan lokasi Prisma Client hasil generate, yaitu di `app/generated/prisma`. Prisma versi ini TIDAK membuat `index.ts` di folder tersebut — import Prisma Client harus eksplisit ke file `client`-nya: `app/generated/prisma/client`, BUKAN dari `@prisma/client` maupun dari nama folder saja.

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
    url: process.env.DATABASE_URL,
  },
});
```

File ini menggantikan peran `url = env("DATABASE_URL")` yang dulunya ada langsung di `schema.prisma`. WAJIB ada package `dotenv` ter-install supaya `process.env.DATABASE_URL` terbaca saat Prisma CLI dijalankan (`migrate`, `studio`, dll).

### Driver Adapter — Wajib untuk Koneksi Database

Karena pakai generator `prisma-client` (bukan `prisma-client-js`), Prisma Client di kode **tidak bisa connect ke database secara langsung** — wajib pakai **driver adapter**. Untuk PostgreSQL, package yang dipakai: **`@prisma/adapter-pg`**.

Konsekuensi di `lib/prisma.ts`:
- Buat instance `PrismaPg` (dari `@prisma/adapter-pg`) dengan `connectionString` dari `DATABASE_URL`.
- Pasangkan adapter itu ke `PrismaClient` saat inisialisasi (`new PrismaClient({ adapter })`).
- Import `PrismaClient` dari path hasil generate (`app/generated/prisma/client`), bukan `@prisma/client`.

### Package Tambahan yang Wajib Ter-install

```bash
pnpm add dotenv @prisma/adapter-pg
```

## 6. Prisma Schema — Data Model Lengkap

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  password      String
  avatarUrl     String?
  bio           String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  memberships   ProjectMember[]
  assignedTasks Task[]    @relation("TaskAssignee")
  comments      Comment[]
}

model Project {
  id          String    @id @default(cuid())
  name        String
  description String?
  joinCode    String    @unique
  createdAt   DateTime  @default(now())
  deletedAt   DateTime? // soft delete

  members     ProjectMember[]
  lists       TaskList[]
  labels      Label[]
}

model ProjectMember {
  id        String   @id @default(cuid())
  role      Role     @default(MEMBER)

  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([userId, projectId])
}

enum Role {
  ADMIN
  MEMBER
}

model TaskList {
  id        String    @id @default(cuid())
  name      String
  order     Int
  deletedAt DateTime? // soft delete

  projectId String
  project   Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks     Task[]
}

model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  dueDate     DateTime?
  order       Int
  createdAt   DateTime   @default(now())
  deletedAt   DateTime?  // soft delete

  listId      String
  list        TaskList   @relation(fields: [listId], references: [id], onDelete: Cascade)

  assigneeId  String?
  assignee    User?      @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)

  labels      Label[]    @relation("TaskLabels")
  comments    Comment[]
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

model Label {
  id        String    @id @default(cuid())
  name      String
  color     String
  deletedAt DateTime? // soft delete

  projectId String
  project   Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks     Task[]    @relation("TaskLabels")
}

model Comment {
  id        String    @id @default(cuid())
  content   String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt // dipakai untuk fitur edit komentar + badge "(diedit)"
  deletedAt DateTime? // soft delete

  taskId    String
  task      Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Catatan relasi:** `onDelete: Cascade` dipasang di semua relasi turunan (Project → TaskList → Task → Comment/Label) supaya kalau ada hard delete di level atas, data anak tidak jadi data yatim di database. `assignee` pada `Task` pakai `onDelete: SetNull` karena kalau User dihapus, task-nya tidak perlu ikut hilang — cukup jadi unassigned.

## 7. Zod Validation — Batas Tiap Field

| Field | Batas | Alasan |
|---|---|---|
| `name` (user) | 2–50 karakter | Nama pendek, cegah spam |
| `name` (project) | 1–100 karakter | Nama project |
| `email` | max 255, format email valid | Standar |
| `password` | 8–72 karakter, minimal 1 huruf besar & 1 angka | 72 = limit fisik bcrypt |
| `bio` | max 160 karakter | Konvensi umum (ala Twitter) |
| `project description` | max 500 karakter | Ringkas tapi cukup detail |
| `task title` | 1–200 karakter | Judul singkat |
| `task description` | max 2000 karakter | Boleh lebih detail |
| `comment content` | 1–1000 karakter | Cukup panjang untuk diskusi |
| `label name` | 1–30 karakter | Tampil sebagai badge kecil |
| `label color` | regex hex `^#[0-9A-Fa-f]{6}$` | Validasi format warna |

## 8. Auth & Authorization Flow

```
Register/Login → hanya bikin akun, TIDAK ada pilihan role saat register/login
   ↓
Dashboard → dua aksi utama:
   ├─ Buat Project → auto jadi ADMIN + generate joinCode unik (8 karakter)
   └─ Gabung Project → input joinCode → jadi MEMBER (jika valid)
   ↓
proxy.ts memproteksi semua route di dalam (dashboard)/*
   ↓
Setiap akses ke project tertentu: cek ulang apakah user adalah member project ini,
dan apa role-nya (untuk menentukan izin aksi, misal hapus project = admin only)
```

### Keamanan Join Code (wajib diimplementasikan)
1. **Regenerate code** — Admin bisa generate ulang joinCode kapan saja dari halaman settings project (kode lama otomatis tidak berlaku karena di-overwrite).
2. **Rate limiting** — maksimal 5 percobaan join per menit per user (in-memory `Map`-based limiter di `lib/rate-limit.ts`; cukup untuk skala portofolio, catat sebagai batasan known-limitation di README).
3. **Cek duplikat member** — sebelum insert `ProjectMember`, cek dulu apakah user sudah jadi member project tersebut. Jika sudah, kembalikan pesan error yang ramah, jangan andalkan Prisma constraint error mentah.

### Generate Join Code
Gunakan `nanoid` dengan alphabet custom (tanpa karakter ambigu 0/O, 1/I), panjang 8 karakter:

```typescript
import { customAlphabet } from "nanoid"
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8)
export function generateJoinCode(): string {
  return nanoid()
}
```

## 9. Struktur Folder Lengkap

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
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── projects/
│   │   │   ├── new/page.tsx
│   │   │   ├── join/page.tsx
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx
│   │   │       └── settings/page.tsx
│   │   └── profile/page.tsx
│   │
│   └── api/
│       └── auth/[...nextauth]/route.ts
│
├── actions/                    # Business logic — "use server"
│   ├── project.actions.ts
│   ├── list.actions.ts
│   ├── task.actions.ts
│   ├── comment.actions.ts
│   ├── label.actions.ts
│   └── user.actions.ts
│
├── repositories/                # Data access layer (Prisma query murni)
│   ├── project.repository.ts
│   ├── list.repository.ts
│   ├── task.repository.ts
│   ├── comment.repository.ts
│   ├── label.repository.ts
│   └── user.repository.ts
│
├── components/
│   ├── ui/                     # button, input, modal, avatar, badge, theme-toggle
│   ├── board/                  # Board, TaskList, TaskCard
│   ├── task/                   # TaskDetailModal, TaskForm, CommentSection, LabelPicker
│   ├── project/                # ProjectCard, ProjectForm, MemberList
│   ├── search/                 # SearchFilterBar
│   └── layout/                 # Navbar, Sidebar
│
├── lib/
│   ├── prisma.ts                # Prisma client singleton
│   ├── auth.ts                  # NextAuth config
│   ├── rate-limit.ts            # In-memory rate limiter
│   ├── selects/                 # Prisma select objects reusable
│   │   ├── task.select.ts
│   │   ├── project.select.ts
│   │   └── user.select.ts
│   ├── validations/             # Zod schemas
│   │   ├── task.schema.ts
│   │   ├── project.schema.ts
│   │   ├── comment.schema.ts
│   │   ├── label.schema.ts
│   │   └── auth.schema.ts
│   ├── providers/
│   │   └── theme-provider.tsx   # Wrapper next-themes
│   └── utils.ts                 # generateJoinCode, dll
│
├── types/
│   └── index.ts
│
├── proxy.ts                    # Proteksi route (dashboard)/*
├── public/
├── .env
├── next.config.js
├── tailwind.config.ts           # darkMode: "class"
├── tsconfig.json
└── package.json
```

**Catatan:** project ini TIDAK memakai folder `src/` — semua folder (`app/`, `actions/`, `repositories/`, `components/`, `lib/`, `types/`, `proxy.ts`) berada langsung di root project.

## 10. Roadmap Pengerjaan (Backend Dulu)

| Tahap | Pekerjaan |
|---|---|
| 1 | Setup project — `create-next-app`, install dependencies (termasuk `dotenv`, `@prisma/adapter-pg`), konfigurasi `.env` dan `prisma.config.ts` |
| 2 | Prisma schema lengkap (termasuk field `deletedAt`) + `pnpm prisma migrate dev` |
| 3 | `lib/prisma.ts` (PrismaClient + driver adapter `PrismaPg`), `lib/utils.ts` (generateJoinCode, dll) |
| 4 | Auth — NextAuth config + Server Action register/login |
| 5 | `proxy.ts` — proteksi route dashboard |
| 6 | Project: create + join + regenerate code + rate limiting + cek duplikat member |
| 7 | List & Task CRUD (repository → action) |
| 8 | Label & Comment |
| 9 | Search & filter |
| 10 | Profile update (termasuk upload foto profil via UploadThing) |
| 11 | UI: Board drag-and-drop (`@dnd-kit`), komponen lainnya |
| 12 | Dark/Light theme toggle (`next-themes`) |

## 10.1 Upload Foto Profil — Arsitektur UploadThing

Fitur upload foto profil **tidak mengikuti pola Server Actions** seperti fitur lain di project ini — file dikirim langsung dari browser ke server UploadThing (bukan lewat server aplikasi kita), lalu callback `onUploadComplete` yang otomatis update `avatarUrl` di database. Jangan bikin Server Action tambahan untuk proses upload-nya.

File yang wajib ada:
- `app/api/uploadthing/core.ts` — definisi `FileRouter` (`profileImageUploader`), berisi `.middleware()` untuk cek auth dan `.onUploadComplete()` untuk simpan `file.url` ke `avatarUrl` lewat `updateUser` dari `repositories/user.repository.ts`
- `app/api/uploadthing/route.ts` — route handler (`GET`/`POST`) dari `createRouteHandler`
- `lib/uploadthing.ts` — generate komponen bertipe (`UploadButton`, `UploadDropzone`) via `generateUploadButton`/`generateUploadDropzone` dari `@uploadthing/react`

`.env` wajib punya `UPLOADTHING_TOKEN` (bukan `UPLOADTHING_SECRET` — itu nama variabel versi lama).

## 11. Catatan untuk AI Agent

- Project ini pakai Next.js 16, yang mengganti nama konvensi file `middleware.ts` menjadi `proxy.ts` (export function-nya juga berubah dari `middleware` menjadi `proxy`). Selalu gunakan nama `proxy.ts`, JANGAN buat `middleware.ts`.
- Data dashboard memakai tipe `DashboardProject` (`types/index.ts`) dan select `projectDashboardSelect` (`lib/selects/project.select.ts`). `joinCode` HANYA dikirim ke client bila role user di project itu `ADMIN` (dipastikan di `findDashboardProjectsByUserId`, jangan dipindah ke client).
- Layout dashboard: top navbar sticky (hanya brand di kiri dan `ThemeToggle` berbentuk pill Sun/Moon di pojok kanan, TANPA tombol Buat) + sidebar kiri (hidden di bawah `lg`). Sidebar berisi tombol Buat/Gabung project, `SidebarNav`, dan di paling bawah `SidebarUser` (kartu user + "Profil Saya" + "Keluar"). Karena sidebar tersembunyi di layar kecil, navbar menampilkan avatar + tombol keluar khusus `lg:hidden` sebagai fallback. Logout lewat `logoutAction` di `actions/user.actions.ts`. Modal create/join project menerima prop `className` dan `children` agar trigger-nya bisa dipakai ulang di sidebar dan hero banner.
- Elemen UI yang SENGAJA TIDAK ADA karena tidak didukung backend (jangan ditambahkan sebagai UI dummy/hardcode): workspace selector, global search ⌘K, notifikasi, storage meter, kategori/status/deadline project, menu My Tasks / Team Members / Analytics. Status project di kartu adalah turunan dari progres task, bukan field database.

- Ikuti urutan roadmap di atas kecuali user meminta lompat tahap.
- Setiap kali membuat fungsi di `actions/`, WAJIB validasi dengan Zod schema dari `lib/validations/` sebelum memanggil `repositories/`.
- Setiap kali membuat query Prisma, gunakan `select` eksplisit dari `lib/selects/` (bukan `include` tanpa filter), untuk menghindari field sensitif ter-expose.
- Konsisten pakai TypeScript strict — hindari `any`.
- Semua komponen baru mengikuti dark mode dengan class Tailwind `dark:` sesuai `darkMode: "class"`.
- Jangan menambahkan dependency baru di luar tech stack yang sudah ditentukan tanpa konfirmasi.
- Untuk model `Project`, `TaskList`, `Task`, `Label`, `Comment`: fungsi "delete" di repository HARUS berupa soft delete (`update` mengisi `deletedAt`), BUKAN `delete()` biasa. Setiap fungsi "read" pada model-model ini HARUS menyertakan filter `deletedAt: null`.
- Konfigurasi Prisma WAJIB memakai `prisma.config.ts` (bukan konfigurasi lewat `package.json` maupun `url` langsung di `schema.prisma`) — lihat Bagian 5.
- Schema Prisma tetap dalam SATU file (`prisma/schema.prisma`) — tidak dipecah jadi multi-file, karena jumlah model masih sedikit (7 model).
- Import Prisma Client SELALU dari path hasil generate (`app/generated/prisma/client`), JANGAN dari `@prisma/client` — karena generator yang dipakai adalah `prisma-client`, bukan `prisma-client-js`.
- `lib/prisma.ts` WAJIB menginisialisasi `PrismaClient` dengan driver adapter (`PrismaPg` dari `@prisma/adapter-pg`), bukan konstruktor `PrismaClient()` tanpa argumen.
- Folder `app/generated/prisma` adalah hasil auto-generate — jangan diedit manual, dan tambahkan ke `.gitignore`.