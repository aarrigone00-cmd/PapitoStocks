"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useIntel } from "@/hooks/useIntel";
import { useApi } from "@/hooks/useApi";
import { usePrefs } from "@/components/prefs";
import { PanelHead, NotConnected, Skeleton, SourceTag } from "@/components/ui";
import { TOPICS, regionOfIso, score, type IntelItem, type RegionId, type TopicId } from "@/lib/intel";
import { countryName, flag } from "@/lib/countries";
import { ago, dateTime, isToday } from "@/lib/format";
import type { Position } from "@/lib/types";

const REGIONS: Record<RegionId, { it: string; en: string }> = {
  europe: { it: "Europa", en: "Europe" }, namerica: { it: "Nord America", en: "North America" }, latam: { it: "America Latina", en: "Latin America" },
  asia: { it: "Asia-Pacifico", en: "Asia-Pacific" }, mideast: { it: "Medio Oriente", en: "Middle East" }, africa: { it: "Africa", en: "Africa" },
};
const topicById = (id: TopicId) => TOPICS.find(t => t.id === id)!;

function Story({ it, size = "md", mine }: { it: IntelItem; size?: "lg" | "md" | "sm"; mine: boolean }) {
  const { lang } = usePrefs();
  const L = lang === "it";
  return (
    <article className="story" style={size === "lg" ? { borderBottom: 0 } : undefined}>
      <div className="kicker" style={{ marginBottom: ".3rem" }}>{it.topics.filter(t => t !== "markets" || it.origin === "alpaca").slice(0, 2).map(t => topicById(t).label[lang]).join(" · ")}</div>
      {size === "lg" && it.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={it.image} alt="" loading="lazy" referrerPolicy="no-referrer" style={{ width: "100%", maxHeight: 340, objectFit: "cover", filter: "saturate(.85)", marginBottom: ".8rem" }} onError={e => (e.currentTarget.style.display = "none")} />
      )}
      <a href={it.url} target="_blank" rel="noopener noreferrer"><h3 className={size === "lg" ? "h1" : "h3"} style={size === "lg" ? { fontSize: "2rem" } : size === "sm" ? { fontSize: "1.05rem" } : undefined}>{it.title}</h3></a>
      <div className="story-meta">
        {isToday(it.seen) ? <span className="tag today">{L ? "Oggi" : "Today"}</span> : <span className="tag">{dateTime(it.seen, lang)}</span>}
        {mine && <span className="tag mine">{L ? "Tuo portafoglio" : "Your portfolio"}</span>}
        <span><b>{it.source}</b>{it.tier === "other" ? (L ? " · fonte minore" : " · minor source") : ""}</span>
        <span title={new Date(it.seen).toLocaleString()}>{it.origin === "gdelt" ? (L ? "rilevata " : "seen ") : (L ? "pubblicata " : "published ")}{ago(it.seen, lang)}</span>
        {it.updated && it.updated !== it.seen && <span>{L ? "aggiornata" : "updated"} {ago(it.updated, lang)}</span>}
        {it.coverage > 1 && <span>{it.coverage} {L ? "testate" : "outlets"}</span>}
        {it.countries.slice(0, 4).map(c => <Link key={c} href={`/intelligence?country=${c}`} className="tag">{flag(c)} {countryName(c, lang)}</Link>)}
        {it.eu && <span className="tag">🇪🇺 UE</span>}
        {it.symbols.slice(0, 3).map(s => <Link key={s} href={`/research/${s}`} className="tag">{s}</Link>)}
      </div>
    </article>
  );
}

function Explainer({ id }: { id: TopicId }) {
  const { lang } = usePrefs();
  const t = topicById(id);
  return (
    <div className="boxed">
      <div className="kicker">{lang === "it" ? "Perché conta per i mercati" : "Why it matters for markets"}</div>
      <p style={{ margin: ".5rem 0" }}>{t.why[lang]}</p>
      {t.sectors.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}>
          {t.sectors.map(s => <span key={s.name.en} className={`tag ${s.dir > 0 ? "mine" : ""}`} style={s.dir < 0 ? { borderColor: "var(--down)", color: "var(--down)" } : undefined}>{s.dir > 0 ? "▲" : s.dir < 0 ? "▼" : "◆"} {s.name[lang]}</span>)}
        </div>
      )}
      <p className="tiny muted" style={{ margin: ".6rem 0 0" }}>{lang === "it" ? "Meccanismi tipici di questo tipo di notizia, non un'analisi della singola notizia (in arrivo con l'AI, Fase 4)." : "Typical mechanisms for this kind of news, not an analysis of a specific story (coming with AI, Phase 4)."}</p>
    </div>
  );
}

