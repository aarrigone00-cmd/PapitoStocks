import "server-only";
// Clearly-labelled DEMONSTRATION data, used only when Alpaca keys are missing.
// Nothing here is presented as real; every response is tagged freshness: "demo".
import type { Account, Active, Bar, Clock, HistoryPoint, Mover, NewsItem, Order, Position, Quote } from "@/lib/types";
import { HEATMAP, INDICES, DEFAULT_WATCHLIST } from "@/lib/universe";

function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 2 ** 32;
}
const NAMES: Record<string, string> = Object.fromEntries([
  ...HEATMAP.map(h => [h.symbol, h.name]),
  ...INDICES.map(i => [i.symbol, `${i.index} (${i.symbol})`]),
]);
const basePrice = (s: string) => 20 + rng(s)() * 480;

export function demoQuotes(symbols: string[]): Quote[] {
  return symbols.map(s => {
    const r = rng(s + new Date().toISOString().slice(0, 10));
    const price = basePrice(s), pct = (r() - 0.48) * 4, prev = price / (1 + pct / 100), vol = Math.round(1e6 + r() * 4e7);
    return { symbol: s, name: NAMES[s] ?? s, price, prevClose: prev, change: price - prev, changePct: pct, volume: vol, dollarVolume: vol * price, time: new Date().toISOString() };
  });
}

export function demoBars(symbol: string, range: string): Bar[] {
  const n = ({ "1D": 78, "5D": 65, "1M": 22, "6M": 126, "1Y": 252, "5Y": 260, MAX: 520 } as Record<string, number>)[range] ?? 252;
  const stepMs = ({ "1D": 3e5, "5D": 18e5, "5Y": 6048e5, MAX: 6048e5 } as Record<string, number>)[range] ?? 864e5;
  const r = rng(symbol + range);
  let v = basePrice(symbol);
  const out: Bar[] = [];
  for (let i = 0; i < n; i++) {
    const o = v; v = v / (1 + (r() - 0.485) * 0.03);
    out.push({ t: new Date(Date.now() - i * stepMs).toISOString(), o: v, h: Math.max(o, v) * 1.01, l: Math.min(o, v) * 0.99, c: o, v: Math.round(1e6 * (1 + r())) });
  }
  return out.reverse();
}

const DEMO_POS = [{ symbol: "RACE", qty: 4, avg: 410 }, { symbol: "AAPL", qty: 12, avg: 190 }, { symbol: "NVDA", qty: 15, avg: 120 }, { symbol: "KO", qty: 30, avg: 58 }, { symbol: "E", qty: 60, avg: 31 }];

export function demoPositions(): Position[] {
  return DEMO_POS.map(p => {
    const q = demoQuotes([p.symbol])[0];
    const price = q.price!, mv = price * p.qty, cost = p.avg * p.qty;
    return { symbol: p.symbol, qty: p.qty, avgEntry: p.avg, price, marketValue: mv, costBasis: cost, unrealizedPl: mv - cost, unrealizedPlPct: (mv / cost - 1) * 100, changeTodayPct: q.changePct! };
  });
}

export function demoAccount(): Account {
  const pos = demoPositions(), lmv = pos.reduce((s, p) => s + p.marketValue, 0), cash = 25000;
  const prev = pos.reduce((s, p) => s + p.marketValue / (1 + p.changeTodayPct / 100), 0);
  return { equity: cash + lmv, lastEquity: cash + prev, cash, buyingPower: cash * 2, longMarketValue: lmv, status: "ACTIVE", currency: "USD", paper: true };
}

export function demoHistory(range: string): HistoryPoint[] {
  const n = ({ "1W": 35, "1M": 22, "3M": 63, "1A": 252 } as Record<string, number>)[range] ?? 22;
  const r = rng("hist" + range);
  let v = demoAccount().equity;
  const out: HistoryPoint[] = [];
  for (let i = 0; i < n; i++) { out.push({ t: new Date(Date.now() - i * 864e5).toISOString(), equity: v, pl: 0 }); v = v / (1 + (r() - 0.48) * 0.012); }
  return out.reverse();
}

export function demoClock(): Clock {
  const now = new Date(), d = now.getUTCDay(), h = now.getUTCHours() + now.getUTCMinutes() / 60;
  const isOpen = d > 0 && d < 6 && h >= 14.5 && h < 21;
  const next = new Date(now); next.setUTCHours(isOpen ? 21 : 14, isOpen ? 0 : 30, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return { isOpen, nextOpen: next.toISOString(), nextClose: next.toISOString(), timestamp: now.toISOString() };
}

export function demoNews(): NewsItem[] {
  return [
    "Sample headline — connect Alpaca to see real news",
    "Sample headline — this is demonstration content",
    "Sample headline — no real event is described here",
  ].map((h, i) => ({
    id: "demo" + i, headline: h, summary: "Demonstration placeholder. Real headlines, sources and timestamps come from the Alpaca News API once keys are configured.",
    source: "DEMO", author: "", url: "https://docs.alpaca.markets/docs/news-api", createdAt: new Date(Date.now() - i * 36e5).toISOString(),
    updatedAt: new Date(Date.now() - i * 36e5).toISOString(), symbols: [DEFAULT_WATCHLIST[i]], image: null,
  }));
}

export function demoMovers(): { gainers: Mover[]; losers: Mover[]; asOf: string } {
  const q = demoQuotes(HEATMAP.map(h => h.symbol)).sort((a, b) => b.changePct! - a.changePct!);
  const m = (x: Quote) => ({ symbol: x.symbol, price: x.price!, changePct: x.changePct! });
  return { gainers: q.slice(0, 6).map(m), losers: q.slice(-6).reverse().map(m), asOf: new Date().toISOString() };
}

export function demoActive(): { items: Active[]; asOf: string } {
  const q = demoQuotes(HEATMAP.map(h => h.symbol)).sort((a, b) => b.volume! - a.volume!);
  return { items: q.slice(0, 10).map(x => ({ symbol: x.symbol, volume: x.volume!, tradeCount: Math.round(x.volume! / 90) })), asOf: new Date().toISOString() };
}

export const demoOrders: Order[] = [];
