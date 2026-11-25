import type { NextRequest } from "next/server";
import * as A from "@/lib/server/alpaca";
import * as D from "@/lib/server/demo";
import { fail, meta, ok, requireSession } from "@/lib/server/guard";
import { HEATMAP, INDICES, SYMBOL_RE } from "@/lib/universe";

function symbolsParam(raw: string | null, max = 100) {
  const syms = (raw ?? "").toUpperCase().split(",").map(s => s.trim()).filter(Boolean);
  if (!syms.length || syms.length > max || !syms.every(s => SYMBOL_RE.test(s))) throw Object.assign(new Error("Invalid symbols"), { status: 400 });
  return [...new Set(syms)];
}

export async function GET(req: NextRequest, ctx: RouteContext<"/api/data/[resource]">) {
  if (!(await requireSession())) return fail(new Error("unauthorized"), 401);
  const { resource } = await ctx.params;
  const q = req.nextUrl.searchParams;
  const live = A.alpacaConfigured();
  const demoMeta = meta("demo", "demo", "Demonstration data: Alpaca keys are not configured");

  try {
    switch (resource) {
      case "status":
        return ok({
          alpaca: live, mode: "paper", authProtected: Boolean(process.env.APP_PASSCODE),
          tradingDisabled: process.env.TRADING_DISABLED === "true",
          maxOrderNotional: Number(process.env.MAX_ORDER_NOTIONAL || 10000),
          providers: {
            alpaca: live, claude: Boolean(process.env.ANTHROPIC_API_KEY), finnhub: Boolean(process.env.FINNHUB_API_KEY),
            fmp: Boolean(process.env.FMP_API_KEY), fred: Boolean(process.env.FRED_API_KEY), supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
          },
        }, meta(live ? "alpaca" : "demo", live ? "realtime" : "demo"));

      case "account":
        return live ? ok(await A.account(), meta("alpaca", "realtime")) : ok(D.demoAccount(), demoMeta);
      case "positions":
        return live ? ok(await A.positions(), meta("alpaca", "realtime", "Prices from IEX")) : ok(D.demoPositions(), demoMeta);
      case "clock":
        return live ? ok(await A.clock(), meta("alpaca", "realtime")) : ok(D.demoClock(), demoMeta);
      case "history": {
        const range = q.get("range") ?? "1M";
        return live ? ok(await A.portfolioHistory(range), meta("alpaca", "historical")) : ok(D.demoHistory(range), demoMeta);
      }
      case "dividends":
        return live ? ok(await A.dividends(), meta("alpaca", "historical")) : ok({ total: 0, items: [] }, demoMeta);
      case "orders": {
        const status = q.get("status") === "open" ? "open" : "all";
        return live ? ok(await A.orders(status), meta("alpaca", "realtime")) : ok(D.demoOrders, demoMeta);
      }
      case "quotes": {
        const syms = symbolsParam(q.get("symbols"));
        return live ? ok(await A.quotes(syms), meta("alpaca", "realtime", "IEX exchange prices (a share of total US volume)")) : ok(D.demoQuotes(syms), demoMeta);
      }
      case "indices": {
        const syms = INDICES.map(i => i.symbol);
        const qs = live ? await A.quotes(syms) : D.demoQuotes(syms);
        const data = INDICES.map(i => ({ ...i, quote: qs.find(x => x.symbol === i.symbol) ?? null }));
        return ok(data, live ? meta("alpaca", "realtime", "US-listed ETFs; non-US markets shown via proxy ETFs during US hours") : demoMeta);
      }
      case "heatmap": {
        const syms = HEATMAP.map(h => h.symbol);
        const qs = live ? await A.quotes(syms) : D.demoQuotes(syms);
        const data = HEATMAP.map(h => ({ ...h, quote: qs.find(x => x.symbol === h.symbol) ?? null }));
        return ok(data, live ? meta("alpaca", "realtime", "Tile size = today's traded value on IEX") : demoMeta);
      }
      case "bars": {
        const [sym] = symbolsParam(q.get("symbol"), 1);
        const range = q.get("range") ?? "1Y";
        return live ? ok(await A.bars(sym, range), meta("alpaca", "historical", "IEX, split-adjusted")) : ok(D.demoBars(sym, range), demoMeta);
      }
      case "news": {
        const syms = q.get("symbols") ? symbolsParam(q.get("symbols"), 50) : null;
        return live ? ok(await A.news(syms, Number(q.get("limit") ?? 40)), meta("alpaca", "realtime", "Alpaca News API (Benzinga)")) : ok(D.demoNews(), demoMeta);
      }
      case "movers": {
        if (!live) return ok(D.demoMovers(), demoMeta);
        const m = await A.movers();
        return ok(m, meta("alpaca", "delayed", `Alpaca screener, updated ${m.asOf}`));
      }
      case "actives": {
        if (!live) return ok(D.demoActive(), demoMeta);
        const m = await A.mostActive();
        return ok(m, meta("alpaca", "delayed", `Alpaca screener, updated ${m.asOf}`));
      }
      case "search": {
        const term = (q.get("q") ?? "").slice(0, 40);
        if (!live) return ok(HEATMAP.filter(h => h.name.toLowerCase().includes(term.toLowerCase()) || h.symbol.startsWith(term.toUpperCase())).map(h => ({ symbol: h.symbol, name: h.name, exchange: "" })), demoMeta);
        return ok(await A.searchAssets(term), meta("alpaca", "realtime"));
      }
      case "watchlist":
        return live ? ok(await A.watchlist(), meta("alpaca", "realtime")) : ok(["RACE", "AAPL", "MSFT", "NVDA", "E", "STLA"], demoMeta);
      default:
        return fail(new Error("Unknown resource"), 404);
    }
  } catch (e) {
    return fail(e);
  }
}
