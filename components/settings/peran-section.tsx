"use client";

import { Users, ShieldCheck, UserCircle, Eye } from "lucide-react";
import { SettingsPanel } from "@/components/settings/settings-panel";
import type { ProjectRole } from "@/types";

interface RoleCount { role: string; count: number; }

interface PeranSectionProps { roles: RoleCount[]; }

/**
 * Peran yang tampil di ringkasan. Mengikuti enum Prisma saat ini:
 * ADMIN / MANAGER / MEMBER / VIEWER (sebelumnya DEPUTY_ADMIN sudah
 * di-rename jadi MANAGER lewat migrasi 20261016000000).
 */
const ROLE_INFO: Record<
  ProjectRole,
  { label: string; color: string; chip: string; icon: React.ElementType }
> = {
  ADMIN: {
    label: "Admin",
    color: "text-violet-600 dark:text-violet-400",
    chip: "bg-violet-500/10 border-violet-500/20",
    icon: ShieldCheck as React.ElementType,
  },
  MANAGER: {
    label: "Manager",
    color: "text-pink-600 dark:text-pink-400",
    chip: "bg-pink-500/10 border-pink-500/20",
    icon: UserCircle as React.ElementType,
  },
  MEMBER: {
    label: "Member",
    color: "text-slate-600 dark:text-slate-400",
    chip: "bg-slate-500/10 border-slate-500/20",
    icon: Users as React.ElementType,
  },
  VIEWER: {
    label: "Viewer",
    color: "text-teal-600 dark:text-teal-400",
    chip: "bg-teal-500/10 border-teal-500/20",
    icon: Eye as React.ElementType,
  },
};

const ROLE_ORDER: ProjectRole[] = ["ADMIN", "MANAGER", "MEMBER", "VIEWER"];

export function PeranSection({ roles }: PeranSectionProps) {
  return (
    <SettingsPanel title="Peran dan izin" description="Ringkasan jumlah anggota per peran di project ini. Ubah peran anggota melalui tab Anggota.">
      <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROLE_ORDER.map((key) => {
          const info = ROLE_INFO[key];
          const count = roles.find((r) => r.role === key)?.count ?? 0;
          const Icon = info.icon;
          return (
            <div key={key} className="rounded-xl border bg-white p-3 dark:border-white/[0.08] dark:bg-[#0F1524]">
              <div className="flex items-center gap-2">
                <div className={`rounded-lg border p-2 ${info.chip}`}>
                  <Icon className={`h-4 w-4 ${info.color}`} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-[#E6EAF2]">{info.label}</div>
                  <div className="text-xs text-slate-500 dark:text-[#8B96AD]">{count} anggota</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="pb-4">
        <p className="text-xs leading-5 text-slate-500 dark:text-[#8B96AD]">
          Peran hanya berlaku di project ini. Admin memiliki hak penuh, Manager
          dapat membuat dan menugaskan task, Member dapat mengerjakan task yang
          ditugaskan padanya dan mengubah status tasknya sendiri, sedangkan
          Viewer hanya dapat melihat isi project.
        </p>
      </div>
    </SettingsPanel>
  );
}
