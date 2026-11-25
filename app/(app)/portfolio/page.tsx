"use client";
import Link from "next/link";
import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { usePrefs } from "@/components/prefs";
import { PanelHead, Delta, Skeleton, ErrorNote } from "@/components/ui";
import { AllocationBar, PriceChart } from "@/components/charts";
import { usd, num, pct, dir, dateTime } from "@/lib/format";
import type { Account, HistoryPoint, Order, Position } from "@/lib/types";

const RANGES = ["1W", "1M", "3M", "1A"] as const;

export default function Portfolio() {
  const { t, lang } = usePrefs();
  const [range, setRange] = useState<(typeof RANGES)[number]>("3M");
  const acct = useApi<Account>("/api/data/account", 60_000);
  const pos = useApi<Position[]>("/api/data/positions", 60_000);
  const hist = useApi<HistoryPoint[]>(`/api/data/history?range=${range}`);
  const orders = useApi<Order[]>("/api/data/orders?status=all");
  const divs = useApi<{ total: number; items: { date: string; symbol: string; amount: number }[] }>("/api/data/dividends");

  const a = acct.data;
  const ps = [...(pos.data ?? [])].sort((x, y) => y.marketValue - x.marketValue);
  const invested = ps.reduce((s, p) => s + p.costBasis, 0);
  const unreal = ps.reduce((s, p) => s + p.unrealizedPl, 0);
  const h = hist.data ?? [];
  const periodChg = h.length > 1 ? (h[h.length - 1].equity / h[0].equity - 1) * 100 : null;
  const rangeLabel: Record<string, string> = { "1W": t.week, "1M": t.month, "3M": t.quarter, "1A": t.year };

  return (
    <div className="page">
      <header className="masthead">
        <div>
          <div className="kicker">{t.paper}</div>
          <h1 className="h1">{lang === "it" ? "Il mio portafoglio" : "My portfolio"}</h1>
        </div>
      </header>
      {acct.error && <ErrorNote error={acct.error} onRetry={acct.reload} />}

      <div className="grid">
        <section className="panel span-8">
          <PanelHead kicker={t.history} title={a ? usd(a.equity, lang) : "…"} meta={hist.meta}
            right={<div className="seg">{RANGES.map(r => <button key={r} aria-pressed={r === range} onClick={() => setRange(r)}>{rangeLabel[r]}</button>)}</div>} />
          {periodChg != null && <p style={{ marginTop: 0 }}>{rangeLabel[range]}: <Delta value={periodChg} /></p>}
          {hist.error ? <ErrorNote error={hist.error} /> : !hist.data ? <Skeleton lines={6} /> :
            h.length < 2 ? <p className="muted">{lang === "it" ? "Storico non ancora disponibile." : "No history yet."}</p> :
            <PriceChart points={h.map(p => ({ t: p.t, v: p.equity }))} height={300} />}
        </section>
        <section className="panel span-4 vrule">
          <PanelHead kicker={t.paper} title={lang === "it" ? "Riepilogo" : "Summary"} meta={acct.meta} />
          {!a ? <Skeleton lines={6} /> : (
            <div className="rows">
              <div><span>{t.portfolioValue}</span><b className="num">{usd(a.equity, lang)}</b></div>
              <div><span>{t.invested}</span><b className="num">{usd(invested, lang)}</b></div>
              <div><span>{t.unrealized}</span><b className={`num ${dir(unreal)}`}>{usd(unreal, lang)}</b></div>
              <div><span>{t.dividends}</span><b className="num">{usd(divs.data?.total ?? null, lang)}</b></div>
              <div><span>{t.cash}</span><b className="num">{usd(a.cash, lang)}</b></div>
              <div><span>{t.buyingPower}</span><b className="num">{usd(a.buyingPower, lang)}</b></div>
            </div>
          )}
          <p className="tiny muted">{lang === "it" ? "Le plusvalenze realizzate (vendite chiuse) e l'esposizione per settore/Paese arrivano nella Fase 5." : "Realized gains (closed sales) and sector/country exposure arrive in Phase 5."}</p>
        </section>

        <section className="panel span-12">
          <PanelHead kicker={t.holdings} title={t.allocation} meta={pos.meta} />
          {ps.length > 0 && a && <AllocationBar parts={ps.map(p => ({ label: p.symbol, value: p.marketValue })).concat([{ label: t.cash, value: Math.max(a.cash, 0) }])} />}
          <div className="table-wrap" style={{ marginTop: "1.2rem" }}>
            {!pos.data ? <Skeleton lines={5} /> : ps.length === 0 ? <p className="muted">{t.noHoldings}</p> : (
              <table className="table">
                <thead><tr>
                  <th>{t.symbol}</th><th className="r">{t.qty}</th><th className="r">{t.avgPrice}</th><th className="r">{t.price}</th>
                  <th className="r">{t.value}</th><th className="r">{t.weight}</th><th className="r">{t.pl}</th><th className="r">{t.plPct}</th><th className="r">{t.todayPct}</th><th />
                </tr></thead>
                <tbody>
                  {ps.map(p => (
                    <tr key={p.symbol}>
                      <td><Link href={`/research/${p.symbol}`} className="sym">{p.symbol}</Link></td>
                      <td className="r num">{num(p.qty, lang, 4)}</td>
                      <td className="r num">{usd(p.avgEntry, lang)}</td>
                      <td className="r num">{usd(p.price, lang)}</td>
                      <td className="r num">{usd(p.marketValue, lang)}</td>
                      <td className="r num">{a ? pct((p.marketValue / a.equity) * 100, lang, false) : "—"}</td>
                      <td className={`r num ${dir(p.unrealizedPl)}`}>{usd(p.unrealizedPl, lang)}</td>
                      <td className="r"><Delta value={p.unrealizedPlPct} /></td>
                      <td className="r"><Delta value={p.changeTodayPct} /></td>
                      <td className="r"><Link href={`/trade?symbol=${p.symbol}`} className="kicker" style={{ textDecoration: "none" }}>{t.trade} →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="panel span-8">
          <PanelHead kicker={t.transactions} title={t.recentOrders} meta={orders.meta} />
          <div className="table-wrap">
            {!orders.data ? <Skeleton lines={5} /> : orders.data.length === 0 ? <p className="muted">{t.none}</p> : (
              <table className="table">
                <thead><tr><th>{t.submitted}</th><th>{t.symbol}</th><th>{t.side}</th><th>{t.orderType}</th><th className="r">{t.qty}</th><th className="r">{t.price}</th><th>{t.status}</th></tr></thead>
                <tbody>
                  {orders.data.slice(0, 25).map(o => (
                    <tr key={o.id}>
                      <td className="num small">{dateTime(o.submittedAt, lang)}</td>
                      <td className="sym">{o.symbol}</td>
                      <td className={o.side === "buy" ? "up" : "down"}>{o.side === "buy" ? t.buy : t.sell}</td>
                      <td className="small">{o.type}</td>
                      <td className="r num">{o.filledQty ? num(o.filledQty, lang, 4) : o.qty != null ? num(o.qty, lang, 4) : usd(o.notional, lang)}</td>
                      <td className="r num">{usd(o.filledAvgPrice ?? o.limitPrice, lang)}</td>
                      <td className="small">{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
        <section className="panel span-4 vrule">
          <PanelHead kicker={t.dividends} title={usd(divs.data?.total ?? null, lang)} meta={divs.meta} />
          {!divs.data ? <Skeleton /> : divs.data.items.length === 0 ? <p className="muted small">{lang === "it" ? "Nessun dividendo ancora registrato." : "No dividends recorded yet."}</p> : (
            <div className="rows small">{divs.data.items.slice(0, 12).map((d, i) => <div key={i}><span>{d.symbol} <span className="muted">{d.date.slice(0, 10)}</span></span><b className="num">{usd(d.amount, lang)}</b></div>)}</div>
          )}
        </section>
      </div>
    </div>
  );
}
