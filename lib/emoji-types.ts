// ===== Tipe emoji picker =====

export type EmojiCategory =
  | "wajah"
  | "gestur"
  | "hati"
  | "objek"
  | "alam"
  | "makanan"
  | "aktivitas";

export interface EmojiItem {
  char: string;
  name: string;
}
