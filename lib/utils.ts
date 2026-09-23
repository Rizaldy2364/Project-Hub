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