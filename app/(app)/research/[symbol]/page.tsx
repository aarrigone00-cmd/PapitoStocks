"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useApi, send } from "@/hooks/useApi";
import { usePrefs } from "@/components/prefs";
import { PanelHead, Delta, Skeleton, ErrorNote, NotConnected } from "@/components/ui";
import { PriceChart } from "@/components/charts";
import { NewsList } from "@/components/news";
import { usd, compact, num, pct } from "@/lib/format";
import type { Bar, NewsItem, Position, Quote } from "@/lib/types";

const RANGES = ["1D", "5D", "1M", "6M", "1Y", "5Y", "MAX"] as const;

function indicators(b: Bar[]) {
  if (b.length < 15) return null;
  const c = b.map(x => x.c);
  const sma = (n: number) => (c.length >= n ? c.slice(-n).reduce((s, v) => s + v, 0) / n : null);
  let gain = 0, loss = 0;
  for (let i = c.length - 14; i < c.length; i++) { const d = c[i] - c[i - 1]; if (d > 0) gain += d; else loss -= d; }
  const rsi = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  const rets = c.slice(1).map((v, i) => Math.log(v / c[i]));
  const m = rets.reduce((s, r) => s + r, 0) / rets.length;
  const vol = Math.sqrt(rets.reduce((s, r) => s + (r - m) ** 2, 0) / (rets.length - 1)) * Math.sqrt(252) * 100;
  return { hi: Math.max(...b.map(x => x.h)), lo: Math.min(...b.map(x => x.l)), sma50: sma(50), sma200: sma(200), rsi, vol, avgVol: b.reduce((s, x) => s + x.v, 0) / b.length };
}

