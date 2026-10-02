import { customAlphabet } from "nanoid";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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