"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useIntel } from "@/hooks/useIntel";
import { usePrefs } from "@/components/prefs";
import { PanelHead, Delta, Skeleton } from "@/components/ui";
import { WorldMap } from "@/components/worldmap";
import { CHOKEPOINTS, COUNTRY_ETF, ROUTES, SYMBOL_COUNTRY } from "@/lib/geo";
import { countryName, flag } from "@/lib/countries";
import { score, type TopicId } from "@/lib/intel";
import { HEATMAP } from "@/lib/universe";
import { num, pct, usd, compact, ago } from "@/lib/format";
import type { Bar, Position, Quote } from "@/lib/types";

type WB = Record<string, { value: number; year: string }>;
const WB_KEYS = ["gdp", "infl", "unemp", "debt", "ca", "gdppc", "exports", "pop", "rate", "fdi"] as const;
type WbKey = (typeof WB_KEYS)[number];
type LayerId = "news" | "tension" | "risk" | "market" | "market1y" | "gdp" | "infl" | "unemp" | "debt" | "ca" | "rate" | "fdi" | "exposure";
type Scale = { kind: "seq"; max: number; tone: "bad" | "neutral" } | { kind: "div"; span: number };

const MIN_YEAR = new Date().getFullYear() - 6;
const INTEL_TOPICS: TopicId[] = ["geopolitics", "trade", "elections", "energy", "macro"];

const LAYERS: { id: LayerId; it: string; en: string; scale: Scale; unit: string; src: { it: string; en: string } }[] = [
  { id: "news", it: "Attenzione dei media (24 ore)", en: "Media attention (24 hours)", scale: { kind: "seq", max: 30, tone: "neutral" }, unit: "", src: { it: "Notizie in cui il Paese è citato nel titolo (GDELT + Alpaca, fonti principali)", en: "Stories naming the country in the headline (GDELT + Alpaca, main sources)" } },
  { id: "tension", it: "Tensioni geopolitiche nelle notizie", en: "Geopolitical tension in the news", scale: { kind: "seq", max: 12, tone: "bad" }, unit: "", src: { it: "Notizie su conflitti, guerre e attacchi che citano il Paese (24 ore)", en: "Stories on conflicts, wars and attacks naming the country (24 hours)" } },
  { id: "risk", it: "Indice di attenzione Papitostocks", en: "Papitostocks watch index", scale: { kind: "seq", max: 8, tone: "bad" }, unit: "/8", src: { it: "Punteggio trasparente: vedi «Metodo» sotto la mappa", en: "Transparent score: see “Method” below the map" } },
  { id: "market", it: "Borsa oggi", en: "Stock market today", scale: { kind: "div", span: 3 }, unit: "%", src: { it: "ETF quotato a New York che replica il mercato del Paese (Alpaca, IEX)", en: "New York-listed ETF tracking the country's market (Alpaca, IEX)" } },
  { id: "market1y", it: "Borsa ultimi 12 mesi", en: "Stock market, last 12 months", scale: { kind: "div", span: 40 }, unit: "%", src: { it: "ETF del Paese, variazione su un anno in dollari (Alpaca, IEX)", en: "Country ETF, one-year change in dollars (Alpaca, IEX)" } },
  { id: "gdp", it: "Crescita del PIL", en: "GDP growth", scale: { kind: "div", span: 6 }, unit: "%", src: { it: "Banca Mondiale, crescita annua reale", en: "World Bank, real annual growth" } },
  { id: "infl", it: "Inflazione", en: "Inflation", scale: { kind: "seq", max: 12, tone: "bad" }, unit: "%", src: { it: "Banca Mondiale, prezzi al consumo", en: "World Bank, consumer prices" } },
  { id: "unemp", it: "Disoccupazione", en: "Unemployment", scale: { kind: "seq", max: 20, tone: "bad" }, unit: "%", src: { it: "Banca Mondiale (stime ILO)", en: "World Bank (ILO estimates)" } },
  { id: "debt", it: "Debito pubblico / PIL", en: "Government debt / GDP", scale: { kind: "seq", max: 150, tone: "bad" }, unit: "%", src: { it: "Banca Mondiale, debito del governo centrale (copertura incompleta)", en: "World Bank, central government debt (incomplete coverage)" } },
  { id: "ca", it: "Conti con l'estero / PIL", en: "Current account / GDP", scale: { kind: "div", span: 10 }, unit: "%", src: { it: "Banca Mondiale: positivo = il Paese vende all'estero più di quanto compra", en: "World Bank: positive = the country sells abroad more than it buys" } },
  { id: "rate", it: "Tasso sui prestiti", en: "Lending interest rate", scale: { kind: "seq", max: 20, tone: "bad" }, unit: "%", src: { it: "Banca Mondiale (non disponibile per l'area euro)", en: "World Bank (not available for the euro area)" } },
  { id: "fdi", it: "Investimenti esteri in entrata / PIL", en: "Foreign investment inflows / GDP", scale: { kind: "seq", max: 8, tone: "neutral" }, unit: "%", src: { it: "Banca Mondiale, investimenti diretti esteri netti", en: "World Bank, net foreign direct investment" } },
  { id: "exposure", it: "Il mio portafoglio", en: "My portfolio", scale: { kind: "seq", max: 100, tone: "neutral" }, unit: "%", src: { it: "Peso delle tue posizioni per Paese della società", en: "Weight of your holdings by company home country" } },
];

