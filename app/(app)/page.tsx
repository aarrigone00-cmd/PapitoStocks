"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { usePrefs } from "@/components/prefs";
import { PanelHead, Delta, Chip, Skeleton, ErrorNote, NotConnected, SourceTag } from "@/components/ui";
import { AllocationBar, PriceChart } from "@/components/charts";
import { Countdown, Widget } from "@/components/widgets";
import { NewsList } from "@/components/news";
import { usd, pct, compact, longDate, dir } from "@/lib/format";
import type { Account, Active, Clock, HistoryPoint, Mover, NewsItem, Position, Quote } from "@/lib/types";
import type { IndexDef } from "@/lib/universe";

type IndexRow = IndexDef & { quote: Quote | null };
type HeatRow = { symbol: string; sector: string; quote: Quote | null };

function returnsFrom(h: HistoryPoint[]) {
  if (h.length < 2) return null;
  const last = h[h.length - 1];
  const at = (days: number) => {
    const cutoff = new Date(last.t).getTime() - days * 864e5;
    const p = h.find(x => new Date(x.t).getTime() >= cutoff) ?? h[0];
    return (last.equity / p.equity - 1) * 100;
  };
  const rets = h.slice(1).map((p, i) => p.equity / h[i].equity - 1);
  const mean = rets.reduce((s, r) => s + r, 0) / rets.length;
  const sd = Math.sqrt(rets.reduce((s, r) => s + (r - mean) ** 2, 0) / Math.max(rets.length - 1, 1));
  let peak = h[0].equity, mdd = 0;
  for (const p of h) { peak = Math.max(peak, p.equity); mdd = Math.min(mdd, p.equity / peak - 1); }
  return { w: at(7), m: at(30), q: at(91), y: at(365), vol: sd * Math.sqrt(252) * 100, mdd: mdd * 100, days: h.length };
}

