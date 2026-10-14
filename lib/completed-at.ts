type TaskStatusValue = "TODO" | "IN_PROGRESS" | "DONE";

export interface ResolveCompletedAtInput {
  /** Status saat ini; `null`/`undefined` saat membuat task baru. */
  currentStatus?: TaskStatusValue | null;
  /** `completedAt` saat ini; `null`/`undefined` saat membuat task baru. */
  currentCompletedAt?: Date | null;
  /** Status yang dituju. */
  nextStatus: TaskStatusValue;
  /** Injectable untuk test; default `new Date()`. */
  now?: Date;
}

/**
 * ATURAN TUNGGAL `Task.completedAt` (dipakai SEMUA jalur yang menulis status):
 * - menjadi DONE dan `completedAt` masih null → isi `now`
 * - DONE kembali ke status lain → null-kan
 * - status tetap DONE → biarkan (jangan sentuh field-nya)
 * - membuat task langsung DONE → `now`
 *
 * Mengembalikan:
 * - `Date` → nilai yang harus ditulis,
 * - `null` → hapus nilai (set null),
 * - `undefined` → JANGAN sentuh field `completedAt` (ikut nilai yang sudah ada).
 */
export function resolveCompletedAt(input: ResolveCompletedAtInput): Date | null | undefined {
  if (input.nextStatus === "DONE") {
    return input.currentCompletedAt == null ? (input.now ?? new Date()) : undefined;
  }
  return input.currentCompletedAt != null ? null : undefined;
}