const BAD = "#8E2F23", GOOD = "#1F5B43", NEUTRAL = "#112A23";
function colorFor(v: number | null | undefined, s: Scale) {
  if (v == null || !isFinite(v)) return "var(--surface-2)";
  if (s.kind === "div") {
    const k = Math.max(-1, Math.min(1, v / s.span));
    return `color-mix(in srgb, ${k >= 0 ? GOOD : BAD} ${Math.round(12 + Math.abs(k) * 78)}%, var(--surface))`;
  }
  const k = Math.max(0, Math.min(1, v / s.max));
  return `color-mix(in srgb, ${s.tone === "bad" ? BAD : NEUTRAL} ${Math.round(8 + k * 82)}%, var(--surface))`;
}

function useWorldBank() {
  const [data, setData] = useState<Partial<Record<WbKey, WB>>>({});
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let off = false;
    WB_KEYS.forEach(async k => {
      try {
        const r = await fetch(`/api/worldbank?ind=${k}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        if (!off) setData(d => ({ ...d, [k]: j.data }));
      } catch (e) { if (!off) setErr(e instanceof Error ? e.message : String(e)); }
    });
    return () => { off = true; };
  }, []);
  return { data, err };
}

export default function WorldMapPage() {
  const { lang } = usePrefs();
  const L = lang === "it";
  const [layer, setLayer] = useState<LayerId>("news");
  const [sel, setSel] = useState<string | null>("ITA");
  const [choke, setChoke] = useState<string | null>(null);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showChoke, setShowChoke] = useState(true);

  const wb = useWorldBank();
  const intel = useIntel(INTEL_TOPICS);
  const etfs = Object.values(COUNTRY_ETF);
  const quotes = useApi<Quote[]>(`/api/data/quotes?symbols=${etfs.join(",")}`, 120_000);
  const y1a = useApi<Record<string, Bar[]>>(`/api/data/multibars?range=1Y&symbols=${etfs.slice(0, 30).join(",")}`);
  const y1b = useApi<Record<string, Bar[]>>(`/api/data/multibars?range=1Y&symbols=${etfs.slice(30).join(",")}`);
  const pos = useApi<Position[]>("/api/data/positions");

  const main = useMemo(() => intel.items.filter(i => i.tier !== "other"), [intel.items]);
  const values = useMemo(() => {
    const v: Record<LayerId, Record<string, number>> = { news: {}, tension: {}, risk: {}, market: {}, market1y: {}, gdp: {}, infl: {}, unemp: {}, debt: {}, ca: {}, rate: {}, fdi: {}, exposure: {} };
    for (const it of main) for (const c of it.countries) {
      v.news[c] = (v.news[c] ?? 0) + 1;
      if (it.topics.includes("geopolitics")) v.tension[c] = (v.tension[c] ?? 0) + 1;
    }
    const qBy = new Map((quotes.data ?? []).map(q => [q.symbol, q]));
    const bars = { ...(y1a.data ?? {}), ...(y1b.data ?? {}) };
    for (const [iso, etf] of Object.entries(COUNTRY_ETF)) {
      const q = qBy.get(etf);
      if (q?.changePct != null) v.market[iso] = q.changePct;
      const b = bars[etf];
      if (b && b.length > 100) v.market1y[iso] = ((q?.price ?? b[b.length - 1].c) / b[0].c - 1) * 100;
    }
    // Ignore figures older than 6 years: World Bank's "latest" can be decades old for some series.
    for (const k of ["gdp", "infl", "unemp", "debt", "ca", "rate", "fdi"] as const)
      for (const [iso, x] of Object.entries(wb.data[k] ?? {})) if (Number(x.year) >= MIN_YEAR) v[k][iso] = x.value;
    // Transparent watch index (0–8)
    const isos = new Set([...Object.keys(wb.data.infl ?? {}), ...Object.keys(v.tension)]);
    for (const iso of isos) {
      let s = 0;
      const inf = v.infl[iso], debt = v.debt[iso], ca = v.ca[iso], g = v.gdp[iso], t = v.tension[iso] ?? 0;
      if (inf != null) s += inf > 10 ? 2 : inf > 5 ? 1 : 0;
      if (debt != null) s += debt > 100 ? 2 : debt > 70 ? 1 : 0;
      if (ca != null && ca < -5) s += 1;
      if (g != null && g < 0) s += 1;
      s += t >= 5 ? 2 : t >= 2 ? 1 : 0;
      if (inf != null || t) v.risk[iso] = s;
    }
    const holdings = pos.data ?? [];
    const total = holdings.reduce((a, p) => a + p.marketValue, 0);
    for (const p of holdings) {
      const iso = SYMBOL_COUNTRY[p.symbol] ?? "USA";
      v.exposure[iso] = (v.exposure[iso] ?? 0) + (total ? (p.marketValue / total) * 100 : 0);
    }
    return v;
  }, [main, quotes.data, y1a.data, y1b.data, wb.data, pos.data]);

  const def = LAYERS.find(l => l.id === layer)!;
  const fmt = (v: number | undefined, unit = def.unit) => v == null ? "—" : unit === "%" ? (def.scale.kind === "div" ? pct(v, lang) : pct(v, lang, false)) : `${num(v, lang, 1)}${unit}`;
  const yearOf = (iso: string) => (["gdp", "infl", "unemp", "debt", "ca", "rate", "fdi"] as string[]).includes(layer) ? wb.data[layer as WbKey]?.[iso]?.year : undefined;

  const cp = CHOKEPOINTS.find(c => c.id === choke);
  const sHeadlines = useMemo(() => sel ? main.filter(i => i.countries.includes(sel)).sort((a, b) => score(b) - score(a)).slice(0, 6) : [], [main, sel]);
  const ind = (k: WbKey) => sel ? wb.data[k]?.[sel] : undefined;
  const etf = sel ? COUNTRY_ETF[sel] : undefined;
  const etfQ = etf ? quotes.data?.find(q => q.symbol === etf) : undefined;
  const companies = sel ? HEATMAP.filter(h => (SYMBOL_COUNTRY[h.symbol] ?? "USA") === sel) : [];
  const myHere = sel ? (pos.data ?? []).filter(p => (SYMBOL_COUNTRY[p.symbol] ?? "USA") === sel) : [];

  const legend = def.scale.kind === "div"
    ? { ramp: `linear-gradient(90deg, ${BAD}, var(--surface), ${GOOD})`, lo: fmt(-def.scale.span), hi: fmt(def.scale.span) }
    : { ramp: `linear-gradient(90deg, var(--surface), ${def.scale.tone === "bad" ? BAD : NEUTRAL})`, lo: "0", hi: `${def.scale.max}${def.unit}+` };

  return (
    <div className="page">
      <header className="masthead">
        <div>
          <div className="kicker">{L ? "Mappa del mondo" : "World map"}</div>
          <h1 className="h1">{L ? "Dove succede, e perché conta" : "Where it happens, and why it matters"}</h1>
          <p className="lede" style={{ margin: ".4rem 0 0" }}>{L ? "Economia, mercati, notizie e rotte strategiche, Paese per Paese. Clicca un Paese o un punto dorato." : "Economy, markets, news and strategic routes, country by country. Click a country or a gold point."}</p>
        </div>
        {!intel.done && <div className="small muted">{L ? "Carico le notizie…" : "Loading news…"} {intel.status.filter(s => s.state !== "pending").length}/{intel.status.length}</div>}
      </header>

      <div className="grid">
        <aside className="panel span-3">
          <PanelHead kicker={L ? "Livelli" : "Layers"} title={L ? "Cosa mostrare" : "What to show"} />
          <div className="layer-list">
            {LAYERS.map(l => <button key={l.id} aria-pressed={layer === l.id} onClick={() => setLayer(l.id)}><span>{l[lang]}</span></button>)}
          </div>
          <div style={{ marginTop: "1rem", display: "grid", gap: ".4rem" }} className="small">
            <label><input type="checkbox" checked={showRoutes} onChange={e => setShowRoutes(e.target.checked)} /> {L ? "Rotte commerciali ed energetiche" : "Trade & energy routes"}</label>
            <label><input type="checkbox" checked={showChoke} onChange={e => setShowChoke(e.target.checked)} /> {L ? "Stretti strategici" : "Strategic chokepoints"}</label>
          </div>
        </aside>

        <section className="panel span-9">
          <WorldMap
            fill={iso => colorFor(iso ? values[layer][iso] : null, def.scale)}
            selected={sel} onSelect={iso => { setSel(iso); setChoke(null); }}
            showRoutes={showRoutes} showChokepoints={showChoke} onChokepoint={id => setChoke(id)}
            tooltip={(iso, name) => (
              <>
                <b>{flag(iso)} {countryName(iso, lang) || name}</b><br />
                {def[lang]}: <b className="num">{fmt(values[layer][iso])}</b>{yearOf(iso) ? <span className="muted"> ({yearOf(iso)})</span> : null}
              </>
            )} />
          <div className="wm-legend">
            <span>{legend.lo}</span><span className="ramp" style={{ background: legend.ramp }} /><span>{legend.hi}</span>
            <span><i style={{ display: "inline-block", width: 12, height: 10, background: "var(--surface-2)", border: "1px solid var(--rule)", verticalAlign: "middle" }} /> {L ? "dati non disponibili" : "no data"}</span>
            <span>· {def.src[lang]}</span>
            {showRoutes && <span>· <b style={{ color: "var(--forest)" }}>– –</b> {L ? "merci" : "goods"} <b style={{ color: "#A8761F" }}>– –</b> {L ? "energia" : "energy"}</span>}
          </div>
          {wb.err && <p className="tiny down">{L ? "Banca Mondiale non raggiungibile: " : "World Bank unreachable: "}{wb.err}</p>}
        </section>

        {cp && (
          <section className="panel span-12">
            <div className="notice">
              <div className="kicker">{L ? "Stretto strategico" : "Strategic chokepoint"}</div>
              <h3 className="h2" style={{ margin: ".3rem 0" }}>{cp.name[lang]}</h3>
              <p style={{ margin: 0 }}>{cp.note[lang]}</p>
              <p className="tiny muted" style={{ margin: ".5rem 0 0" }}>{L ? "Rotte che ci passano: " : "Routes through it: "}{ROUTES.filter(r => r.path.some(([x, y]) => Math.abs(x - cp.at[0]) < 3 && Math.abs(y - cp.at[1]) < 3)).map(r => r.name[lang]).join(" · ") || "—"}</p>
            </div>
          </section>
        )}

        {sel && (
          <>
            <section className="panel span-5">
              <PanelHead kicker={L ? "Dossier Paese" : "Country dossier"} title={`${flag(sel)} ${countryName(sel, lang)}`} />
              {Object.keys(wb.data).length < 3 ? <Skeleton lines={8} /> : (
                <div className="rows small">
                  {([
                    ["gdp", L ? "Crescita del PIL" : "GDP growth", "pct"], ["infl", L ? "Inflazione" : "Inflation", "pct"], ["unemp", L ? "Disoccupazione" : "Unemployment", "pct"],
                    ["debt", L ? "Debito pubblico / PIL" : "Government debt / GDP", "pct"], ["ca", L ? "Conti con l'estero / PIL" : "Current account / GDP", "pct"],
                    ["rate", L ? "Tasso sui prestiti" : "Lending rate", "pct"], ["exports", L ? "Esportazioni / PIL" : "Exports / GDP", "pct"],
                    ["fdi", L ? "Investimenti esteri / PIL" : "Foreign investment / GDP", "pct"], ["gdppc", L ? "PIL pro capite" : "GDP per person", "usd"], ["pop", L ? "Popolazione" : "Population", "n"],
                  ] as [WbKey, string, string][]).map(([k, label, f]) => {
                    const x = ind(k);
                    return (
                      <div key={k}><span>{label}</span>
                        <span style={x && Number(x.year) < MIN_YEAR ? { opacity: .55 } : undefined}><b className="num">{x == null ? "—" : f === "usd" ? usd(x.value, lang, 0) : f === "n" ? compact(x.value, lang) : pct(x.value, lang, k === "gdp" || k === "ca")}</b>{x && <span className={`tiny ${Number(x.year) < MIN_YEAR ? "down" : "muted"}`}> · {x.year}{Number(x.year) < MIN_YEAR ? (L ? " (dato vecchio)" : " (old data)") : ""}</span>}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="tiny muted">{L ? `Dati annuali della Banca Mondiale: l'ultimo anno disponibile cambia da Paese a Paese. I dati precedenti al ${MIN_YEAR} sono segnalati come vecchi ed esclusi dalla mappa.` : `Annual World Bank data: the latest available year varies by country. Figures before ${MIN_YEAR} are flagged as old and left off the map.`}</p>
            </section>
            <section className="panel span-3 vrule">
              <PanelHead kicker={L ? "Borsa" : "Stock market"} title={etf ? etf : "—"} meta={etf ? quotes.meta : undefined} />
              {etf ? (
                <div className="rows small">
                  <div><span>{L ? "Prezzo" : "Price"}</span><b className="num">{usd(etfQ?.price, lang)}</b></div>
                  <div><span>{L ? "Oggi" : "Today"}</span><Delta value={etfQ?.changePct} /></div>
                  <div><span>{L ? "12 mesi" : "12 months"}</span><Delta value={values.market1y[sel]} /></div>
                  <div><Link href={`/research/${etf}`} className="kicker">{L ? "Apri la scheda →" : "Open dossier →"}</Link><span /></div>
                </div>
              ) : <p className="small muted">{L ? "Nessun ETF americano che replichi questo mercato." : "No US-listed ETF tracks this market."}</p>}
              <p className="tiny muted">{L ? "Fondo quotato a New York, in dollari: include l'effetto del cambio." : "New York-listed fund, in dollars: includes the currency effect."}</p>
              <div style={{ marginTop: "1.2rem" }}>
                <PanelHead kicker={L ? "Il tuo portafoglio" : "Your portfolio"} title={myHere.length ? `${myHere.length} ${L ? "posizioni" : "holdings"}` : "—"} />
                {myHere.length ? <div className="rows small">{myHere.map(p => <Link key={p.symbol} href={`/research/${p.symbol}`}><span className="sym">{p.symbol}</span><span className="num">{usd(p.marketValue, lang, 0)}</span></Link>)}</div>
                  : <p className="small muted">{L ? "Nessuna esposizione diretta." : "No direct exposure."}</p>}
                {companies.length > 0 && <p className="tiny muted">{L ? "Aziende monitorate di questo Paese: " : "Tracked companies from this country: "}{companies.slice(0, 12).map(c => c.symbol).join(", ")}{companies.length > 12 ? "…" : ""}</p>}
              </div>
            </section>
            <section className="panel span-4 vrule">
              <PanelHead kicker={L ? "Notizie (24 ore)" : "News (24 hours)"} title={L ? "Cosa succede" : "What's happening"} />
              {!intel.items.length ? <Skeleton lines={5} /> : sHeadlines.length === 0 ? <p className="small muted">{L ? "Nessuna notizia recente nelle fonti principali." : "No recent stories in the main sources."}</p> : (
                <div>
                  {sHeadlines.map(h => (
                    <div key={h.id} className="story" style={{ padding: ".55rem 0" }}>
                      <a href={h.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}><b style={{ fontSize: ".92rem" }}>{h.title}</b></a>
                      <div className="story-meta">{h.source} · {ago(h.seen, lang)}{h.coverage > 1 ? ` · ${h.coverage} ${L ? "testate" : "outlets"}` : ""}</div>
                    </div>
                  ))}
                </div>
              )}
              <Link href={`/intelligence?country=${sel}`} className="kicker" style={{ display: "inline-block", marginTop: ".6rem" }}>{L ? "Tutte le notizie →" : "All news →"}</Link>
            </section>
          </>
        )}

        <section className="panel span-12">
          <details>
            <summary className="kicker" style={{ cursor: "pointer" }}>{L ? "Metodo dell'indice di attenzione" : "Watch index method"}</summary>
            <div className="small" style={{ marginTop: ".7rem", maxWidth: 820 }}>
              <p>{L ? "Un punteggio semplice da 0 a 8, costruito solo con dati verificabili, per segnalare dove guardare, non per prevedere crisi:" : "A simple 0–8 score built only from verifiable data, to flag where to look, not to predict crises:"}</p>
              <ul className="list-plain">
                <li>{L ? "Inflazione: oltre 5% = 1 punto, oltre 10% = 2 punti" : "Inflation: above 5% = 1 point, above 10% = 2 points"}</li>
                <li>{L ? "Debito pubblico/PIL: oltre 70% = 1, oltre 100% = 2" : "Government debt/GDP: above 70% = 1, above 100% = 2"}</li>
                <li>{L ? "Deficit con l'estero oltre il 5% del PIL = 1" : "Current-account deficit above 5% of GDP = 1"}</li>
                <li>{L ? "Economia in contrazione (PIL negativo) = 1" : "Shrinking economy (negative GDP growth) = 1"}</li>
                <li>{L ? "Notizie su conflitti nelle ultime 24 ore: 2–4 = 1, 5 o più = 2" : "Conflict stories in the last 24 hours: 2–4 = 1, 5 or more = 2"}</li>
              </ul>
              <p className="muted">{L ? "Limiti: i dati della Banca Mondiale sono annuali e in ritardo; il debito pubblico manca per molti Paesi; il conteggio delle notizie misura l'attenzione dei media, non la gravità reale. Paesi senza dati ottengono punteggi più bassi solo per mancanza di informazioni." : "Limits: World Bank data are annual and lagged; government debt is missing for many countries; news counts measure media attention, not real severity. Countries without data score lower only for lack of information."}</p>
            </div>
          </details>
        </section>
      </div>
    </div>
  );
}