export default function Overview() {
  const { t, lang } = usePrefs();
  const [editing, setEditing] = useState(false);

  const clock = useApi<Clock>("/api/data/clock", 60_000);
  const acct = useApi<Account>("/api/data/account", 60_000);
  const pos = useApi<Position[]>("/api/data/positions", 60_000);
  const hist = useApi<HistoryPoint[]>("/api/data/history?range=1A");
  const divs = useApi<{ total: number }>("/api/data/dividends");
  const idx = useApi<IndexRow[]>("/api/data/indices", 60_000);
  const heat = useApi<HeatRow[]>("/api/data/heatmap", 120_000);
  const actives = useApi<{ items: Active[] }>("/api/data/actives", 300_000);
  const movers = useApi<{ gainers: Mover[]; losers: Mover[] }>("/api/data/movers", 300_000);
  const wl = useApi<string[]>("/api/data/watchlist");
  const wlq = useApi<Quote[]>(wl.data?.length ? `/api/data/quotes?symbols=${wl.data.join(",")}` : null, 60_000);
  const held = (pos.data ?? []).map(p => p.symbol);
  const myNews = useApi<NewsItem[]>(held.length ? `/api/data/news?symbols=${held.join(",")}&limit=8` : null, 300_000);
  const news = useApi<NewsItem[]>("/api/data/news?limit=14", 300_000);

  const r = useMemo(() => (hist.data ? returnsFrom(hist.data) : null), [hist.data]);
  const hour = new Date().getHours();
  const greet = hour < 12 ? t.morning : hour < 18 ? t.afternoon : t.evening;

  const a = acct.data;
  const dayChg = a ? a.equity - a.lastEquity : null;
  const dayPct = a && a.lastEquity ? (dayChg! / a.lastEquity) * 100 : null;
  const unreal = (pos.data ?? []).reduce((s, p) => s + p.unrealizedPl, 0);
  const sortedPos = [...(pos.data ?? [])].sort((x, y) => y.changeTodayPct - x.changeTodayPct);
  const top = [...(pos.data ?? [])].sort((x, y) => y.marketValue - x.marketValue)[0];

  // Sentiment: SPY move + breadth among tracked large caps (method shown in the UI).
  const sentiment = useMemo(() => {
    const qs = (heat.data ?? []).map(h => h.quote?.changePct).filter((x): x is number => x != null);
    const spy = idx.data?.find(i => i.symbol === "SPY")?.quote?.changePct;
    if (!qs.length || spy == null) return null;
    const breadth = qs.filter(x => x > 0).length / qs.length;
    const score = Math.max(-2, Math.min(2, (breadth - 0.5) * 4 + spy));
    return { breadth, score, label: t.moodLabels[Math.round(score) + 2], spy };
  }, [heat.data, idx.data, t]);

  return (
    <div className="page">
      <header className="masthead">
        <div>
          <div className="kicker" suppressHydrationWarning>{longDate(new Date(), lang)}</div>
          <h1 className="h1" style={{ marginTop: ".4rem" }} suppressHydrationWarning>{greet}.</h1>
          <p className="lede" style={{ margin: ".4rem 0 0" }}>{t.tagline}</p>
        </div>
        <div style={{ display: "flex", gap: "1.6rem", alignItems: "flex-end" }}>
          {clock.data && <Countdown clock={clock.data} />}
          <button className="btn ghost" onClick={() => setEditing(e => !e)}>{editing ? t.done : t.customize}</button>
        </div>
      </header>

      <div className="grid">
        {/* Portfolio headline */}
        <Widget id="portfolio" span="span-8" editing={editing}>
          <PanelHead kicker={t.paper} title={t.portfolioValue} meta={acct.meta} />
          {acct.error ? <ErrorNote error={acct.error} onRetry={acct.reload} /> : !a ? <Skeleton lines={2} height="2rem" /> : (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.2rem", flexWrap: "wrap" }}>
                <span className="figure">{usd(a.equity, lang)}</span>
                <Delta value={dayPct} suffix={`(${usd(dayChg, lang)}) ${t.today.toLowerCase()}`} />
              </div>
              <div className="stats" style={{ marginTop: "1.2rem" }}>
                <div className="stat"><div className="label">{t.cash}</div><div className="figure-sm">{usd(a.cash, lang)}</div></div>
                <div className="stat"><div className="label">{t.buyingPower}</div><div className="figure-sm">{usd(a.buyingPower, lang)}</div></div>
                <div className="stat"><div className="label">{t.unrealized}</div><div className={`figure-sm ${dir(unreal)}`}>{usd(unreal, lang)}</div></div>
                <div className="stat"><div className="label">{t.dividends}</div><div className="figure-sm">{usd(divs.data?.total ?? null, lang)}</div></div>
              </div>
              <div className="stats">
                {r ? ([[t.week, r.w], [t.month, r.m], [t.quarter, r.q], [t.year, r.y]] as [string, number][]).map(([l, v]) => (
                  <div className="stat" key={l}><div className="label">{l}</div><Delta value={v} /></div>
                )) : <div className="stat"><Skeleton lines={1} /></div>}
              </div>
              {hist.data && hist.data.length > 1 && (
                <div style={{ marginTop: "1rem" }}>
                  <PriceChart points={hist.data.map(p => ({ t: p.t, v: p.equity }))} height={220} />
                  <div className="tiny muted">{lang === "it" ? "Valore del conto, ultimo anno (o da quando esiste)." : "Account value, last year (or since opening)."}</div>
                </div>
              )}
            </>
          )}
        </Widget>

        <Widget id="sentiment" span="span-4" editing={editing} className="vrule">
          <PanelHead kicker={t.sentiment} title={sentiment?.label ?? "—"} meta={heat.meta} />
          {!sentiment ? <Skeleton lines={3} /> : (
            <>
              <div style={{ position: "relative", height: 10, background: "linear-gradient(90deg, var(--down), var(--surface-2) 50%, var(--up))", margin: ".6rem 0 1.4rem" }}>
                <span style={{ position: "absolute", left: `${((sentiment.score + 2) / 4) * 100}%`, top: -6, width: 2, height: 22, background: "var(--ink)" }} />
              </div>
              <p style={{ margin: 0 }}>
                <b className="num">{Math.round(sentiment.breadth * 100)}%</b> {t.breadth} · S&amp;P 500 <Delta value={sentiment.spy} />
              </p>
              <p className="tiny muted">{t.sentimentMethod}</p>
            </>
          )}
          <div style={{ marginTop: "1.6rem" }}>
            <PanelHead kicker={t.risk} title={lang === "it" ? "Il tuo rischio" : "Your risk"} />
            {r && a ? (
              <div className="rows small">
                <div><span>{t.topHolding}</span><b className="num">{top ? `${top.symbol} ${pct((top.marketValue / a.equity) * 100, lang, false)}` : "—"}</b></div>
                <div><span>{t.holdingsCount}</span><b className="num">{pos.data?.length ?? 0}</b></div>
                <div><span>{t.cashShare}</span><b className="num">{pct((a.cash / a.equity) * 100, lang, false)}</b></div>
                <div><span>{t.volatility}</span><b className="num">{pct(r.vol, lang, false)}</b></div>
                <div><span>{t.maxDrawdown}</span><b className="num down">{pct(r.mdd, lang)}</b></div>
              </div>
            ) : <Skeleton lines={4} />}
            <p className="tiny muted">{t.riskMethod}</p>
          </div>
        </Widget>

        <Widget id="allocation" span="span-6" editing={editing}>
          <PanelHead kicker={t.holdings} title={t.allocation} meta={pos.meta} />
          {!pos.data || !a ? <Skeleton /> : pos.data.length === 0 ? <p className="muted">{t.noHoldings}</p> : (
            <AllocationBar parts={[...pos.data].sort((x, y) => y.marketValue - x.marketValue).map(p => ({ label: p.symbol, value: p.marketValue })).concat([{ label: t.cash, value: Math.max(a.cash, 0) }])} />
          )}
        </Widget>

        <Widget id="movers-holdings" span="span-6" editing={editing} className="vrule">
          <PanelHead kicker={t.holdings} title={t.holdingsMovers} meta={pos.meta} />
          {!pos.data ? <Skeleton /> : pos.data.length === 0 ? <p className="muted">{t.noHoldings}</p> : (
            <div className="grid" style={{ rowGap: 0 }}>
              {([[t.winners, sortedPos.slice(0, 3)], [t.losers, sortedPos.slice(-3).reverse()]] as [string, Position[]][]).map(([label, list]) => (
                <div key={label} className="span-6">
                  <div className="kicker" style={{ marginBottom: ".3rem" }}>{label}</div>
                  <div className="rows">
                    {list.map(p => (
                      <Link key={p.symbol} href={`/research/${p.symbol}`}><span className="name sym">{p.symbol}</span><Chip value={p.changeTodayPct} /></Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Widget>

        <Widget id="indices" span="span-12" editing={editing}>
          <PanelHead kicker={t.indices} title={lang === "it" ? "I mercati del mondo" : "Markets around the world"} meta={idx.meta} />
          {!idx.data ? <Skeleton lines={4} /> : (
            <div className="stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
              {idx.data.map(i => (
                <Link key={i.symbol} href={`/research/${i.symbol}`} className="stat" style={{ textDecoration: "none" }} title={i.proxy ? t.proxyNote : i.note}>
                  <div className="label">{i.index}{i.proxy ? " *" : ""}</div>
                  <div className="num" style={{ fontWeight: 500 }}>{usd(i.quote?.price, lang)}</div>
                  <Delta value={i.quote?.changePct} />
                  <div className="tiny muted">{i.symbol} · {i.region}</div>
                </Link>
              ))}
            </div>
          )}
          <p className="tiny muted">* {t.proxyNote}</p>
        </Widget>

        <Widget id="briefing" span="span-4" editing={editing}>
          <PanelHead kicker="Claude" title={t.briefing} />
          <NotConnected text={t.briefingSoon} phase={4} needs="ANTHROPIC_API_KEY" />
        </Widget>
        <Widget id="earnings" span="span-4" editing={editing} className="vrule">
          <PanelHead kicker={t.earnings} title={t.econEvents} />
          <NotConnected text={t.earningsSoon} phase={3} needs="FINNHUB_API_KEY" />
        </Widget>
        <Widget id="watchlist" span="span-4" editing={editing} className="vrule">
          <PanelHead kicker={t.watchlist} title={lang === "it" ? "I tuoi titoli" : "Your list"} meta={wlq.meta} />
          {!wlq.data ? <Skeleton /> : (
            <div className="rows">
              {wlq.data.map(q => (
                <Link key={q.symbol} href={`/research/${q.symbol}`}>
                  <span><span className="name sym">{q.symbol}</span> <span className="muted small">{q.name}</span></span>
                  <span className="num">{usd(q.price, lang)} <Chip value={q.changePct} /></span>
                </Link>
              ))}
            </div>
          )}
        </Widget>

        <Widget id="actives" span="span-4" editing={editing}>
          <PanelHead kicker={t.trending} title={lang === "it" ? "Volumi del giorno" : "Today's volume leaders"} meta={actives.meta} />
          {!actives.data ? <Skeleton /> : (
            <div className="rows small">
              {actives.data.items.map(x => <Link key={x.symbol} href={`/research/${x.symbol}`}><span className="name sym">{x.symbol}</span><span className="num muted">{compact(x.volume, lang)}</span></Link>)}
            </div>
          )}
        </Widget>
        <Widget id="unusual" span="span-8" editing={editing} className="vrule">
          <PanelHead kicker={t.unusual} title={lang === "it" ? "Le variazioni più forti di oggi" : "Today's largest moves"} meta={movers.meta} />
          {!movers.data ? <Skeleton /> : (
            <div className="grid" style={{ rowGap: 0 }}>
              {([[t.winners, movers.data.gainers], [t.losers, movers.data.losers]] as [string, Mover[]][]).map(([label, list]) => (
                <div key={label} className="span-6">
                  <div className="kicker">{label}</div>
                  <div className="rows small">
                    {list.slice(0, 6).map(m => <Link key={m.symbol} href={`/research/${m.symbol}`}><span className="name sym">{m.symbol}</span><span className="num">{usd(m.price, lang)} <Chip value={m.changePct} /></span></Link>)}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="tiny muted">{lang === "it" ? "Include titoli piccoli e speculativi: grandi variazioni non sono un consiglio." : "Includes small, speculative stocks: big moves are not a recommendation."}</p>
        </Widget>

        <Widget id="holdings-news" span="span-5" editing={editing}>
          <PanelHead kicker={t.holdings} title={t.holdingsNews} meta={myNews.meta} />
          {held.length === 0 ? <p className="muted">{t.noHoldings}</p> : !myNews.data ? <Skeleton lines={5} /> : <NewsList items={myNews.data} compactMode />}
        </Widget>
        <Widget id="news" span="span-7" editing={editing} className="vrule">
          <PanelHead kicker={t.news} title={lang === "it" ? "Ultime dai mercati" : "Latest from the markets"} meta={news.meta}
            right={<Link href="/news" className="kicker" style={{ textDecoration: "none" }}>{lang === "it" ? "Tutte →" : "All →"}</Link>} />
          {news.error ? <ErrorNote error={news.error} onRetry={news.reload} /> : !news.data ? <Skeleton lines={6} /> : <NewsList items={news.data.slice(0, 7)} />}
        </Widget>
      </div>
      {editing && <p className="tiny muted" style={{ marginTop: "2rem" }}><SourceTag meta={null} />{lang === "it" ? "Le preferenze sono salvate su questo dispositivo." : "Preferences are saved on this device."}</p>}
    </div>
  );
}
