import {
  AlertTriangle,
  KeyRound,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  type LucideIcon,
} from "lucide-react";

export type SettingsSection = "umum" | "kode" | "label" | "peran" | "bahaya";

export interface SectionMeta {
  key: SettingsSection;
  label: string;
  icon: LucideIcon;
  description: string;
}

/**
 * Definisi bagian Pengaturan.
 *
 * File ini SENGAJA tanpa "use client" supaya bisa dipakai oleh Server
 * Component (halaman /pengaturan memvalidasi query param ?bagian= di server)
 * sekaligus oleh Client Component (SettingsNav). Modul client tidak boleh
 * dipanggil dari server, jadi definisi murni diletakkan di file terpisah.
 */
export const SETTINGS_SECTIONS: SectionMeta[] = [
  {
    key: "umum",
    label: "Umum",
    icon: SlidersHorizontal,
    description: "Nama dan deskripsi project.",
  },
  {
    key: "kode",
    label: "Kode gabung",
    icon: KeyRound,
    description: "Kode undangan dan pendaftaran anggota.",
  },
  {
    key: "label",
    label: "Label",
    icon: Tags,
    description: "Kategori berwarna untuk task.",
  },
  {
    key: "peran",
    label: "Peran dan izin",
    icon: ShieldCheck,
    description: "Ringkasan peran anggota project.",
  },
  {
    key: "bahaya",
    label: "Zona berbahaya",
    icon: AlertTriangle,
    description: "Tindakan yang tidak bisa dibatalkan.",
  },
];

/** Type guard untuk query param ?bagian= — dipanggil di server & client. */
export function isSettingsSection(value: string): value is SettingsSection {
  return SETTINGS_SECTIONS.some((section) => section.key === value);
}