export default function StockPage() {
  const { t, lang } = usePrefs();
  const { symbol: raw } = useParams<{ symbol: string }>();
  const symbol = decodeURIComponent(raw).toUpperCase();
  const [range, setRange] = useState<(typeof RANGES)[number]>("1Y");
  const [mode, setMode] = useState<"area" | "candles">("area");
  const [wlBusy, setWlBusy] = useState(false);

  const quote = useApi<Quote[]>(`/api/data/quotes?symbols=${symbol}`, 30_000);
  const bars = useApi<Bar[]>(`/api/data/bars?symbol=${symbol}&range=${range}`);
  const year = useApi<Bar[]>(`/api/data/bars?symbol=${symbol}&range=1Y`);
  const news = useApi<NewsItem[]>(`/api/data/news?symbols=${symbol}&limit=12`, 300_000);
  const pos = useApi<Position[]>("/api/data/positions");
  const wl = useApi<string[]>("/api/data/watchlist");

  const q = quote.data?.[0];
  const ind = useMemo(() => (year.data ? indicators(year.data) : null), [year.data]);
  const mine = pos.data?.find(p => p.symbol === symbol);
  const watching = wl.data?.includes(symbol);
  const rangeChg = bars.data && bars.data.length > 1 ? (bars.data[bars.data.length - 1].c / bars.data[0].c - 1) * 100 : null;

  const toggleWatch = async () => {
    setWlBusy(true);
    try { await send("/api/watchlist", watching ? "DELETE" : "POST", { symbol }); await wl.reload(); }
    catch (e) { alert(e instanceof Error ? e.message : String(e)); }
    finally { setWlBusy(false); }
  };

  return (
    <div className="page">
      <header className="masthead">
        <div>
          <div className="kicker">{symbol}</div>
          <h1 className="h1">{q?.name ?? symbol}</h1>
          <div style={{ display: "flex", gap: "1rem", alignItems: "baseline", marginTop: ".6rem", flexWrap: "wrap" }}>
            <span className="figure">{usd(q?.price, lang)}</span>
            <Delta value={q?.changePct} suffix={t.today.toLowerCase()} />
          </div>
        </div>
        <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
          <Link className="btn buy" href={`/trade?symbol=${symbol}&side=buy`}>{t.buy}</Link>
          {mine && <Link className="btn sell" href={`/trade?symbol=${symbol}&side=sell`}>{t.sell}</Link>}
          <button className="btn ghost" onClick={toggleWatch} disabled={wlBusy || !wl.data}>{watching ? `★ ${t.removeWatch}` : `☆ ${t.addWatch}`}</button>
        </div>
      </header>
      {quote.error && <ErrorNote error={quote.error} onRetry={quote.reload} />}

      <div className="grid">
        <section className="panel span-8">
          <PanelHead kicker={lang === "it" ? "Grafico" : "Chart"} title={rangeChg != null ? `${range} · ${pct(rangeChg, lang)}` : range} meta={bars.meta}
            right={<>
              <div className="seg">{RANGES.map(r => <button key={r} aria-pressed={r === range} onClick={() => setRange(r)}>{r}</button>)}</div>
              <div className="seg"><button aria-pressed={mode === "area"} onClick={() => setMode("area")}>〰</button><button aria-pressed={mode === "candles"} onClick={() => setMode("candles")}>▮▯</button></div>
            </>} />
          {bars.error ? <ErrorNote error={bars.error} onRetry={bars.reload} /> : !bars.data ? <div className="skel" style={{ height: 380 }} /> :
            bars.data.length < 2 ? <p className="muted">{lang === "it" ? "Nessun dato per questo periodo." : "No data for this period."}</p> :
            <PriceChart candles={bars.data} mode={mode} height={380} />}
          {mine && (
            <div className="notice ok" style={{ marginTop: "1rem" }}>
              {lang === "it" ? "Possiedi" : "You own"} <b className="num">{num(mine.qty, lang, 4)}</b> {t.shares.toLowerCase()} · {t.value} <b className="num">{usd(mine.marketValue, lang)}</b> · {t.pl} <Delta value={mine.unrealizedPlPct} />
            </div>
          )}
        </section>
        <aside className="panel span-4 vrule">
          <PanelHead kicker={t.stats} title={lang === "it" ? "Dai prezzi dell'ultimo anno" : "From last year's prices"} meta={year.meta} />
          {!ind ? <Skeleton lines={7} /> : (
            <div className="rows small">
              <div><span>{t.high52}</span><b className="num">{usd(ind.hi, lang)}</b></div>
              <div><span>{t.low52}</span><b className="num">{usd(ind.lo, lang)}</b></div>
              <div><span>{t.sma50}</span><b className="num">{usd(ind.sma50, lang)}</b></div>
              <div><span>{t.sma200}</span><b className="num">{usd(ind.sma200, lang)}</b></div>
              <div><span>{t.rsi}</span><b className="num">{num(ind.rsi, lang, 1)}</b></div>
              <div><span>{t.volatility}</span><b className="num">{pct(ind.vol, lang, false)}</b></div>
              <div><span>{t.avgVolume} (IEX)</span><b className="num">{compact(ind.avgVol, lang)}</b></div>
            </div>
          )}
          <p className="tiny muted">{lang === "it" ? "Calcolati qui dai prezzi giornalieri IEX. RSI sopra 70 = forte rialzo recente, sotto 30 = forte ribasso: non sono segnali di acquisto o vendita." : "Computed here from IEX daily prices. RSI above 70 = strong recent rise, below 30 = strong fall: not buy or sell signals."}</p>
          <div style={{ marginTop: "1.4rem" }}>
            <PanelHead kicker={t.fundamentals} title={lang === "it" ? "Bilanci e valutazione" : "Financials & valuation"} />
            <NotConnected text={t.fundamentalsSoon} phase={2} needs="FMP_API_KEY" />
          </div>
        </aside>
        <section className="panel span-12">
          <PanelHead kicker={t.news} title={lang === "it" ? `Notizie su ${q?.name ?? symbol}` : `News on ${q?.name ?? symbol}`} meta={news.meta} />
          {news.error ? <ErrorNote error={news.error} /> : !news.data ? <Skeleton lines={5} /> : news.data.length === 0 ? <p className="muted">{t.none}</p> : <NewsList items={news.data} />}
        </section>
      </div>
    </div>
  );
}
