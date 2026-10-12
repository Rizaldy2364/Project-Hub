import { cn } from "@/lib/utils";
import type { TaskPriorityValue } from "@/types";

const config: Record<TaskPriorityValue, { label: string; className: string }> = {
  HIGH: {
    label: "Tinggi",
    className: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300",
  },
  MEDIUM: {
    label: "Sedang",
    className: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  },
  LOW: {
    label: "Rendah",
    className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
  },
};

/** Badge prioritas task: Tinggi / Sedang / Rendah. */
export function PriorityBadge({ value }: { value: TaskPriorityValue }) {
  const { label, className } = config[value];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold",
        className
      )}
    >
      {label}
    </span>
  );
}
