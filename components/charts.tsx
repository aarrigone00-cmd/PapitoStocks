"use client";
import { useEffect, useRef } from "react";
import { AreaSeries, CandlestickSeries, ColorType, HistogramSeries, createChart, type UTCTimestamp } from "lightweight-charts";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import Link from "next/link";
import { usePrefs } from "./prefs";
import { pct } from "@/lib/format";

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

type Pt = { t: string; v: number };
type Candle = { t: string; o: number; h: number; l: number; c: number; v: number };

/** Elegant area or candlestick chart (TradingView Lightweight Charts). */
export function PriceChart({ points, candles, height = 320, mode = "area" }: { points?: Pt[]; candles?: Candle[]; height?: number; mode?: "area" | "candles" }) {
  const ref = useRef<HTMLDivElement>(null);
  const { theme, lang } = usePrefs();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ink = css("--ink"), muted = css("--muted"), rule = css("--rule"), up = css("--up"), down = css("--down"), gold = css("--accent");
    const chart = createChart(el, {
      height, autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: muted, fontFamily: "Inter, system-ui, sans-serif", fontSize: 11, attributionLogo: false },
      grid: { vertLines: { visible: false }, horzLines: { color: rule } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      localization: {
        locale: lang === "it" ? "it-IT" : "en-US",
        priceFormatter: (v: number) => new Intl.NumberFormat(lang === "it" ? "it-IT" : "en-US", { maximumFractionDigits: Math.abs(v) >= 1000 ? 0 : 2, minimumFractionDigits: Math.abs(v) >= 1000 ? 0 : 2 }).format(v),
      },
      crosshair: { vertLine: { color: gold, labelBackgroundColor: ink }, horzLine: { color: gold, labelBackgroundColor: ink } },
    });
    const toT = (s: string) => Math.floor(new Date(s).getTime() / 1000) as UTCTimestamp;
    const src = candles ?? points?.map(p => ({ t: p.t, o: p.v, h: p.v, l: p.v, c: p.v, v: 0 })) ?? [];
    const dedup = src.filter((p, i, a) => i === 0 || toT(p.t) > toT(a[i - 1].t));
    if (dedup.length) {
      const rising = dedup[dedup.length - 1].c >= dedup[0].c;
      const col = rising ? up : down;
      if (mode === "candles" && candles) {
        const s = chart.addSeries(CandlestickSeries, { upColor: up, downColor: down, borderVisible: false, wickUpColor: up, wickDownColor: down });
        s.setData(dedup.map(b => ({ time: toT(b.t), open: b.o, high: b.h, low: b.l, close: b.c })));
        const vol = chart.addSeries(HistogramSeries, { priceScaleId: "vol", color: rule, priceFormat: { type: "volume" } });
        chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
        vol.setData(dedup.map(b => ({ time: toT(b.t), value: b.v })));
      } else {
        const s = chart.addSeries(AreaSeries, {
          lineColor: col, lineWidth: 2, topColor: col + "40", bottomColor: col + "00",
          priceLineVisible: false, lastValueVisible: true, crosshairMarkerBackgroundColor: gold,
        });
        s.setData(dedup.map(b => ({ time: toT(b.t), value: b.c })));
      }
      chart.timeScale().fitContent();
    }
    return () => chart.remove();
  }, [points, candles, height, mode, theme, lang]);

  return <div ref={ref} style={{ width: "100%", height }} />;
}

/** Tiny inline sparkline (SVG). */
export function Sparkline({ values, width = 120, height = 32 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / span) * (height - 4) - 2}`).join(" ");
  const up = values[values.length - 1] >= values[0];
  return <svg width={width} height={height} aria-hidden><polyline points={pts} fill="none" stroke={`var(--${up ? "up" : "down"})`} strokeWidth="1.5" /></svg>;
}

/** Stock heatmap: squarified treemap grouped by sector; size = traded value, colour = % change. */
export function Heatmap<T extends { symbol: string; name: string; sector: string; quote: { changePct: number | null; dollarVolume: number | null } | null }>(
  { items, sectorLabels, height = 460 }: { items: T[]; sectorLabels: Record<string, string>; height?: number }) {
  const { lang } = usePrefs();
  const W = 1000, H = height;
  const groups = new Map<string, T[]>();
  for (const it of items) groups.set(it.sector, [...(groups.get(it.sector) ?? []), it]);
  type Node = { name: string; children?: Node[]; item?: T; value?: number };
  const root = hierarchy<Node>({ name: "root", children: [...groups].map(([k, v]) => ({ name: k, children: v.map(item => ({ name: item.symbol, item, value: Math.max(item.quote?.dollarVolume ?? 0, 1e6) })) })) })
    .sum(d => d.value ?? 0).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  treemap<Node>().size([W, H]).tile(treemapSquarify).paddingTop(16).paddingInner(1).paddingOuter(2)(root);

  const color = (p: number | null) => {
    if (p == null) return "var(--surface-2)";
    const k = Math.min(Math.abs(p) / 3, 1);
    // forest greens for gains, oxblood for losses; intensity by magnitude
    return p >= 0 ? `color-mix(in srgb, #1F5B43 ${30 + k * 70}%, #7E8F84)` : `color-mix(in srgb, #8E2F23 ${30 + k * 70}%, #8C7F78)`;
  };
  const leaves = root.leaves() as unknown as { x0: number; y0: number; x1: number; y1: number; data: Node }[];
  const sectors = (root.children ?? []) as unknown as { x0: number; y0: number; data: Node }[];
  const pctX = (x: number) => `${(x / W) * 100}%`;

  return (
    <div className="heatmap" style={{ height: H }}>
      {sectors.map(s => (
        <span key={s.data.name} className="heat-sector" style={{ left: pctX(s.x0 + 4), top: s.y0 + 2 }}>{sectorLabels[s.data.name] ?? s.data.name}</span>
      ))}
      {leaves.map(l => {
        const it = l.data.item!;
        const w = l.x1 - l.x0, h = l.y1 - l.y0;
        return (
          <Link key={it.symbol} href={`/research/${it.symbol}`} className="heat-tile" title={`${it.name}: ${pct(it.quote?.changePct, lang)}`}
            style={{ left: pctX(l.x0), top: l.y0, width: pctX(w), height: h, background: color(it.quote?.changePct ?? null) }}>
            {w > 38 && h > 26 && <b>{it.symbol}</b>}
            {w > 52 && h > 44 && <span>{pct(it.quote?.changePct, lang)}</span>}
          </Link>
        );
      })}
    </div>
  );
}

export const PALETTE = ["#112A23", "#B99A5E", "#89968A", "#3F5E52", "#D4C08E", "#5C665F", "#7A5C2E", "#A9B8AA", "#2E4A40", "#C9B48A"];

export function AllocationBar({ parts }: { parts: { label: string; value: number }[] }) {
  const { lang } = usePrefs();
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div>
      <div className="alloc" role="img" aria-label="allocation">
        {parts.map((p, i) => <span key={p.label} title={`${p.label} ${pct((p.value / total) * 100, lang, false)}`} style={{ width: `${(p.value / total) * 100}%`, background: PALETTE[i % PALETTE.length] }} />)}
      </div>
      <div className="legend">
        {parts.map((p, i) => (
          <div key={p.label}><i style={{ background: PALETTE[i % PALETTE.length] }} />{p.label} <span className="muted num">{pct((p.value / total) * 100, lang, false)}</span></div>
        ))}
      </div>
    </div>
  );
}
