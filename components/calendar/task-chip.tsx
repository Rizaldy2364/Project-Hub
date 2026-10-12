import { cn } from "@/lib/utils";
import type { BoardTaskStatus } from "@/types";

/** Chip solid satu baris — warna mengikuti status, sesuai referensi foto. */
const chipStyle: Record<BoardTaskStatus, string> = {
  TODO: "bg-slate-500 dark:bg-slate-600",
  IN_PROGRESS: "bg-blue-600 dark:bg-blue-600",
  DONE: "bg-emerald-600 dark:bg-emerald-600",
};

interface TaskChipProps {
  title: string;
  status: BoardTaskStatus;
  onClick?: () => void;
}

/** Chip kecil satu baris (potong) untuk task pada sel kalender. */
export function TaskChip({ title, status, onClick }: TaskChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "relative flex w-full items-center overflow-hidden rounded-md py-1 pl-3 pr-1.5 text-left text-[11px] font-medium text-white transition-opacity hover:opacity-90",
        chipStyle[status]
      )}
    >
      {/* Aksen kiri gelap tipis */}
      <span aria-hidden="true" className="absolute left-0 top-0 h-full w-1 bg-black/20" />
      <span className="min-w-0 truncate">{title}</span>
    </button>
  );
}