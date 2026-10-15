import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Satu item menu di sidebar.
 * `match` = daftar prefix path yang membuat item ini aktif (active state).
 */
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: string[];
  /** Item ini menampilkan badge angka notifikasi belum dibaca (menu Inbox)
   * di dalam link — lihat InboxUnreadBadge. */
  badge?: boolean;
}

/**
 * Satu kelompok menu sidebar. `label` tampil sebagai judul kecil di atas item.
 */
export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * SATU sumber kebenaran untuk menu sidebar — dipakai sidebar desktop maupun
 * menu mobile apa pun yang dirender. Href, ikon, dan label TIDAK boleh diubah
 * dari sini tanpa alasan; hanya susunan kelompok yang diatur di file ini.
 */
export const navGroups: NavGroup[] = [
  {
    label: "UTAMA",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, match: ["/dashboard"] },
      { href: "/projects", label: "Project Saya", icon: FolderKanban, match: ["/projects"] },
      { href: "/tasks", label: "Task Project", icon: CheckSquare, match: ["/tasks"] },
      { href: "/calendar", label: "Kalender", icon: CalendarDays, match: ["/calendar"] },
      { href: "/inbox", label: "Inbox", icon: Bell, match: ["/inbox"], badge: true },
    ],
  },
  {
    label: "KOLABORASI",
    items: [
      { href: "/diskusi", label: "Diskusi", icon: MessageSquare, match: ["/diskusi"] },
      { href: "/tim", label: "Tim & Anggota", icon: Users, match: ["/tim"] },
      { href: "/aktivitas", label: "Aktivitas", icon: Activity, match: ["/aktivitas"] },
    ],
  },
  {
    label: "ANALITIK",
    items: [
      { href: "/laporan", label: "Laporan", icon: BarChart3, match: ["/laporan"] },
    ],
  },
];
