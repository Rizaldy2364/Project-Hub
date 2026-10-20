import {
  AlertTriangle,
  KeyRound,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  type LucideIcon,
} from "lucide-react";

/**
 * Id bagian Pengaturan = id DOM <section> pada halaman (satu halaman panjang
 * dengan scroll-anchoring, bukan pemilihan panel lewat ?bagian=).
 */
export type SettingsSectionId =
  | "umum"
  | "kode-gabung"
  | "label"
  | "peran-izin"
  | "zona-berbahaya";

export interface SectionMeta {
  key: SettingsSectionId;
  label: string;
  icon: LucideIcon;
}

/**
 * Definisi bagian Pengaturan (menu + urutan section di halaman).
 *
 * File ini SENGAJA tanpa "use client" supaya bisa dipakai oleh Server
 * Component (halaman /pengaturan me-redirect query param ?bagian= lama ke
 * hash section) sekaligus oleh Client Component (SettingsNav). Modul client
 * tidak boleh dipanggil dari server, jadi definisi murni diletakkan di file
 * terpisah.
 */
export const SETTINGS_SECTIONS: SectionMeta[] = [
  {
    key: "umum",
    label: "Umum",
    icon: SlidersHorizontal,
  },
  {
    key: "kode-gabung",
    label: "Kode gabung",
    icon: KeyRound,
  },
  {
    key: "label",
    label: "Label",
    icon: Tags,
  },
  {
    key: "peran-izin",
    label: "Peran dan izin",
    icon: ShieldCheck,
  },
  {
    key: "zona-berbahaya",
    label: "Zona berbahaya",
    icon: AlertTriangle,
  },
];

/**
 * Query param lama ?bagian=umum|kode|label|peran|bahaya → hash section.
 * Nilai tak dikenal tidak ada di peta ini (halaman redirect ke URL bersih).
 */
export const BAGIAN_TO_HASH: Record<string, SettingsSectionId> = {
  umum: "umum",
  kode: "kode-gabung",
  label: "label",
  peran: "peran-izin",
  bahaya: "zona-berbahaya",
};

/** Type guard untuk hash section — dipakai client (efek load dengan hash). */
export function isSettingsSectionId(value: string): value is SettingsSectionId {
  return SETTINGS_SECTIONS.some((section) => section.key === value);
}
