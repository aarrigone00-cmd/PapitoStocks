"use client";
import { useEffect, useMemo, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { usePrefs } from "./prefs";
import { usd } from "@/lib/format";
import { SYMBOL_RE } from "@/lib/universe";
import type { Position } from "@/lib/types";

export type Picked = { source: "holdings" | "hypo"; symbols: string[]; weights: number[]; value: number };
type Row = { symbol: string; pct: number };

const KEY = "ps_hypo";
const DEFAULT_ROWS: Row[] = [{ symbol: "SPY", pct: 40 }, { symbol: "RACE", pct: 15 }, { symbol: "AAPL", pct: 15 }, { symbol: "KO", pct: 15 }, { symbol: "E", pct: 15 }];

function load(): { rows: Row[]; value: number } {
  try { const j = JSON.parse(localStorage.getItem(KEY) || "null"); if (j?.rows?.length) return j; } catch { /* ignore */ }
  return { rows: DEFAULT_ROWS, value: 10000 };
}

/** Lets the user analyse their real holdings or a hypothetical mix. */
export function PortfolioPicker({ onChange }: { onChange: (p: Picked | null) => void }) {
  const { lang } = usePrefs();
  const pos = useApi<Position[]>("/api/data/positions");
  const holdings = useMemo(() => (pos.data ?? []).filter(p => p.marketValue > 0), [pos.data]);
  const [source, setSource] = useState<"holdings" | "hypo" | null>(null);
  const [rows, setRows] = useState<Row[]>(DEFAULT_ROWS);
  const [value, setValue] = useState(10000);
  const [draft, setDraft] = useState("");

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { const s = load(); setRows(s.rows); setValue(s.value); }, []);
  const effectiveSource = source ?? (pos.data ? (holdings.length ? "holdings" : "hypo") : null);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ rows, value })); } catch { /* ignore */ }
  }, [rows, value]);

  useEffect(() => {
    if (!effectiveSource) { onChange(null); return; }
    if (effectiveSource === "holdings") {
      const total = holdings.reduce((s, p) => s + p.marketValue, 0);
      onChange(total > 0 ? { source: "holdings", symbols: holdings.map(p => p.symbol), weights: holdings.map(p => p.marketValue / total), value: total } : null);
    } else {
      const valid = rows.filter(r => SYMBOL_RE.test(r.symbol) && r.pct > 0);
      const tot = valid.reduce((s, r) => s + r.pct, 0);
      onChange(tot > 0 ? { source: "hypo", symbols: valid.map(r => r.symbol), weights: valid.map(r => r.pct / tot), value } : null);
    }
  }, [effectiveSource, holdings, rows, value, onChange]);

  const totalPct = rows.reduce((s, r) => s + (r.pct || 0), 0);

  return (
    <div className="boxed" style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div className="seg">
          <button aria-pressed={effectiveSource === "holdings"} disabled={!holdings.length} onClick={() => setSource("holdings")}>
            {lang === "it" ? "Il mio portafoglio" : "My portfolio"}
          </button>
          <button aria-pressed={effectiveSource === "hypo"} onClick={() => setSource("hypo")}>{lang === "it" ? "Portafoglio ipotetico" : "Hypothetical portfolio"}</button>
        </div>
        {effectiveSource === "holdings" && <span className="small muted">{holdings.length} {lang === "it" ? "posizioni" : "holdings"} · {usd(holdings.reduce((s, p) => s + p.marketValue, 0), lang)}</span>}
        {!holdings.length && pos.data && <span className="small muted">{lang === "it" ? "Nessuna posizione aperta: prova con un portafoglio ipotetico." : "No open positions: try a hypothetical portfolio."}</span>}
      </div>

      {effectiveSource === "hypo" && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", alignItems: "center" }}>
            {rows.map((r, i) => (
              <span key={r.symbol + i} style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--rule)", background: "var(--bg)" }}>
                <b className="small" style={{ padding: "0 .5rem", letterSpacing: ".04em" }}>{r.symbol}</b>
                <input aria-label={`${r.symbol} %`} className="input num" style={{ width: "4.2rem", border: 0, borderLeft: "1px solid var(--rule)", padding: ".45rem .4rem" }}
                  inputMode="decimal" value={r.pct} onChange={e => setRows(rs => rs.map((x, k) => k === i ? { ...x, pct: Number(e.target.value.replace(",", ".")) || 0 } : x))} />
                <span className="small muted" style={{ paddingRight: ".3rem" }}>%</span>
                <button className="icon-btn" style={{ border: 0 }} aria-label="remove" onClick={() => setRows(rs => rs.filter((_, k) => k !== i))}>×</button>
              </span>
            ))}
            <form onSubmit={e => { e.preventDefault(); const s = draft.trim().toUpperCase(); if (SYMBOL_RE.test(s) && !rows.some(r => r.symbol === s) && rows.length < 20) { setRows(rs => [...rs, { symbol: s, pct: 10 }]); setDraft(""); } }}
              style={{ display: "inline-flex" }}>
              <input className="input" style={{ width: "7rem", padding: ".45rem .5rem" }} placeholder={lang === "it" ? "+ simbolo" : "+ symbol"} value={draft} onChange={e => setDraft(e.target.value)} />
            </form>
          </div>
          <div style={{ display: "flex", gap: "1.2rem", alignItems: "center", marginTop: ".8rem", flexWrap: "wrap" }}>
            <label className="small">{lang === "it" ? "Importo ($)" : "Amount ($)"}{" "}
              <input className="input num" style={{ width: "8rem", padding: ".4rem .5rem", display: "inline-block" }} inputMode="decimal" value={value}
                onChange={e => setValue(Number(e.target.value.replace(/[^\d.]/g, "")) || 0)} />
            </label>
            <span className={`small ${Math.abs(totalPct - 100) > 0.5 ? "down" : "muted"}`}>
              {lang === "it" ? "Totale" : "Total"} {totalPct}%{Math.abs(totalPct - 100) > 0.5 ? (lang === "it" ? " (verrà riportato a 100%)" : " (will be scaled to 100%)") : ""}
            </span>
            <button className="icon-btn" onClick={() => setRows(DEFAULT_ROWS)}>{lang === "it" ? "Esempio" : "Example"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
