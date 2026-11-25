"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePrefs } from "@/components/prefs";
import { PanelHead } from "@/components/ui";
import { HEATMAP } from "@/lib/universe";

export default function ResearchHome() {
  const { lang } = usePrefs();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<{ symbol: string; name: string; exchange: string }[]>([]);
  useEffect(() => {
    if (!q.trim()) return;
    const id = setTimeout(() => fetch(`/api/data/search?q=${encodeURIComponent(q)}`).then(r => r.json()).then(j => setRes(j.data ?? [])).catch(() => setRes([])), 220);
    return () => clearTimeout(id);
  }, [q]);
  return (
    <div className="page">
      <header className="masthead">
        <div>
          <div className="kicker">{lang === "it" ? "Ricerca titoli" : "Stock research"}</div>
          <h1 className="h1">{lang === "it" ? "Ogni azienda, una scheda" : "Every company, one dossier"}</h1>
        </div>
      </header>
      <input className="input" style={{ fontSize: "1.2rem", padding: "1rem" }} autoFocus value={q} onChange={e => setQ(e.target.value)}
        placeholder={lang === "it" ? "Nome o simbolo: Ferrari, Apple, NVDA…" : "Name or symbol: Ferrari, Apple, NVDA…"} />
      <div className="rows" style={{ marginTop: "1rem" }}>
        {(q.trim() ? res : []).map(r => <Link key={r.symbol} href={`/research/${r.symbol}`}><span className="name">{r.name}</span><span className="muted num">{r.symbol} · {r.exchange}</span></Link>)}
      </div>
      <section className="panel" style={{ marginTop: "2rem" }}>
        <PanelHead kicker={lang === "it" ? "Spunti" : "Starting points"} title={lang === "it" ? "Aziende monitorate" : "Tracked companies"} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
          {HEATMAP.map(h => <Link key={h.symbol} href={`/research/${h.symbol}`} className="tag" style={{ textDecoration: "none", fontSize: ".75rem", padding: ".35rem .6rem" }}>{h.name}</Link>)}
        </div>
      </section>
    </div>
  );
}
