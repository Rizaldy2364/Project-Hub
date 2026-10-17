import { cn } from "@/lib/utils";

interface DonutSegment {
  label: string;
  value: number;
  /** Kelas Tailwind untuk stroke (mis. "stroke-emerald-500"). */
  strokeClass: string;
  /** Kelas Tailwind untuk titik legend (mis. "bg-emerald-500"). */
  dotClass: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  total: number;
  /** Label di tengah donut (mis. "task"). */
  centerLabel: string;
  /** true = ukuran kecil (~112px) untuk kartu ringkasan. */
  compact?: boolean;
}

/**
 * Donut SVG distribusi status. Setiap segmen punya legenda dengan angka,
 * jadi tidak mengandalkan warna saja. Responsive via viewBox.
 */
export function DonutChart({ segments, total, centerLabel, compact }: DonutChartProps) {
  const size = 120;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // Hindari pembagian nol bila tidak ada data.
  const safeTotal = total > 0 ? total : 1;

  const visible = segments.filter((s) => s.value > 0);

  // Hitung offset kumulatif tiap segmen secara murni (tanpa mutasi saat render).
  const arcs = visible.reduce<
    { segment: (typeof visible)[number]; length: number; dashOffset: number }[]
  >((acc, segment) => {
    const length = (segment.value / safeTotal) * circumference;
    const dashOffset = acc.reduce((sum, a) => sum + a.length, 0);
    acc.push({ segment, length, dashOffset });
    return acc;
  }, []);

  return (
    <div
      role="img"
      aria-label={`Distribusi status task. Total ${total} task: ${segments
        .map((s) => `${s.label} ${s.value}`)
        .join(", ")}.`}
      className="flex flex-col items-center gap-4"
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className={cn("shrink-0", compact ? "h-28 w-28" : "h-32 w-32")}
      >
        {/* Latar donut */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-100 dark:stroke-slate-800"
        />
        {arcs.map(({ segment, length, dashOffset }) => (
          <circle
            key={segment.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className={segment.strokeClass}
          >
            <title>{`${segment.label}: ${segment.value}`}</title>
          </circle>
        ))}
        {/* Total di tengah */}
        <text
          x={size / 2}
          y={size / 2 - 2}
          textAnchor="middle"
          className="fill-slate-900 text-lg font-bold dark:fill-white"
        >
          {total}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 14}
          textAnchor="middle"
          className="fill-slate-400 text-[9px]"
        >
          {centerLabel}
        </text>
      </svg>

      {/* Legend dengan angka */}
      <ul className="w-full space-y-1.5">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${segment.dotClass}`}
            />
            <span className="text-slate-600 dark:text-slate-300">{segment.label}</span>
            <span className="ml-auto font-semibold text-slate-900 dark:text-white">
              {segment.value}
            </span>
          </li>
        ))}
      </ul>

      {/* Tabel data untuk screen reader */}
      <table className="sr-only">
        <caption>Distribusi status task</caption>
        <tbody>
          {segments.map((segment) => (
            <tr key={segment.label}>
              <th scope="row">{segment.label}</th>
              <td>{segment.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
