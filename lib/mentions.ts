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
