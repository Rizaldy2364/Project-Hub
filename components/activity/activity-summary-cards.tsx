import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { ActivitySummary, ActivityTopMember } from "@/types";

const SUMMARY_ROWS: { label: string; key: keyof ActivitySummary; dot: string }[] = [
  { label: "Task selesai", key: "taskCompleted", dot: "bg-emerald-500" },
  { label: "Task dibuat", key: "taskCreated", dot: "bg-blue-500" },
  { label: "Komentar", key: "commentAdded", dot: "bg-purple-500" },
  { label: "File diunggah", key: "fileUploaded", dot: "bg-sky-500" },
];

export function ActivitySummaryCards({
  summary,
  topMembers,
}: {
  summary: ActivitySummary;
  topMembers: ActivityTopMember[];
}) {
  const max = Math.max(1, ...topMembers.map((m) => m.count));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[.08] dark:bg-[#131A2B]">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Ringkasan</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-[#8B96AD]">7 hari terakhir</p>
        <ul className="mt-4 space-y-3">
          {SUMMARY_ROWS.map(({ label, key, dot }) => (
            <li key={key} className="flex items-center gap-3">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", dot)} aria-hidden />
              <span className="flex-1 text-sm text-slate-600 dark:text-slate-300">{label}</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {summary[key]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[.08] dark:bg-[#131A2B]">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Anggota paling aktif
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-[#8B96AD]">
          Berdasarkan jumlah aktivitas 7 hari terakhir
        </p>
        {topMembers.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-[#8B96AD]">Belum ada data.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {topMembers.map((m) => (
              <li key={m.id}>
                <div className="flex items-center gap-3">
                  <UserAvatar name={m.name} image={m.avatarUrl} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                    {m.name}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-[#8B96AD]">
                    {m.count}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-[#0F1524]">
                  <div
                    className="h-full rounded-full bg-blue-600 dark:bg-[#3B66EE]"
                    style={{ width: `${Math.round((m.count / max) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
