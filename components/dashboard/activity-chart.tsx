import { parseISO, format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Activity } from "lucide-react";
import type { WeeklyActivityPoint } from "@/repositories/project.repository";

interface ActivityChartProps {
  points: WeeklyActivityPoint[];
}

/** Batas atas sumbu Y: bilangan genap, minimal 4, supaya garis sumbu enak dibaca. */
function getAxisMax(values: number[]): number {
  const peak = values.length ? Math.max(...values) : 0;
  return Math.max(4, Math.ceil(peak / 2) * 2);
}

/**
 * Grafik garis aktivitas 7 hari terakhir (task dibuat + komentar).
 * Data diambil dari database (bukan contoh/hardcode).
 */
export function ActivityChart({ points }: ActivityChartProps) {
  const axisMax = getAxisMax(points.map((point) => point.count));
  const ticks = [axisMax, axisMax / 2, 0];
  const total = points.reduce((sum, point) => sum + point.count, 0);

  // Titik diletakkan di tengah kolom label (i + 0.5) supaya sejajar dengan baris nama hari.
  const toX = (index: number) => ((index + 0.5) / points.length) * 100;
  const toY = (value: number) => 92 - (value / axisMax) * 84;

  const linePoints = points.map((point, index) => `${toX(index)},${toY(point.count)}`).join(" ");
  const areaPoints = `0,100 ${linePoints} 100,100`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-950 dark:text-white">Aktivitas Tim</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Task dibuat dan komentar yang ditulis di project kamu.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
            Task &amp; komentar
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            7 hari terakhir
          </span>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        {/* Sumbu Y */}
        <div
          aria-hidden="true"
          className="flex h-44 shrink-0 flex-col justify-between pb-0 text-right text-xs font-medium text-slate-400"
        >
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        {/* Area grafik */}
        <div className="min-w-0 flex-1">
          <div
            role="img"
            aria-label={`Grafik aktivitas 7 hari terakhir. Total ${total} aktivitas, puncak ${axisMax} skala.`}
            className="relative h-44"
          >
            {/* garis bantu horizontal */}
            <div aria-hidden="true" className="absolute inset-0">
              {ticks.map((tick) => (
                <span
                  key={tick}
                  className="absolute inset-x-0 border-t border-slate-100 dark:border-slate-800"
                  style={{ top: `${toY(tick)}%` }}
                />
              ))}
            </div>

            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              <polygon points={areaPoints} className="fill-blue-500/10" />
              <polyline
                points={linePoints}
                fill="none"
                className="stroke-blue-500"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* titik data */}
            {points.map((point, index) => (
              <span
                key={point.date}
                title={`${format(parseISO(point.date), "EEEE, d MMMM", { locale: idLocale })}: ${point.count}`}
                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-500 bg-white shadow-sm dark:bg-slate-900"
                style={{ left: `${toX(index)}%`, top: `${toY(point.count)}%` }}
              />
            ))}
          </div>

          {/* Sumbu X */}
          <ul className="mt-3 grid grid-cols-7 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
            {points.map((point) => (
              <li key={point.date}>
                {format(parseISO(point.date), "EEE", { locale: idLocale })}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Ringkasan untuk screen reader */}
      <ul className="sr-only">
        {points.map((point) => (
          <li key={point.date}>
            {format(parseISO(point.date), "EEEE, d MMMM yyyy", { locale: idLocale })}: {point.count} aktivitas
          </li>
        ))}
      </ul>

      {total === 0 && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          <Activity className="h-3.5 w-3.5" />
          Belum ada aktivitas dalam 7 hari terakhir.
        </p>
      )}
    </section>
  );
}