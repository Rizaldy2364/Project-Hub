import Link from "next/link";

/** Project tidak ditemukan atau user bukan anggotanya — tidak membocorkan
 * keberadaan project. */
export default function ProjectNotFound() {
  return (
    <div className="mx-auto max-w-6xl py-20 text-center">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
        Project tidak ditemukan
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Project tidak ditemukan atau kamu bukan anggota project ini.
      </p>
      <p className="mt-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          ← Kembali ke Project Saya
        </Link>
      </p>
    </div>
  );
}