function Intelligence() {
  const { lang } = usePrefs();
  const L = lang === "it";
  const params = useSearchParams();
  const { items, status, alpacaMeta, done } = useIntel();
  const pos = useApi<Position[]>("/api/data/positions");
  const holdings = useMemo(() => (pos.data ?? []).map(p => p.symbol), [pos.data]);

  const [topic, setTopic] = useState<TopicId | "all">((params.get("topic") as TopicId) ?? "all");
  const [region, setRegion] = useState<RegionId | "all">("all");
  const [country, setCountry] = useState<string>(params.get("country") ?? "all");
  const [quality, setQuality] = useState<"main" | "all">("main");
  const [onlyMine, setOnlyMine] = useState(false);
  const [onlyToday, setOnlyToday] = useState(false);
  const [sort, setSort] = useState<"rel" | "new">("rel");
  const [q, setQ] = useState("");

  const isMine = (it: IntelItem) => it.symbols.some(s => holdings.includes(s));
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const out = items.filter(it =>
      (quality === "all" || it.tier !== "other") &&
      (topic === "all" || it.topics.includes(topic)) &&
      (country === "all" || it.countries.includes(country)) &&
      (region === "all" || it.countries.some(c => regionOfIso(c) === region) || (region === "europe" && it.eu)) &&
      (!onlyMine || isMine(it)) && (!onlyToday || isToday(it.seen)) &&
      (!term || it.title.toLowerCase().includes(term) || it.source.toLowerCase().includes(term)));
    return out.sort(sort === "new" ? (a, b) => b.seen.localeCompare(a.seen) : (a, b) => score(b, holdings) - score(a, holdings));
  }, [items, quality, topic, country, region, onlyMine, onlyToday, q, sort, holdings]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const m = new Map<TopicId, number>();
    for (const it of items) if (quality === "all" || it.tier !== "other") for (const t of it.topics) m.set(t, (m.get(t) ?? 0) + 1);
    return m;
  }, [items, quality]);
  const presentCountries = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) for (const c of it.countries) m.set(c, (m.get(c) ?? 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }, [items]);
  const breaking = useMemo(() => items.filter(i => i.tier === "major").sort((a, b) => b.seen.localeCompare(a.seen)).slice(0, 14), [items]);

  const filtering = topic !== "all" || region !== "all" || country !== "all" || onlyMine || onlyToday || q.trim() !== "";
  const loaded = status.filter(s => s.state !== "pending").length;
  const failed = status.filter(s => s.state === "error");
  const gdeltMeta = status.find(s => s.meta)?.meta ?? null;

  return (
    <div className="page">
      <header className="masthead">
        <div>
          <div className="kicker" suppressHydrationWarning>{L ? "Intelligence globale" : "Global intelligence"} · {new Date().toLocaleDateString(L ? "it-IT" : "en-US", { weekday: "long", day: "numeric", month: "long" })}</div>
          <h1 className="h1">{L ? "Il mondo, oggi" : "The world, today"}</h1>
          <p className="lede" style={{ margin: ".4rem 0 0" }}>{L ? "Politica, guerre, commercio, banche centrali, energia, tecnologia, clima: ciò che può muovere i mercati, da migliaia di testate." : "Politics, wars, trade, central banks, energy, technology, climate: what can move markets, from thousands of outlets."}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="small">{L ? "Argomenti" : "Topics"} {loaded}/{status.length}{!done && " …"}</div>
          {gdeltMeta && <SourceTag meta={gdeltMeta} />}<br />
          {alpacaMeta && <SourceTag meta={alpacaMeta} label="News" />}
        </div>
      </header>
      {!done && <div className="loader-line" style={{ marginTop: "-1.2rem", marginBottom: "1.2rem" }} />}

      {breaking.length > 0 && (
        <div className="ticker" style={{ margin: "0 0 1.6rem", border: "1px solid var(--rule)" }} aria-label={L ? "Ultime notizie" : "Breaking news"}>
          <div className="ticker-track" style={{ animationDuration: "120s" }}>
            {[...breaking, ...breaking].map((b, i) => (
              <a key={i} href={b.url} target="_blank" rel="noopener noreferrer" className="ticker-item" style={{ textDecoration: "none" }} aria-hidden={i >= breaking.length}>
                <b style={{ color: "var(--accent-ink)" }}>{b.source}</b><span>{b.title}</span><span className="muted">{ago(b.seen, lang)}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", marginBottom: ".9rem" }}>
        <button className="tag" style={{ cursor: "pointer", background: topic === "all" ? "var(--ink)" : "transparent", color: topic === "all" ? "var(--bg)" : undefined }} onClick={() => setTopic("all")}>{L ? "Tutti" : "All"} ({items.filter(i => quality === "all" || i.tier !== "other").length})</button>
        {TOPICS.filter(t => (counts.get(t.id) ?? 0) > 0).map(t => (
          <button key={t.id} className="tag" onClick={() => setTopic(t.id)}
            style={{ cursor: "pointer", background: topic === t.id ? "var(--ink)" : "transparent", color: topic === t.id ? "var(--bg)" : undefined }}>
            {t.glyph} {t.label[lang]} ({counts.get(t.id)})
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: ".7rem", alignItems: "flex-end", marginBottom: "1.6rem" }}>
        <div className="field"><label>{L ? "Regione" : "Region"}</label>
          <select className="input" value={region} onChange={e => setRegion(e.target.value as RegionId | "all")}>
            <option value="all">{L ? "Tutto il mondo" : "Whole world"}</option>
            {(Object.keys(REGIONS) as RegionId[]).map(r => <option key={r} value={r}>{REGIONS[r][lang]}</option>)}
          </select></div>
        <div className="field"><label>{L ? "Paese" : "Country"}</label>
          <select className="input" value={country} onChange={e => setCountry(e.target.value)}>
            <option value="all">{L ? "Tutti" : "All"}</option>
            {[...new Set([...(country !== "all" ? [country] : []), ...presentCountries])].map(c => <option key={c} value={c}>{flag(c)} {countryName(c, lang)}</option>)}
          </select></div>
        <div className="field" style={{ minWidth: 200 }}><label>{L ? "Cerca" : "Search"}</label><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder={L ? "es. Cina, petrolio, Nvidia" : "e.g. China, oil, Nvidia"} /></div>
        <div className="seg"><button aria-pressed={sort === "rel"} onClick={() => setSort("rel")}>{L ? "Rilevanza" : "Relevance"}</button><button aria-pressed={sort === "new"} onClick={() => setSort("new")}>{L ? "Più recenti" : "Newest"}</button></div>
        <div className="seg"><button aria-pressed={quality === "main"} onClick={() => setQuality("main")}>{L ? "Fonti principali" : "Main sources"}</button><button aria-pressed={quality === "all"} onClick={() => setQuality("all")}>{L ? "Tutte" : "All"}</button></div>
        <label className="small"><input type="checkbox" checked={onlyToday} onChange={e => setOnlyToday(e.target.checked)} /> {L ? "Solo oggi" : "Today only"}</label>
        <label className="small"><input type="checkbox" checked={onlyMine} disabled={!holdings.length} onChange={e => setOnlyMine(e.target.checked)} /> {L ? "Legate al mio portafoglio" : "Linked to my portfolio"}</label>
      </div>
      {failed.length > 0 && done && (
        <div className="notice warn small" style={{ marginBottom: "1.2rem" }}>
          {L ? "Alcuni argomenti non sono disponibili ora (il servizio GDELT limita le richieste): " : "Some topics are unavailable right now (GDELT rate-limits requests): "}
          {failed.map(f => topicById(f.id).label[lang]).join(", ")}. {L ? "Ricarica la pagina tra qualche minuto." : "Reload in a few minutes."}
        </div>
      )}

      {items.length === 0 ? <Skeleton lines={10} /> : filtering ? (
        <div className="grid">
          <section className="panel span-8">
            <PanelHead kicker={topic !== "all" ? topicById(topic).label[lang] : (L ? "Risultati" : "Results")} title={`${filtered.length} ${L ? "notizie" : "stories"}`} />
            {filtered.slice(0, 60).map(it => <Story key={it.id} it={it} mine={isMine(it)} />)}
            {!filtered.length && <p className="muted">{L ? "Nessuna notizia con questi filtri." : "No stories match these filters."}</p>}
          </section>
          <aside className="panel span-4 vrule">
            {topic !== "all" && <Explainer id={topic} />}
            <div style={{ marginTop: "1.2rem" }}><AiNote /></div>
          </aside>
        </div>
      ) : (
        <div className="grid">
          <section className="panel span-8">
            <PanelHead kicker={L ? "In primo piano" : "Leading"} title={L ? "Le notizie che contano di più" : "The stories that matter most"} />
            {filtered[0] && <Story it={filtered[0]} size="lg" mine={isMine(filtered[0])} />}
            <div className="grid" style={{ rowGap: 0, marginTop: ".4rem" }}>
              {filtered.slice(1, 5).map(it => <div key={it.id} className="span-6"><Story it={it} size="sm" mine={isMine(it)} /></div>)}
            </div>
          </section>
          <aside className="panel span-4 vrule">
            <PanelHead kicker={L ? "Anche" : "Also"} title={L ? "Da non perdere" : "Don't miss"} />
            {filtered.slice(5, 11).map(it => <Story key={it.id} it={it} size="sm" mine={isMine(it)} />)}
          </aside>
          {TOPICS.filter(t => t.id !== "markets" || alpacaMeta).map(t => {
            const list = filtered.filter(i => i.topics[0] === t.id || (i.origin === "alpaca" && t.id === "markets")).slice(0, 4);
            if (!list.length) return null;
            return (
              <section key={t.id} className="panel span-6">
                <PanelHead kicker={`${t.glyph} ${L ? "Rubrica" : "Section"}`} title={t.label[lang]} right={<button className="icon-btn" onClick={() => { setTopic(t.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{L ? "Tutte →" : "All →"}</button>} />
                {list.map(it => <Story key={it.id} it={it} size="sm" mine={isMine(it)} />)}
                <details className="small" style={{ marginTop: ".6rem" }}><summary className="kicker" style={{ cursor: "pointer" }}>{L ? "Perché conta" : "Why it matters"}</summary><div style={{ marginTop: ".6rem" }}><Explainer id={t.id} /></div></details>
              </section>
            );
          })}
          <section className="panel span-12"><AiNote /></section>
        </div>
      )}

      <p className="tiny muted" style={{ marginTop: "2rem" }}>
        {L ? "Fonti: GDELT Project (monitoraggio di testate da tutto il mondo, aggiornato ogni ~20 minuti) e Alpaca News API (Benzinga). Per GDELT l'orario indicato è quando l'articolo è stato rilevato, vicino alla pubblicazione; i titoli sono quelli originali, riformattati. «Fonti principali» nasconde le testate minori o non verificate. Ogni titolo rimanda all'articolo originale." : "Sources: GDELT Project (monitors outlets worldwide, refreshed every ~20 minutes) and Alpaca News API (Benzinga). For GDELT the time shown is when the article was detected, close to publication; titles are the originals, reformatted. “Main sources” hides minor or unverified outlets. Every headline links to the original article."}
      </p>
    </div>
  );
}

function AiNote() {
  const { lang } = usePrefs();
  return <NotConnected phase={4} needs="ANTHROPIC_API_KEY" text={lang === "it"
    ? "Per ogni notizia importante: cosa è successo, perché, contesto storico e politico, Paesi, settori e aziende coinvolti, effetti a breve e lungo termine, impatto sul tuo portafoglio, interpretazioni alternative e cosa seguire, separando fatti, ipotesi e incertezze."
    : "For each major story: what happened, why, historical and political context, affected countries, sectors and companies, short and long-term effects, impact on your portfolio, alternative readings and what to watch, separating facts, hypotheses and uncertainty."} />;
}

export default function IntelligencePage() {
  return <Suspense fallback={<div className="page"><Skeleton lines={8} /></div>}><Intelligence /></Suspense>;
}
