"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

/** Error halaman /laporan dengan tombol coba lagi (refresh server). */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  return (
    <div
      role="alert"
      className="mx-auto max-w-[1400px] rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
    >
      <p className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4" aria-hidden />
        Gagal memuat laporan. Coba lagi.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          Coba lagi
        </button>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="rounded-xl border border-red-300 px-4 py-2 font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
        >
          Muat ulang
        </button>
      </div>
    </div>
  );
}
