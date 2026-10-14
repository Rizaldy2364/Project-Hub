interface StackedSegment {
  label: string;
  value: number;
  /** Kelas Tailwind untuk isi segmen (mis. "bg-emerald-600 dark:bg-emerald-500"). */
  barClass: string;
}

interface StackedBarProps {
  segments: StackedSegment[];
  /** Total terbesar antar baris — lebar bar diskalakan relatif terhadap ini. */
  maxTotal: number;
  /** Ringkasan untuk pembaca layar, mis. "Rizaldy: 1 selesai, 1 dikerjakan, 1 belum". */
  ariaLabel: string;
  className?: string;
}

/**
 * Batang bertumpuk horizontal (HTML + kelas statis) untuk "Beban kerja anggota"
 * dan "Task per project". Trek memakai warna dalam yang sama dengan
 * "Progres per project"; segmen nol tidak digambar. Lebar keseluruhan bar
 * proporsional terhadap total terbesar (maxTotal). Segmen memakai kelas
 * background statis (bukan yang dibangun dari string) agar warna benar di SVG
 * maupun HTML, dan kontras >= 3:1 terhadap trek di mode terang & gelap.
 */
export function StackedBar({ segments, maxTotal, ariaLabel, className }: StackedBarProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const fillPercent = maxTotal > 0 ? Math.min((total / maxTotal) * 100, 100) : 0;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${className ?? ""}`}
    >
      {total > 0 && (
        <div className="flex h-full overflow-hidden rounded-full" style={{ width: `${fillPercent}%` }}>
          {segments
            .filter((s) => s.value > 0)
            .map((segment) => (
              <div
                key={segment.label}
                className={`h-full ${segment.barClass}`}
                style={{ width: `${(segment.value / total) * 100}%` }}
              />
            ))}
        </div>
      )}
    </div>
  );
}
