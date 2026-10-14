export interface MentionMember {
  id: string;
  name: string;
}

/**
 * Ekstrak mention `@NamaMember` dari isi komentar.
 * - Cocokkan nama member project, tidak peka huruf besar/kecil.
 * - Coba nama terpanjang dulu agar "@Budi Santoso" menang atas "@Budi".
 */
export function extractMentions(
  content: string,
  members: MentionMember[]
): MentionMember[] {
  const sorted = [...members].sort((a, b) => b.name.length - a.name.length);
  const found: MentionMember[] = [];
  const foundIds = new Set<string>();

  for (const member of sorted) {
    const name = member.name.trim();
    if (!name) continue;
    // @nama harus diawali "@", boleh diakhiri spasi/tanda baca/akhir string.
    const pattern = new RegExp(
      `(^|\\s)@${escapeRegExp(name)}(?=$|[\\s.,;:!?)\\]])`,
      "i"
    );
    if (pattern.test(content) && !foundIds.has(member.id)) {
      foundIds.add(member.id);
      found.push(member);
    }
  }

  return found;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ===== Mention berbasis token `@[userId]` (Diskusi) =====
//
// Komposer ChatPanel menyisipkan token `@[userId]` ke dalam content saat
// pengguna memilih anggota dari popup mention. Server memverifikasi ulang tiap
// id terhadap anggota project yang sama sebelum membuat notifikasi — token
// dari client TIDAK PERNAH dipercaya apa adanya.

const MENTION_TOKEN_PATTERN = /@\[([^\]]+)\]/g;

/** Ekstrak ID unik dari token `@[userId]` dalam isi pesan (urut kemunculan). */
export function extractMentionIds(content: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const match of content.matchAll(MENTION_TOKEN_PATTERN)) {
    const id = match[1];
    if (id && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

export type MentionPart =
  | { type: "text"; value: string }
  | { type: "mention"; userId: string };

/**
 * Pecah isi pesan menjadi segmen teks biasa dan token mention `@[userId]`.
 * UI merender segmen mention sebagai `@Nama` (lookup anggota; fallback
 * "@pengguna") lewat node React biasa — TANPA dangerouslySetInnerHTML.
 */
export function splitMentions(content: string): MentionPart[] {
  const parts: MentionPart[] = [];
  let lastIndex = 0;
  for (const match of content.matchAll(MENTION_TOKEN_PATTERN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, start) });
    }
    parts.push({ type: "mention", userId: match[1] });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }
  return parts;
}
