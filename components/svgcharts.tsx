"use client";
// Small, dependency-free SVG charts in the house style.
import { usePrefs } from "./prefs";
import { compact } from "@/lib/format";

type Series = { label: string; values: number[]; color: string; dashed?: boolean };

/** Multi-line chart with x labels and a compact y axis. */
export function LinesChart({ series, xLabels, height = 260, format }: { series: Series[]; xLabels: string[]; height?: number; format?: (v: number) => string }) {
  const { lang } = usePrefs();
  const W = 900, H = height, L = 64, R = 12, T = 12, B = 28;
  const all = series.flatMap(s => s.values).filter(Number.isFinite);
  if (!all.length) return null;
  const min = Math.min(0, ...all), max = Math.max(...all), span = max - min || 1;
  const n = Math.max(...series.map(s => s.values.length));
  const x = (i: number) => L + (i / Math.max(n - 1, 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - min) / span) * (H - T - B);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => min + f * span);
  const fmt = format ?? ((v: number) => compact(v, lang));
  const step = Math.max(1, Math.ceil(n / 8));
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={series.map(s => s.label).join(", ")}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--rule)" strokeDasharray={i === 0 ? undefined : "3 5"} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{fmt(t)}</text>
          </g>
        ))}
        {xLabels.map((l, i) => i % step === 0 || i === n - 1 ? <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">{l}</text> : null)}
        {series.map(s => (
          <polyline key={s.label} fill="none" stroke={s.color} strokeWidth="2.2" strokeDasharray={s.dashed ? "6 5" : undefined}
            points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} strokeLinejoin="round" />
        ))}
      </svg>
      <div className="legend" style={{ marginTop: ".2rem" }}>
        {series.map(s => <div key={s.label}><i style={{ background: s.color }} />{s.label}</div>)}
      </div>
    </div>
  );
}

/** Monte Carlo fan: 10–90 and 25–75 percentile bands plus the median. */
export function FanChart({ rows, height = 300, labels }: { rows: { year: number; p10: number; p25: number; p50: number; p75: number; p90: number }[]; height?: number; labels: { median: string; mid: string; wide: string } }) {
  const { lang } = usePrefs();
  const W = 900, H = height, L = 64, R = 12, T = 12, B = 28;
  const max = Math.max(...rows.map(r => r.p90)), min = 0, span = max - min || 1;
  const x = (i: number) => L + (i / Math.max(rows.length - 1, 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - min) / span) * (H - T - B);
  const band = (a: keyof (typeof rows)[0], b: keyof (typeof rows)[0]) =>
    rows.map((r, i) => `${x(i)},${y(r[a] as number)}`).join(" ") + " " + [...rows].reverse().map((r, i) => `${x(rows.length - 1 - i)},${y(r[b] as number)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => min + f * span);
  const step = Math.max(1, Math.ceil(rows.length / 10));
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Monte Carlo">
        {ticks.map((t, i) => (
          <g key={i}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--rule)" strokeDasharray={i ? "3 5" : undefined} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{compact(t, lang)}</text></g>
        ))}
        <polygon points={band("p90", "p10")} fill="var(--accent)" opacity=".16" />
        <polygon points={band("p75", "p25")} fill="var(--accent)" opacity=".3" />
        <polyline points={rows.map((r, i) => `${x(i)},${y(r.p50)}`).join(" ")} fill="none" stroke="var(--ink)" strokeWidth="2.2" />
        {rows.map((r, i) => i % step === 0 || i === rows.length - 1 ? <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">{r.year}</text> : null)}
      </svg>
      <div className="legend">
        <div><i style={{ background: "var(--ink)" }} />{labels.median}</div>
        <div><i style={{ background: "var(--accent)", opacity: .55 }} />{labels.mid}</div>
        <div><i style={{ background: "var(--accent)", opacity: .25 }} />{labels.wide}</div>
      </div>
    </div>
  );
}

/** Horizontal bar list (exposures, shocks). Values in %, may be negative. */
export function BarList({ items, signed = false, max }: { items: { label: string; value: number; note?: string }[]; signed?: boolean; max?: number }) {
  const { lang } = usePrefs();
  const m = max ?? Math.max(1, ...items.map(i => Math.abs(i.value)));
  const f = (v: number) => (signed && v > 0 ? "+" : "") + v.toLocaleString(lang === "it" ? "it-IT" : "en-US", { maximumFractionDigits: 1 }) + "%";
  return (
    <div>
      {items.map(i => (
        <div key={i.label} className="bar-row2" title={i.note}>
          <span className="small">{i.label}</span>
          <span className="bar2-track">
            {signed ? (
              <span className={`bar2 ${i.value >= 0 ? "pos" : "neg"}`} style={{ width: `${(Math.abs(i.value) / m) * 50}%`, left: i.value >= 0 ? "50%" : `${50 - (Math.abs(i.value) / m) * 50}%` }} />
            ) : <span className="bar2 neutral" style={{ width: `${(i.value / m) * 100}%`, left: 0 }} />}
            {signed && <span className="bar2-axis" />}
          </span>
          <span className={`small num ${signed ? (i.value > 0 ? "up" : i.value < 0 ? "down" : "flat") : ""}`} style={{ textAlign: "right" }}>{f(i.value)}</span>
        </div>
      ))}
    </div>
  );
}

/** Correlation matrix heatmap. */
export function CorrMatrix({ symbols, m }: { symbols: string[]; m: number[][] }) {
  const cell = (v: number) => v >= 0 ? `color-mix(in srgb, #8E2F23 ${Math.round(v * 85)}%, var(--surface))` : `color-mix(in srgb, #1F5B43 ${Math.round(-v * 85)}%, var(--surface))`;
  return (
    <div className="table-wrap">
      <table className="corr">
        <thead><tr><th />{symbols.map(s => <th key={s}>{s}</th>)}</tr></thead>
        <tbody>
          {symbols.map((s, i) => (
            <tr key={s}><th>{s}</th>
              {symbols.map((t, j) => <td key={t} style={{ background: i === j ? "var(--surface-2)" : cell(m[i][j]), color: Math.abs(m[i][j]) > 0.6 && i !== j ? "#fff" : undefined }}>{i === j ? "—" : m[i][j].toFixed(2)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
