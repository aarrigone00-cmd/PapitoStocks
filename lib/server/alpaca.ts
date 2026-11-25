import "server-only";
import type { Account, Active, Bar, Clock, HistoryPoint, Mover, NewsItem, Order, Position, Quote } from "@/lib/types";

// PAPER ONLY. Live trading is deliberately not wired up (Phase 7).
const TRADE = "https://paper-api.alpaca.markets";
const DATA = "https://data.alpaca.markets";

export const alpacaConfigured = () => Boolean(process.env.ALPACA_KEY_ID && process.env.ALPACA_SECRET_KEY);

export class UpstreamError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function call<T>(base: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(base + path, {
    ...init,
    cache: "no-store",
    headers: {
      "APCA-API-KEY-ID": process.env.ALPACA_KEY_ID ?? "",
      "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY ?? "",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(12_000),
  });
  const text = await res.text();
  let body: unknown = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { message: text }; }
  if (!res.ok) {
    const msg = (body as { message?: string })?.message || `Alpaca error ${res.status}`;
    throw new UpstreamError(msg, res.status);
  }
  return body as T;
}

const n = (v: unknown) => (v == null || v === "" ? null : Number(v));
const num = (v: unknown) => Number(v ?? 0);

// ---------- assets (names + search), cached in memory ----------
type Asset = { symbol: string; name: string; tradable: boolean; fractionable: boolean; exchange: string };
let assetCache: { at: number; list: Asset[]; by: Map<string, Asset> } | null = null;

function cleanName(s: string) {
  return (s || "")
    .replace(/\s+(Common Stock|Ordinary Shares|American Depositary Shares|Class [A-C] (Common Stock|Ordinary Shares)|Common Shares).*$/i, "")
    .replace(/,?\s+Inc\.?$/i, "")
    .trim();
}

export async function assets() {
  if (assetCache && Date.now() - assetCache.at < 12 * 3600_000) return assetCache;
  const raw = await call<Record<string, unknown>[]>(TRADE, "/v2/assets?status=active&asset_class=us_equity");
  const list: Asset[] = raw
    .filter(a => a.tradable)
    .map(a => ({ symbol: String(a.symbol), name: cleanName(String(a.name)), tradable: Boolean(a.tradable), fractionable: Boolean(a.fractionable), exchange: String(a.exchange) }));
  assetCache = { at: Date.now(), list, by: new Map(list.map(a => [a.symbol, a])) };
  return assetCache;
}

export async function searchAssets(q: string) {
  const term = q.trim().toLowerCase();
  if (!term) return [];
  const { list } = await assets();
  const scored: [number, Asset][] = [];
  for (const a of list) {
    const s = a.symbol.toLowerCase(), nm = a.name.toLowerCase();
    let sc = 0;
    if (s === term) sc = 100; else if (nm === term) sc = 90; else if (nm.startsWith(term)) sc = 70;
    else if (s.startsWith(term)) sc = 50; else if (nm.includes(" " + term)) sc = 30;
    if (sc) scored.push([sc - a.name.length / 100, a]);
  }
  return scored.sort((x, y) => y[0] - x[0]).slice(0, 10).map(([, a]) => ({ symbol: a.symbol, name: a.name, exchange: a.exchange }));
}

// ---------- account ----------
export async function account(): Promise<Account> {
  const a = await call<Record<string, unknown>>(TRADE, "/v2/account");
  return {
    equity: num(a.equity), lastEquity: num(a.last_equity), cash: num(a.cash), buyingPower: num(a.buying_power),
    longMarketValue: num(a.long_market_value), status: String(a.status), currency: String(a.currency ?? "USD"), paper: true,
  };
}

export async function positions(): Promise<Position[]> {
  const ps = await call<Record<string, unknown>[]>(TRADE, "/v2/positions");
  return ps.map(p => ({
    symbol: String(p.symbol), qty: num(p.qty), avgEntry: num(p.avg_entry_price), price: num(p.current_price),
    marketValue: num(p.market_value), costBasis: num(p.cost_basis), unrealizedPl: num(p.unrealized_pl),
    unrealizedPlPct: num(p.unrealized_plpc) * 100, changeTodayPct: num(p.change_today) * 100,
  }));
}

export async function clock(): Promise<Clock> {
  const c = await call<Record<string, unknown>>(TRADE, "/v2/clock");
  return { isOpen: Boolean(c.is_open), nextOpen: String(c.next_open), nextClose: String(c.next_close), timestamp: String(c.timestamp) };
}

