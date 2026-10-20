"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  SETTINGS_SECTIONS,
  type SettingsSection,
} from "@/components/settings/settings-sections";

/**
 * Menu bagian Pengaturan: vertical card di desktop (≥1024px), baris pill
 * horizontal scroll di bawahnya. Pilihan disimpan di URL (?bagian=…) sehingga
 * bisa di-bookmark dan tombol browser biasa berfungsi.
 */
export function SettingsNav({
  projectId,
  active,
}: {
  projectId: string;
  active: SettingsSection;
}) {
  return (
    <nav
      aria-label="Bagian pengaturan"
      className="w-full shrink-0 lg:sticky lg:top-6 lg:w-64 lg:self-start"
    >
      <div
        className={cn(
          "flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:block lg:space-y-1 lg:overflow-visible lg:pb-0",
          "rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:rounded-2xl dark:border-white/[0.08] dark:bg-[#131A2B]"
        )}
      >
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const selected = section.key === active;
          const danger = section.key === "bahaya";
          return (
            <Link
              key={section.key}
              href={`/projects/${projectId}/pengaturan?bagian=${section.key}`}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:w-full",
                selected && danger &&
                  "bg-red-600 text-white dark:bg-red-600 dark:text-white",
                selected && !danger &&
                  "bg-blue-600 text-white dark:bg-blue-600 dark:text-white",
                !selected &&
                  "text-slate-600 hover:bg-slate-50 dark:text-[#8B96AD] dark:hover:bg-[#1B2438]",
                !selected && danger && "text-red-600 dark:text-red-400"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {section.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Deskripsi per bagian — dipakai header panel di kanan. */
export function settingsSectionDescription(
  key: SettingsSection
): { title: string; description: string } {
  const section = SETTINGS_SECTIONS.find((s) => s.key === key)!;
  return {
    title: section.label,
    description: section.description,
  };
}
