"use client";
import Link from "next/link";
import type { Meta } from "@/lib/types";
import { dir, pct, time } from "@/lib/format";
import { usePrefs } from "./prefs";

const FRESH: Record<string, { it: string; en: string }> = {
  realtime: { it: "Tempo reale", en: "Real-time" }, delayed: { it: "Ritardato", en: "Delayed" },
  historical: { it: "Storico", en: "Historical" }, demo: { it: "Demo", en: "Demo" }, unavailable: { it: "Non disponibile", en: "Unavailable" },
};

export function SourceTag({ meta, label }: { meta: Meta | null; label?: string }) {
  const { lang } = usePrefs();
  if (!meta) return null;
  const src = ({ alpaca: "Alpaca", demo: "Demo", gdelt: "GDELT", worldbank: lang === "it" ? "Banca Mondiale" : "World Bank", none: "—" } as const)[meta.source];
  return (
    <span className="source-tag" data-f={meta.freshness} title={meta.note ?? ""}>
      <i aria-hidden />
      {label ? `${label} · ` : ""}{meta.source === "demo" ? src : `${src} · ${FRESH[meta.freshness][lang]}`} · {time(meta.asOf, lang)}
    </span>
  );
}

export function PanelHead({ kicker, title, meta, right }: { kicker?: string; title: string; meta?: Meta | null; right?: React.ReactNode }) {
  return (
    <div className="panel-head">
      <div className="titles">
        {kicker && <span className="kicker">{kicker}</span>}
        <h2 className="h2">{title}</h2>
      </div>
      <div style={{ display: "flex", gap: ".8rem", alignItems: "center" }}>
        {right}
        {meta !== undefined && <SourceTag meta={meta ?? null} />}
      </div>
    </div>
  );
}

export function Delta({ value, suffix }: { value: number | null | undefined; suffix?: string }) {
  const { lang } = usePrefs();
  const d = dir(value);
  return <span className={`delta ${d}`}>{d === "up" ? "▲ " : d === "down" ? "▼ " : ""}{pct(value, lang)}{suffix ? ` ${suffix}` : ""}</span>;
}

export function Chip({ value }: { value: number | null | undefined }) {
  const { lang } = usePrefs();
  const d = dir(value);
  return <span className={`chip ${d}`}><span className={d}>{pct(value, lang)}</span></span>;
}

export function Skeleton({ lines = 3, height = ".9rem" }: { lines?: number; height?: string }) {
  return (
    <div style={{ display: "grid", gap: ".6rem" }} aria-busy="true">
      {Array.from({ length: lines }).map((_, i) => <div key={i} className="skel" style={{ height, width: `${92 - i * 9}%` }} />)}
    </div>
  );
}

export function ErrorNote({ error, onRetry }: { error: string; onRetry?: () => void }) {
  const { t } = usePrefs();
  return (
    <div className="notice warn">
      <b>{t.loadError}.</b> <span className="muted small">{error}</span>
      {onRetry && <> <button className="icon-btn" onClick={onRetry} style={{ marginLeft: ".6rem" }}>{t.retry}</button></>}
    </div>
  );
}

export function NotConnected({ text, phase, needs }: { text: string; phase: number; needs: string }) {
  const { t } = usePrefs();
  return (
    <div className="notice">
      <div className="kicker" style={{ marginBottom: ".35rem" }}>{t.notConnected} · {t.phase} {phase}</div>
      <p style={{ margin: 0 }} className="small">{text}</p>
      <p style={{ margin: ".4rem 0 0" }} className="tiny muted">{t.needs}: {needs}</p>
    </div>
  );
}

export function SymLink({ symbol, children }: { symbol: string; children?: React.ReactNode }) {
  return <Link href={`/research/${encodeURIComponent(symbol)}`}>{children ?? symbol}</Link>;
}