const PERIODS: Record<string, { period: string; timeframe: string }> = {
  "1W": { period: "1W", timeframe: "1H" }, "1M": { period: "1M", timeframe: "1D" },
  "3M": { period: "3M", timeframe: "1D" }, "1A": { period: "1A", timeframe: "1D" },
};

export async function portfolioHistory(range: string): Promise<HistoryPoint[]> {
  const p = PERIODS[range] ?? PERIODS["1M"];
  const h = await call<{ timestamp?: number[]; equity?: (number | null)[]; profit_loss?: (number | null)[] }>(
    TRADE, `/v2/account/portfolio/history?period=${p.period}&timeframe=${p.timeframe}`);
  return (h.timestamp ?? [])
    .map((t, i) => ({ t: new Date(t * 1000).toISOString(), equity: Number(h.equity?.[i] ?? 0), pl: Number(h.profit_loss?.[i] ?? 0) }))
    .filter(x => x.equity > 0);
}

export async function dividends(): Promise<{ total: number; items: { date: string; symbol: string; amount: number }[] }> {
  const acts = await call<Record<string, unknown>[]>(TRADE, "/v2/account/activities?activity_types=DIV&page_size=100");
  const items = acts.map(a => ({ date: String(a.date ?? a.transaction_time ?? ""), symbol: String(a.symbol ?? ""), amount: num(a.net_amount) }));
  return { total: items.reduce((s, i) => s + i.amount, 0), items };
}

// ---------- orders ----------
function mapOrder(o: Record<string, unknown>): Order {
  return {
    id: String(o.id), clientOrderId: String(o.client_order_id), symbol: String(o.symbol), side: o.side as "buy" | "sell",
    type: String(o.type ?? o.order_type), qty: n(o.qty), notional: n(o.notional), filledQty: num(o.filled_qty),
    filledAvgPrice: n(o.filled_avg_price), limitPrice: n(o.limit_price), stopPrice: n(o.stop_price), status: String(o.status),
    timeInForce: String(o.time_in_force), submittedAt: String(o.submitted_at), filledAt: o.filled_at ? String(o.filled_at) : null,
  };
}

export async function orders(status: "open" | "all"): Promise<Order[]> {
  const os = await call<Record<string, unknown>[]>(TRADE, `/v2/orders?status=${status}&limit=100&direction=desc&nested=false`);
  return os.map(mapOrder);
}

export type OrderRequest = {
  symbol: string; side: "buy" | "sell"; type: "market" | "limit" | "stop" | "stop_limit";
  qty?: number; notional?: number; limitPrice?: number; stopPrice?: number;
  timeInForce: "day" | "gtc"; clientOrderId: string;
};

export async function placeOrder(r: OrderRequest): Promise<Order> {
  const body: Record<string, unknown> = {
    symbol: r.symbol, side: r.side, type: r.type, time_in_force: r.timeInForce, client_order_id: r.clientOrderId,
  };
  if (r.notional != null) body.notional = r.notional.toFixed(2); else body.qty = String(r.qty);
  if (r.limitPrice != null) body.limit_price = r.limitPrice.toFixed(2);
  if (r.stopPrice != null) body.stop_price = r.stopPrice.toFixed(2);
  return mapOrder(await call<Record<string, unknown>>(TRADE, "/v2/orders", { method: "POST", body: JSON.stringify(body) }));
}

