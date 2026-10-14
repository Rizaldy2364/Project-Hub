import { formatWibDayKey, formatWibWeekRange } from "@/lib/utils";

interface BarChartProps {
  points: { weekStart: string; count: number }[];
}

/**
 * Grafik batang SVG "Task selesai per minggu" (6 minggu, Senin WIB).
 * Area plot memakai viewBox + preserveAspectRatio="none" agar mengisi lebar
 * penuh kartu; label sumbu & nilai dirender sebagai HTML agar tidak terdistorsi
 * dan tetap rata tengah di bawah batang. Batang bernilai 0 tidak digambar.
 */
export function BarChart({ points }: BarChartProps) {
  const max = Math.max(...points.map((p) => p.count), 1);
  const axisMax = Math.max(4, Math.ceil(max / 2) * 2);
  const total = points.reduce((sum, p) => sum + p.count, 0);

  // Geometri viewBox area plot.
  const VB_W = 300;
  const VB_H = 120;
  const PLOT_PX = 176; // samakan dengan tinggi area plot (h-44)
  const toY = (value: number) => VB_H - (value / axisMax) * (VB_H - 14);
  const slot = VB_W / points.length;
  const barW = Math.min(30, slot * 0.55);
  // Persentase dari atas area plot untuk sebuah nilai sumbu Y.
  const topPct = (value: number) => `${(toY(value) / VB_H) * 100}%`;

  const ticks = [axisMax, axisMax / 2, 0];

  // Data sudah urut paling lama → terbaru; titik terakhir = minggu berjalan.
  const lastIndex = points.length - 1;

  return (
    <div>
      <div className="flex">
        {/* Label sumbu Y */}
        <div
          aria-hidden="true"
          className="relative w-6 shrink-0"
          style={{ height: PLOT_PX }}
        >
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-1 -translate-y-1/2 text-[9px] font-medium text-slate-400"
              style={{ top: topPct(tick) }}
            >
              {tick}
            </span>
          ))}
        </div>

        {/* Area plot */}
        <div className="relative min-w-0 flex-1" style={{ height: PLOT_PX }}>
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            {/* Gridlines */}
            {ticks.map((tick) => (
              <line
                key={tick}
                x1={0}
                x2={VB_W}
                y1={toY(tick)}
                y2={toY(tick)}
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth={1}
                strokeDasharray={tick === 0 ? "" : "3 3"}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {/* Batang (nilai 0 tidak digambar) */}
            {points.map((point, index) => {
              if (point.count === 0) return null;
              const x = index * slot + (slot - barW) / 2;
              const y = toY(point.count);
              const h = VB_H - y;
              const { withYear } = formatWibWeekRange(point.weekStart);
              const isCurrent = index === lastIndex;
              const ariaLabel = `${withYear}: ${point.count} task selesai`;
              return (
                <rect
                  key={point.weekStart}
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(h, 2)}
                  rx={2}
                  className="fill-blue-600"
                  role="img"
                  aria-label={ariaLabel}
                >
                  {/* Tooltip native; minggu berjalan diberi penanda. */}
                  <title>{`${ariaLabel}${isCurrent ? " (minggu ini)" : ""}`}</title>
                </rect>
              );
            })}
          </svg>

          {/* Label nilai di atas batang — dekoratif (data ada di tabel sr-only) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid"
            style={{ gridTemplateColumns: `repeat(${points.length}, 1fr)` }}
          >
            {points.map((point) => (
              <div key={point.weekStart} className="relative">
                {point.count > 0 && (
                  <span
                    className="absolute -translate-x-1/2 text-[10px] font-semibold text-slate-500 dark:text-slate-400"
                    style={{
                      left: "50%",
                      bottom: `${((VB_H - toY(point.count)) / VB_H) * 100}%`,
                      marginBottom: "2px",
                    }}
                  >
                    {point.count}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Label sumbu X — rentang minggu (fallback ke tanggal awal bila sempit).
          Container query mengukur lebar area plot (< 504px ≈ < 84px/batang). */}
      <div className="mt-1 flex">
        <div className="w-6 shrink-0" />
        <ul
          aria-hidden="true"
          className="@container grid flex-1 text-center text-[10px] font-medium text-slate-500 dark:text-slate-400"
          style={{ gridTemplateColumns: `repeat(${points.length}, 1fr)` }}
        >
          {points.map((point) => {
            const { range } = formatWibWeekRange(point.weekStart);
            return (
              <li key={point.weekStart} className="min-w-0">
                {/* Rentang penuh "12–18 Okt" saat lebar cukup (>= ~84px/batang). */}
                <span className="@min-[504px]:inline hidden">{range}</span>
                {/* Fallback tanggal awal "12 Okt" saat sempit. */}
                <span className="@max-[503px]:inline hidden">
                  {formatWibDayKey(point.weekStart)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Tabel data untuk screen reader (pakai rentang minggu yang sama) */}
      <table className="sr-only">
        <caption>
          Grafik task selesai per minggu, 6 minggu terakhir. Total {total} task
          selesai.
        </caption>
        <thead>
          <tr>
            <th scope="col">Minggu</th>
            <th scope="col">Selesai</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point, index) => {
            const { withYear } = formatWibWeekRange(point.weekStart);
            const isCurrent = index === lastIndex;
            return (
              <tr key={point.weekStart}>
                <td>
                  Minggu {withYear}
                  {isCurrent ? " (minggu ini)" : ""}
                </td>
                <td>{point.count}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
