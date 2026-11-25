"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApi, send } from "@/hooks/useApi";
import { usePrefs } from "@/components/prefs";
import { PanelHead, Delta, Skeleton, ErrorNote } from "@/components/ui";
import { usd, num, dateTime } from "@/lib/format";
import type { Account, Order, Position, Quote } from "@/lib/types";
import { SYMBOL_RE } from "@/lib/universe";

type OType = "market" | "limit" | "stop" | "stop_limit";

function Ticket() {
  const { t, lang } = usePrefs();
  const params = useSearchParams();
  const [symbol, setSymbol] = useState((params.get("symbol") ?? "").toUpperCase());
  const [side, setSide] = useState<"buy" | "sell">(params.get("side") === "sell" ? "sell" : "buy");
  const [type, setType] = useState<OType>("market");
  const [by, setBy] = useState<"qty" | "notional">("qty");
  const [amount, setAmount] = useState("");
  const [limit, setLimit] = useState("");
  const [stop, setStop] = useState("");
  const [tif, setTif] = useState<"day" | "gtc">("day");
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [orderId, setOrderId] = useState(() => crypto.randomUUID());

  const valid = SYMBOL_RE.test(symbol);
  const status = useApi<{ alpaca: boolean; tradingDisabled: boolean; maxOrderNotional: number }>("/api/data/status");
  const quote = useApi<Quote[]>(valid ? `/api/data/quotes?symbols=${symbol}` : null, 15_000);
  const acct = useApi<Account>("/api/data/account", 30_000);
  const pos = useApi<Position[]>("/api/data/positions", 30_000);
  const open = useApi<Order[]>("/api/data/orders?status=open", 15_000);
  const recent = useApi<Order[]>("/api/data/orders?status=all", 30_000);

  const q = quote.data?.[0];
  const owned = pos.data?.find(p => p.symbol === symbol);
  const amt = Number(amount.replace(",", "."));
  const lp = Number(limit.replace(",", ".")), sp = Number(stop.replace(",", "."));
  const refPrice = type === "limit" || type === "stop_limit" ? lp : type === "stop" ? sp : q?.price ?? 0;
  const est = by === "notional" ? amt : amt * (refPrice || 0);
  const bp = acct.data?.buyingPower ?? 0;
  const max = status.data?.maxOrderNotional ?? 10000;

  const problems = useMemo(() => {
    const p: string[] = [];
    if (!valid) p.push(lang === "it" ? "Inserisci un simbolo valido." : "Enter a valid symbol.");
    if (!(amt > 0)) p.push(lang === "it" ? "Inserisci una quantità." : "Enter a quantity.");
    if ((type === "limit" || type === "stop_limit") && !(lp > 0)) p.push(lang === "it" ? "Serve un prezzo limite." : "A limit price is required.");
    if ((type === "stop" || type === "stop_limit") && !(sp > 0)) p.push(lang === "it" ? "Serve un prezzo stop." : "A stop price is required.");
    if (side === "buy" && est > bp) p.push(lang === "it" ? "Potere d'acquisto insufficiente." : "Not enough buying power.");
    if (side === "sell" && !owned) p.push(lang === "it" ? "Non possiedi questo titolo (le vendite allo scoperto non sono abilitate qui)." : "You don't own this stock (short selling is not enabled here).");
    if (side === "sell" && owned && by === "qty" && amt > owned.qty) p.push(lang === "it" ? "Quantità superiore a quella posseduta." : "More than you own.");
    if (est > max) p.push((lang === "it" ? "Supera il limite per ordine di " : "Exceeds the per-order limit of ") + usd(max, lang));
    if (status.data?.tradingDisabled) p.push(t.tradingOff);
    if (status.data && !status.data.alpaca) p.push(lang === "it" ? "Modalità demo: collega Alpaca per inviare ordini." : "Demo mode: connect Alpaca to send orders.");
    return p;
  }, [valid, amt, type, lp, sp, side, est, bp, owned, by, max, status.data, lang, t]);

  const submit = async () => {
    setBusy(true); setResult(null);
    try {
      await send("/api/trade", "POST", {
        symbol, side, type, timeInForce: tif, clientOrderId: orderId,
        ...(by === "notional" ? { notional: amt } : { qty: amt }),
        ...(type === "limit" || type === "stop_limit" ? { limitPrice: lp } : {}),
        ...(type === "stop" || type === "stop_limit" ? { stopPrice: sp } : {}),
      });
      setResult({ ok: true, msg: t.orderSent });
      setAmount(""); setReview(false); setOrderId(crypto.randomUUID());
      open.reload(); recent.reload(); acct.reload(); pos.reload();
    } catch (e) {
      setResult({ ok: false, msg: e instanceof Error ? e.message : String(e) });
      setReview(false); setOrderId(crypto.randomUUID());
    } finally { setBusy(false); }
  };

  const cancelOrder = async (id: string) => {
    if (!confirm(lang === "it" ? "Revocare questo ordine?" : "Cancel this order?")) return;
    try { await send(`/api/trade?id=${id}`, "DELETE"); open.reload(); recent.reload(); }
    catch (e) { alert(e instanceof Error ? e.message : String(e)); }
  };

  const typeLabel: Record<OType, string> = { market: t.market, limit: t.limit, stop: t.stop, stop_limit: t.stopLimit };

  return (
    <div className="page">
      <header className="masthead">
        <div>
          <div className="kicker">{t.paper}</div>
          <h1 className="h1">{lang === "it" ? "Centro operativo" : "Trading center"}</h1>
        </div>
      </header>
      <div className="notice" style={{ marginBottom: "1.6rem" }}>🔒 {t.paperOnly}</div>
      {result && <div className={`notice ${result.ok ? "ok" : "warn"}`} style={{ marginBottom: "1.6rem" }}>{result.msg}</div>}

      <div className="grid">
        <section className="panel span-5">
          <PanelHead kicker={t.orderTicket} title={valid ? (q?.name ?? symbol) : "—"} meta={quote.meta} />
          <div style={{ display: "grid", gap: "1rem" }}>
            <div className="field"><label htmlFor="s">{t.symbol}</label>
              <input id="s" className="input" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase().trim())} placeholder="AAPL" /></div>
            {q && <div className="small">{usd(q.price, lang)} <Delta value={q.changePct} /></div>}
            <div className="field"><label>{t.side}</label>
              <div className="seg"><button aria-pressed={side === "buy"} onClick={() => setSide("buy")}>{t.buy}</button><button aria-pressed={side === "sell"} onClick={() => setSide("sell")}>{t.sell}</button></div></div>
            <div className="field"><label>{t.orderType}</label>
              <div className="seg" style={{ flexWrap: "wrap" }}>{(Object.keys(typeLabel) as OType[]).map(k => <button key={k} aria-pressed={type === k} onClick={() => { setType(k); if (k !== "market") setBy("qty"); }}>{typeLabel[k]}</button>)}</div></div>
            {type === "market" && (
              <div className="seg"><button aria-pressed={by === "qty"} onClick={() => setBy("qty")}>{t.shares}</button><button aria-pressed={by === "notional"} onClick={() => setBy("notional")}>{t.dollars}</button></div>
            )}
            <div className="field"><label htmlFor="a">{by === "qty" ? t.qty : t.dollars}</label>
              <input id="a" className="input" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder={by === "qty" ? "10" : "500"} /></div>
            {(type === "limit" || type === "stop_limit") && <div className="field"><label htmlFor="l">{t.limitPrice}</label><input id="l" className="input" inputMode="decimal" value={limit} onChange={e => setLimit(e.target.value)} /></div>}
            {(type === "stop" || type === "stop_limit") && <div className="field"><label htmlFor="st">{t.stopPrice}</label><input id="st" className="input" inputMode="decimal" value={stop} onChange={e => setStop(e.target.value)} /></div>}
            <div className="field"><label>{t.tif}</label>
              <div className="seg"><button aria-pressed={tif === "day"} onClick={() => setTif("day")}>{t.dayTif}</button><button aria-pressed={tif === "gtc"} onClick={() => setTif("gtc")} disabled={by === "notional"}>{t.gtc}</button></div></div>
          </div>
        </section>

        <aside className="panel span-3 vrule">
          <PanelHead kicker={t.preview} title={usd(est || null, lang)} />
          <div className="rows small">
            <div><span>{t.estValue}</span><b className="num">{usd(est || null, lang)}</b></div>
            <div><span>{t.estFees}</span><b className="num">{usd(0, lang)}</b></div>
            <div><span>{t.buyingPower}</span><b className="num">{usd(bp, lang)}</b></div>
            {side === "buy" && <div><span>{t.afterTrade}</span><b className="num">{usd(bp - (est || 0), lang)}</b></div>}
            {owned && <div><span>{lang === "it" ? "Posseduti" : "Owned"}</span><b className="num">{num(owned.qty, lang, 4)}</b></div>}
          </div>
          <p className="tiny muted">{lang === "it" ? "Alpaca non applica commissioni sulle azioni USA; possono esistere piccole tasse regolamentari sulle vendite. Il prezzo finale di un ordine al mercato può differire." : "Alpaca charges no commission on US stocks; small regulatory fees may apply to sales. A market order's final price may differ."}</p>
          {problems.length > 0 && amt > 0 && <ul className="small down" style={{ paddingLeft: "1rem" }}>{problems.map(p => <li key={p}>{p}</li>)}</ul>}
          <button className={`btn ${side === "buy" ? "buy" : "sell"}`} style={{ width: "100%", marginTop: ".6rem" }} disabled={problems.length > 0} onClick={() => setReview(true)}>{t.review}</button>
        </aside>

        <section className="panel span-4 vrule">
          <PanelHead kicker={t.openOrders} title={String(open.data?.length ?? "…")} meta={open.meta} />
          {open.error ? <ErrorNote error={open.error} /> : !open.data ? <Skeleton /> : open.data.length === 0 ? <p className="muted small">{t.none}</p> : (
            <div className="rows small">
              {open.data.map(o => (
                <div key={o.id}>
                  <span><b className={o.side === "buy" ? "up" : "down"}>{o.side === "buy" ? t.buy : t.sell}</b> {o.symbol} · {o.qty != null ? num(o.qty, lang, 4) : usd(o.notional, lang)} · {o.type}{o.limitPrice ? ` @ ${usd(o.limitPrice, lang)}` : ""}</span>
                  <button className="icon-btn" onClick={() => cancelOrder(o.id)}>{t.cancelOrder}</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel span-12">
          <PanelHead kicker={t.transactions} title={t.recentOrders} meta={recent.meta} />
          <div className="table-wrap">
            {!recent.data ? <Skeleton lines={4} /> : recent.data.length === 0 ? <p className="muted">{t.none}</p> : (
              <table className="table">
                <thead><tr><th>{t.submitted}</th><th>{t.symbol}</th><th>{t.side}</th><th>{t.orderType}</th><th className="r">{t.qty}</th><th className="r">{t.price}</th><th>{t.status}</th></tr></thead>
                <tbody>{recent.data.slice(0, 20).map(o => (
                  <tr key={o.id}>
                    <td className="small num">{dateTime(o.submittedAt, lang)}</td><td className="sym">{o.symbol}</td>
                    <td className={o.side === "buy" ? "up" : "down"}>{o.side === "buy" ? t.buy : t.sell}</td><td className="small">{o.type}</td>
                    <td className="r num">{o.filledQty ? num(o.filledQty, lang, 4) : o.qty != null ? num(o.qty, lang, 4) : usd(o.notional, lang)}</td>
                    <td className="r num">{usd(o.filledAvgPrice ?? o.limitPrice, lang)}</td><td className="small">{o.status}</td>
                  </tr>))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {review && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="rv">
          <div className="dialog">
            <div className="kicker">{t.paper}</div>
            <h2 id="rv" className="h2" style={{ margin: ".4rem 0 1rem" }}>{t.review}</h2>
            <p className="lede" style={{ fontStyle: "normal" }}>
              <b className={side === "buy" ? "up" : "down"}>{side === "buy" ? t.buy : t.sell}</b>{" "}
              {by === "qty" ? `${num(amt, lang, 4)} ${t.shares.toLowerCase()}` : usd(amt, lang)} {lang === "it" ? "di" : "of"} <b>{q?.name ?? symbol}</b> ({symbol})
            </p>
            <div className="rows small">
              <div><span>{t.orderType}</span><b>{typeLabel[type]}{type !== "market" ? ` · ${t.tif.toLowerCase()} ${tif === "day" ? t.dayTif : t.gtc}` : ""}</b></div>
              {(type === "limit" || type === "stop_limit") && <div><span>{t.limitPrice}</span><b className="num">{usd(lp, lang)}</b></div>}
              {(type === "stop" || type === "stop_limit") && <div><span>{t.stopPrice}</span><b className="num">{usd(sp, lang)}</b></div>}
              <div><span>{t.estValue}</span><b className="num">{usd(est, lang)}</b></div>
            </div>
            <div style={{ display: "flex", gap: ".6rem", marginTop: "1.4rem" }}>
              <button className={`btn ${side === "buy" ? "buy" : "sell"}`} style={{ flex: 1 }} disabled={busy} onClick={submit}>{busy ? t.sending : t.confirm}</button>
              <button className="btn ghost" disabled={busy} onClick={() => setReview(false)}>{t.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TradePage() {
  return <Suspense fallback={<div className="page"><Skeleton lines={8} /></div>}><Ticket /></Suspense>;
}
