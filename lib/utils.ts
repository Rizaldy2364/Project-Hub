import { customAlphabet } from "nanoid";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Zona waktu tampilan aplikasi (AGENTS.md Bagian 2): DateTime disimpan dalam
// UTC di database, "hari ini / kemarin" dihitung dan ditampilkan dalam
// Asia/Jakarta.
export const APP_TIMEZONE = "Asia/Jakarta";

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Kunci hari "YYYY-MM-DD" menurut zona APP_TIMEZONE. */
export function wibDayKey(date: Date | string): string {
  return dayKeyFormatter.format(typeof date === "string" ? new Date(date) : date);
}

/** Selisih hari (target − base) berdasarkan kunci hari WIB (bulat). */
export function wibDayDiff(base: Date | string, target: Date | string): number {
  const b = Date.parse(`${wibDayKey(base)}T00:00:00Z`);
  const t = Date.parse(`${wibDayKey(target)}T00:00:00Z`);
  return Math.round((t - b) / 86_400_000);
}

/**
 * Awal hari (00:00) menurut zona WIB, dikembalikan sebagai Date yang tepat.
 * WIB = UTC+7 tanpa DST, jadi aman dihitung tetap.
 */
export function startOfDayWib(now: Date = new Date()): Date {
  return new Date(`${wibDayKey(now)}T00:00:00+07:00`);
}

/** "5 Okt" — tanggal dalam WIB, locale id-ID. */
export function formatDayMonthWib(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: APP_TIMEZONE,
  }).format(date);
}

/**
 * Label untuk kunci hari WIB "YYYY-MM-DD" → "31 Agu". Kunci itu sendiri sudah
 * kalender WIB, jadi diformat dengan zona UTC agar tidak bergeser satu hari.
 */
export function formatWibDayKey(dayKey: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${dayKey}T00:00:00Z`));
}

/**
 * Rentang satu minggu dari kunci hari awal "YYYY-MM-DD" (Senin, kalender WIB).
 * Minggu = 7 hari (Senin..Minggu). Mengembalikan:
 * - `range` (tanpa tahun): bulan sama "12–18 Okt"; lintas bulan/tahun "28 Sep–4 Okt".
 * - `withYear` (tahun awal minggu): "12–18 Okt 2026" — untuk tooltip/aria-label/tabel.
 */
export function formatWibWeekRange(
  weekStartKey: string
): { range: string; withYear: string } {
  const start = new Date(`${weekStartKey}T00:00:00Z`);
  const end = new Date(start.getTime() + 6 * 86_400_000);
  const parts = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const pick = (date: Date, type: string) =>
    parts.formatToParts(date).find((p) => p.type === type)?.value ?? "";

  const startDay = pick(start, "day");
  const startMonth = pick(start, "month");
  const startYear = pick(start, "year");
  const endDay = pick(end, "day");
  const endMonth = pick(end, "month");
  const endYear = pick(end, "year");

  const sameMonth = startMonth === endMonth && startYear === endYear;
  const range = sameMonth
    ? `${startDay}–${endDay} ${endMonth}`
    : `${startDay} ${startMonth}–${endDay} ${endMonth}`;
  return { range, withYear: `${range} ${startYear}` };
}

// Generate join code untuk project (8 karakter, tanpa 0/O/1/I biar gak ambigu)
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

export function generateJoinCode(): string {
  return nanoid();
}

// Gabungin className Tailwind dengan aman (hindari konflik/duplikat class)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Hitung umur (tahun) dari tanggal lahir. Umur TIDAK disimpan di database,
// supaya tidak pernah basi — selalu dihitung dari tanggal lahir.
export function calculateAge(birthDate: Date | string): number {
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  if (Number.isNaN(birth.getTime())) return 0;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

// Kunci unik per tanggal (lokal) — "YYYY-MM-DD". Dipakai grid kalender.
export function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}