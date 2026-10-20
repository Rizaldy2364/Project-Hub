import Link from "next/link";
import { ShieldAlert } from "lucide-react";

/**
 * UI 403 untuk route yang memanggil `forbidden()` — dipakai halaman
 * Pengaturan project ketika user bukan ADMIN.
 *
 * `forbidden()` melempar error sehingga boundary terdekat (file ini) merender
 * dengan status HTTP 403. Diterapkan lewat `experimental.authInterrupts`
 * di next.config.ts.
 */
export default function Forbidden() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
        <ShieldAlert className="h-7 w-7" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-bold text-slate-900 dark:text-[#E6EAF2]">
          Akses ditolak
        </h1>
        <p className="max-w-md text-sm text-slate-500 dark:text-[#8B96AD]">
          Halaman Pengaturan project hanya dapat dibuka oleh Admin project ini.
        </p>
      </div>
      <Link
        href=".."
        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
      >
        Kembali ke project
      </Link>
    </div>
  );
}