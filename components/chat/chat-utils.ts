import { APP_TIMEZONE, wibDayDiff } from "@/lib/utils";

// ===== Util tampilan Diskusi (semua dihitung di zona Asia/Jakarta) =====

/** "09.15" — jam:menit WIB (id-ID memakai titik sebagai pemisah). */
export function formatChatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: APP_TIMEZONE,
  });
}

/**
 * Chip pemisah tanggal di antar pesan — sentence case (bukan kapital semua):
 * "Hari ini" / "Kemarin" / nama hari 2–6 hari lalu ("Senin") / tanggal penuh
 * untuk yang lebih tua ("9 Okt"; tahun hanya ditambahkan bila bukan tahun
 * berjalan, mis. "9 Okt 2025"). Semua dihitung dari createdAt (UTC) dalam
 * zona Asia/Jakarta — tidak dipengaruhi zona waktu browser.
 */
export function dayChipLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = wibDayDiff(date, now);
  if (diff <= 0) return "Hari ini";
  if (diff === 1) return "Kemarin";
  if (diff <= 6) {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      timeZone: APP_TIMEZONE,
    });
  }
  const short = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: APP_TIMEZONE,
  });
  const yearOf = (d: Date) =>
    d.toLocaleDateString("id-ID", { year: "numeric", timeZone: APP_TIMEZONE });
  return yearOf(date) === yearOf(now) ? short : `${short} ${yearOf(date)}`;
}

/**
 * Label panjang untuk aria-label pemisah tanggal,
 * mis. "Jumat, 9 Oktober 2025" (tetap zona Asia/Jakarta).
 */
export function daySeparatorFullLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  });
}

/**
 * Waktu baris daftar percakapan: "09.15" (hari ini), "Kemarin", nama hari
 * dalam seminggu, atau "9 Okt".
 */
export function listTimeLabel(iso: string): string {
  const diff = wibDayDiff(iso, new Date());
  if (diff <= 0) return formatChatTime(iso);
  if (diff === 1) return "Kemarin";
  if (diff <= 6) {
    return new Date(iso).toLocaleDateString("id-ID", {
      weekday: "long",
      timeZone: APP_TIMEZONE,
    });
  }
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: APP_TIMEZONE,
  });
}

// Palet warna deterministik (dari id) untuk nama pengirim & avatar project.
// Kontras dipilih aman di atas bubble gelap (#1B2438) maupun terang.
const NAME_COLORS = [
  "text-blue-600 dark:text-[#8FAAFF]",
  "text-violet-600 dark:text-[#C4B5FD]",
  "text-emerald-600 dark:text-[#6EE7B7]",
  "text-rose-600 dark:text-[#FDA4AF]",
  "text-amber-600 dark:text-[#FCD34D]",
  "text-sky-600 dark:text-[#7DD3FC]",
];

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-sky-500",
];

function hashId(id: string): number {
  let sum = 0;
  for (const ch of id) sum += ch.charCodeAt(0);
  return sum;
}

/** Kelas Tailwind warna nama pengirim (deterministik per user id). */
export function senderColorClass(id: string): string {
  return NAME_COLORS[hashId(id) % NAME_COLORS.length];
}

/** Kelas Tailwind latar avatar project (deterministik per project id). */
export function projectAvatarClass(id: string): string {
  return AVATAR_COLORS[hashId(id) % AVATAR_COLORS.length];
}

/** Inisial project (huruf pertama, kapital). */
export function projectInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
}

/** Teks pratinjau baris daftar: "Nama: pesan" (satu baris, ditangani CSS). */
export function conversationPreview(
  last: {
    authorName: string;
    text: string;
    kind: string;
    deleted: boolean;
    attachments?: { name: string; mimeType: string }[];
  } | null
): string {
  if (!last) return "Belum ada pesan";
  if (last.kind === "SYSTEM" || last.deleted) return last.text;
  // Pratinjau file-only (tanpa teks) — sesuai spec.
  const attachments = last.attachments ?? [];
  const hasText = last.text.trim().length > 0;
  if (!hasText && attachments.length > 0) {
    const imageCount = attachments.filter((a) =>
      /^image\//i.test(a.mimeType)
    ).length;
    const fileCount = attachments.length - imageCount;
    if (imageCount > 0 && fileCount === 0) {
      return imageCount === 1 ? "Foto" : `${imageCount} foto`;
    }
    if (fileCount === 1 && imageCount === 0) {
      return `Lampiran: ${attachments[0].name}`;
    }
    return `${attachments.length} lampiran`;
  }
  if (hasText) return `${last.authorName}: ${last.text}`;
  return `${last.authorName}: ${last.text}`;
}

/**
 * Kelas scrollbar tipis bersama (daftar pesan & daftar percakapan):
 * `scrollbar-width: thin` + thumb 8px rounded — gelap rgba(255,255,255,.18),
 * terang memakai token slate setara kontras, track transparan.
 */
export const chatScrollbarCls =
  "[scrollbar-width:thin] [scrollbar-color:rgba(15,23,42,0.25)_transparent] dark:[scrollbar-color:rgba(255,255,255,0.18)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(15,23,42,0.25)] dark:[&::-webkit-scrollbar-thumb]:bg-[rgba(255,255,255,0.18)]";
