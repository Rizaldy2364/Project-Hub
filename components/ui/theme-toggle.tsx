"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const options = [
  { value: "light", icon: Sun, label: "Mode terang" },
  { value: "dark", icon: Moon, label: "Mode gelap" },
] as const;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
      {options.map(({ value, icon: Icon, label }) => {
        const active = mounted && resolvedTheme === value;
        return (
          <button
            key={value}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={() => setTheme(value)}
            className={cn(
              "w-9 h-8 rounded-full flex items-center justify-center transition-colors",
              active
                ? "bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-blue-300"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}