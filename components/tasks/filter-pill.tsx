"use client";

import { cn } from "@/lib/utils";

/** Pil filter bulat untuk member / status. */
export function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors",
        active
          ? "bg-blue-600 text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
      )}
    >
      {children}
    </button>
  );
}
