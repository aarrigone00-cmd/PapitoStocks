"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { usePrefs } from "@/components/prefs";
import { PanelHead, Skeleton, ErrorNote, NotConnected } from "@/components/ui";
import { ago, dateTime, isToday } from "@/lib/format";
import type { NewsItem, Position } from "@/lib/types";
import { SYMBOL_RE } from "@/lib/universe";

function Meta({ n }: { n: NewsItem }) {
  const { t, lang } = usePrefs();
  return (
    <div className="story-meta">
      {isToday(n.createdAt) && <span className="tag today">{t.todayNews}</span>}
      <span><b>{n.source}</b>{n.author ? ` · ${n.author}` : ""}</span>
      <span>{t.published} {dateTime(n.createdAt, lang)} ({ago(n.createdAt, lang)})</span>
      {n.updatedAt !== n.createdAt && <span>{t.lastUpdate} {dateTime(n.updatedAt, lang)}</span>}
      {n.symbols.slice(0, 5).map(s => <Link key={s} href={`/research/${s}`} className="tag">{s}</Link>)}
    </div>
  );
}

export default function News() {
  const { t, lang } = usePrefs();
  const [filter, setFilter] = useState("");
  const [mine, setMine] = useState(false);
  const pos = useApi<Position[]>("/api/data/positions");
  const held = (pos.data ?? []).map(p => p.symbol);
  const sym = filter.trim().toUpperCase();
  const symbols = mine ? held.join(",") : SYMBOL_RE.test(sym) ? sym : "";
  const news = useApi<NewsItem[]>(`/api/data/news?limit=50${symbols ? `&symbols=${symbols}` : ""}`, 180_000);

  const [today, earlier] = useMemo(() => {
    const list = news.data ?? [];
    return [list.filter(n => isToday(n.createdAt)), list.filter(n => !isToday(n.createdAt))];
  }, [news.data]);
  const lead = today[0] ?? earlier[0];
  const rest = (today.length ? today.slice(1) : []);

  return (
    <div className="page">
      <header className="masthead">
        <div>
          <div className="kicker">{lang === "it" ? "Notizie in diretta" : "Live news"}</div>
          <h1 className="h1">{lang === "it" ? "Il giornale dei mercati" : "The markets journal"}</h1>
        </div>
        <div style={{ display: "flex", gap: ".8rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="field" style={{ minWidth: 220 }}>
            <label htmlFor="sym">{t.filterSymbol}</label>
            <input id="sym" className="input" value={filter} onChange={e => { setFilter(e.target.value); setMine(false); }} placeholder="AAPL, RACE…" />
          </div>
          <div className="seg">
            <button aria-pressed={!mine} onClick={() => setMine(false)}>{t.allNews}</button>
            <button aria-pressed={mine} onClick={() => { setMine(true); setFilter(""); }} disabled={!held.length}>{t.onlyMine}</button>
          </div>
        </div>
      </header>

      {news.error ? <ErrorNote error={news.error} onRetry={news.reload} /> : !news.data ? <Skeleton lines={10} /> : news.data.length === 0 ? <p className="muted">{t.none}</p> : (
        <div className="grid">
          {lead && (
            <article className="panel span-8 lead-story">
              <PanelHead kicker={isToday(lead.createdAt) ? t.todayNews : t.earlier} title="" meta={news.meta} />
              {lead.image && /^https:\/\//.test(lead.image) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lead.image} alt="" style={{ width: "100%", maxHeight: 360, objectFit: "cover", filter: "saturate(.85)", marginBottom: "1rem" }} />
              )}
              <a href={lead.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}><h2 className="h1">{lead.headline}</h2></a>
              {lead.summary && <p className="lede">{lead.summary}</p>}
              <Meta n={lead} />
              <p><a href={lead.url} target="_blank" rel="noopener noreferrer" className="kicker">{t.readOriginal} ↗</a></p>
            </article>
          )}
          <aside className="panel span-4 vrule">
            <PanelHead kicker={lang === "it" ? "Analisi d'impatto" : "Impact analysis"} title={lang === "it" ? "Perché conta" : "Why it matters"} />
            <NotConnected phase={4} needs="ANTHROPIC_API_KEY"
              text={lang === "it" ? "Per ogni notizia importante: cosa è successo, perché, contesto, settori e aziende toccate, effetti a breve e lungo termine, impatto sul tuo portafoglio, interpretazioni alternative. Separando fatti, ipotesi e incertezze." : "For each major story: what happened, why, context, affected sectors and companies, short and long-term effects, impact on your portfolio, alternative interpretations. Separating facts, hypotheses and uncertainty."} />
            <div style={{ marginTop: "1.2rem" }}>
              <NotConnected phase={3} needs="GDELT (free)"
                text={lang === "it" ? "Oggi le notizie arrivano dall'Alpaca News API (Benzinga, finanza e aziende). Geopolitica, elezioni, energia, clima e commercio mondiale si aggiungono nella Fase 3." : "Today news comes from the Alpaca News API (Benzinga, markets and companies). Geopolitics, elections, energy, climate and world trade are added in Phase 3."} />
            </div>
          </aside>

          {rest.length > 0 && (
            <section className="panel span-12">
              <PanelHead kicker={t.todayNews} title={lang === "it" ? "Le altre notizie di oggi" : "More from today"} />
              <div className="grid" style={{ rowGap: 0 }}>
                {rest.map(n => (
                  <article key={n.id} className="story span-4">
                    <a href={n.url} target="_blank" rel="noopener noreferrer"><h3 className="h3">{n.headline}</h3></a>
                    {n.summary && <p className="small muted" style={{ margin: ".3rem 0 0" }}>{n.summary.slice(0, 220)}{n.summary.length > 220 ? "…" : ""}</p>}
                    <Meta n={n} />
                  </article>
                ))}
              </div>
            </section>
          )}
          {earlier.filter(n => n !== lead).length > 0 && (
            <section className="panel span-12">
              <PanelHead kicker={t.earlier} title={lang === "it" ? "Dai giorni precedenti" : "From previous days"} />
              {earlier.filter(n => n !== lead).map(n => (
                <article key={n.id} className="story">
                  <a href={n.url} target="_blank" rel="noopener noreferrer"><h3 className="h3" style={{ fontSize: "1.1rem" }}>{n.headline}</h3></a>
                  <Meta n={n} />
                </article>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