export async function cancelOrder(id: string) {
  await call(TRADE, `/v2/orders/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ---------- watchlist (one Alpaca watchlist named "Papitostocks") ----------
type WL = { id: string; name: string; assets?: { symbol: string }[] };

async function mainWatchlist(): Promise<WL> {
  const lists = await call<WL[]>(TRADE, "/v2/watchlists");
  const found = lists.find(l => l.name === "Papitostocks");
  if (found) return call<WL>(TRADE, `/v2/watchlists/${found.id}`);
  const { DEFAULT_WATCHLIST } = await import("@/lib/universe");
  return call<WL>(TRADE, "/v2/watchlists", { method: "POST", body: JSON.stringify({ name: "Papitostocks", symbols: DEFAULT_WATCHLIST }) });
}

export async function watchlist(): Promise<string[]> {
  return ((await mainWatchlist()).assets ?? []).map(a => a.symbol);
}
export async function watchlistAdd(symbol: string) {
  const wl = await mainWatchlist();
  await call(TRADE, `/v2/watchlists/${wl.id}`, { method: "POST", body: JSON.stringify({ symbol }) });
}
export async function watchlistRemove(symbol: string) {
  const wl = await mainWatchlist();
  await call(TRADE, `/v2/watchlists/${wl.id}/${encodeURIComponent(symbol)}`, { method: "DELETE" });
}

// ---------- market data ----------
type Snap = {
  latestTrade?: { p: number; t: string };
  dailyBar?: { c: number; v: number };
  prevDailyBar?: { c: number };
};

export async function quotes(symbols: string[]): Promise<Quote[]> {
  const out: Quote[] = [];
  const names = await assets().then(a => a.by).catch(() => new Map<string, Asset>());
  for (let i = 0; i < symbols.length; i += 50) {
    const chunk = symbols.slice(i, i + 50);
    const snaps = await call<Record<string, Snap>>(DATA, `/v2/stocks/snapshots?symbols=${chunk.join(",")}&feed=iex`);
    for (const s of chunk) {
      const sn = snaps[s] ?? {};
      const price = sn.latestTrade?.p ?? sn.dailyBar?.c ?? null;
      const prev = sn.prevDailyBar?.c ?? null;
      const vol = sn.dailyBar?.v ?? null;
      out.push({
        symbol: s, name: names.get(s)?.name ?? s, price, prevClose: prev,
        change: price != null && prev ? price - prev : null,
        changePct: price != null && prev ? ((price - prev) / prev) * 100 : null,
        volume: vol, dollarVolume: vol != null && price != null ? vol * price : null,
        time: sn.latestTrade?.t ?? null,
      });
    }
  }
  return out;
}

const RANGES: Record<string, { days: number; tf: string }> = {
  "1D": { days: 1, tf: "5Min" }, "5D": { days: 7, tf: "30Min" }, "1M": { days: 31, tf: "1Day" },
  "6M": { days: 183, tf: "1Day" }, "1Y": { days: 366, tf: "1Day" }, "5Y": { days: 5 * 366, tf: "1Week" },
  "MAX": { days: 12 * 366, tf: "1Week" },
};

export async function bars(symbol: string, range: string): Promise<Bar[]> {
  const r = RANGES[range] ?? RANGES["1Y"];
  // For intraday ranges start a few days back so weekends/holidays still return data.
  const start = new Date(Date.now() - (r.days < 7 ? 5 : r.days) * 864e5).toISOString();
  const data = await call<{ bars?: { t: string; o: number; h: number; l: number; c: number; v: number }[] }>(
    DATA, `/v2/stocks/${symbol}/bars?timeframe=${r.tf}&start=${start}&feed=iex&limit=10000&adjustment=split`);
  let out = (data.bars ?? []).map(b => ({ t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v }));
  if (range === "1D" && out.length) {
    const lastDay = out[out.length - 1].t.slice(0, 10);
    out = out.filter(b => b.t.slice(0, 10) === lastDay);
  }
  return out;
}

export async function news(symbols: string[] | null, limit = 40): Promise<NewsItem[]> {
  const qs = new URLSearchParams({ limit: String(Math.min(limit, 50)), sort: "desc", include_content: "false" });
  if (symbols?.length) qs.set("symbols", symbols.join(","));
  const d = await call<{ news?: Record<string, unknown>[] }>(DATA, `/v1beta1/news?${qs}`);
  return (d.news ?? []).map(x => {
    const imgs = (x.images as { size: string; url: string }[] | undefined) ?? [];
    return {
      id: String(x.id), headline: String(x.headline ?? ""), summary: String(x.summary ?? ""),
      source: String(x.source ?? "benzinga"), author: String(x.author ?? ""), url: String(x.url ?? ""),
      createdAt: String(x.created_at), updatedAt: String(x.updated_at ?? x.created_at),
      symbols: (x.symbols as string[]) ?? [],
      image: imgs.find(i => i.size === "large")?.url ?? imgs[0]?.url ?? null,
    };
  });
}

export async function movers(): Promise<{ gainers: Mover[]; losers: Mover[]; asOf: string }> {
  const d = await call<{ gainers?: Record<string, number | string>[]; losers?: Record<string, number | string>[]; last_updated?: string }>(
    DATA, "/v1beta1/screener/stocks/movers?top=10");
  const m = (x: Record<string, number | string>) => ({ symbol: String(x.symbol), price: Number(x.price), changePct: Number(x.percent_change) });
  return { gainers: (d.gainers ?? []).map(m), losers: (d.losers ?? []).map(m), asOf: d.last_updated ?? "" };
}

export async function mostActive(): Promise<{ items: Active[]; asOf: string }> {
  const d = await call<{ most_actives?: Record<string, number | string>[]; last_updated?: string }>(
    DATA, "/v1beta1/screener/stocks/most-actives?by=volume&top=10");
  return { items: (d.most_actives ?? []).map(x => ({ symbol: String(x.symbol), volume: Number(x.volume), tradeCount: Number(x.trade_count) })), asOf: d.last_updated ?? "" };
}
