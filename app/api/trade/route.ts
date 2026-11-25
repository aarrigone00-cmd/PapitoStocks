import type { NextRequest } from "next/server";
import * as A from "@/lib/server/alpaca";
import { fail, meta, ok, requireSession } from "@/lib/server/guard";
import { SYMBOL_RE } from "@/lib/universe";

// PAPER TRADING ONLY. This route can only ever reach paper-api.alpaca.markets.
// Safeguards: session check, emergency stop, input validation, size limits,
// buying-power check, idempotent client_order_id (duplicate prevention), audit log.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  if (!(await requireSession())) return fail(new Error("unauthorized"), 401);
  if (process.env.TRADING_DISABLED === "true") return fail(new Error("Trading is disabled (emergency stop)"), 403);
  if (!A.alpacaConfigured()) return fail(new Error("Alpaca is not configured (demo mode): orders are not sent"), 400);

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const symbol = String(b.symbol ?? "").toUpperCase();
  const side = b.side, type = b.type, tif = b.timeInForce ?? "day";
  const qty = b.qty != null ? Number(b.qty) : undefined;
  const notional = b.notional != null ? Number(b.notional) : undefined;
  const limitPrice = b.limitPrice != null ? Number(b.limitPrice) : undefined;
  const stopPrice = b.stopPrice != null ? Number(b.stopPrice) : undefined;
  const clientOrderId = String(b.clientOrderId ?? "");

  const maxNotional = Number(process.env.MAX_ORDER_NOTIONAL || 10000);
  const maxQty = Number(process.env.MAX_ORDER_QTY || 1000);
  const bad = (m: string) => fail(new Error(m), 400);

  if (!SYMBOL_RE.test(symbol)) return bad("Invalid symbol");
  if (side !== "buy" && side !== "sell") return bad("Invalid side");
  if (!["market", "limit", "stop", "stop_limit"].includes(String(type))) return bad("Invalid order type");
  if (tif !== "day" && tif !== "gtc") return bad("Invalid time in force");
  if (!UUID_RE.test(clientOrderId)) return bad("Missing order id");
  if ((qty == null) === (notional == null)) return bad("Specify either quantity or amount");
  if (qty != null && !(qty > 0 && qty <= maxQty)) return bad(`Quantity must be between 0 and ${maxQty}`);
  if (notional != null && !(notional >= 1 && notional <= maxNotional)) return bad(`Amount must be between $1 and $${maxNotional}`);
  if (notional != null && type !== "market") return bad("Dollar amounts are only allowed for market orders");
  if ((type === "limit" || type === "stop_limit") && !(limitPrice! > 0)) return bad("Limit price required");
  if ((type === "stop" || type === "stop_limit") && !(stopPrice! > 0)) return bad("Stop price required");

  try {
    const [q] = await A.quotes([symbol]);
    const px = limitPrice ?? stopPrice ?? q?.price ?? 0;
    const estimate = notional ?? (qty ?? 0) * px;
    if (estimate > maxNotional) return bad(`Estimated value $${estimate.toFixed(2)} exceeds the per-order limit of $${maxNotional}`);
    if (side === "buy") {
      const acct = await A.account();
      if (estimate > acct.buyingPower) return bad("Not enough buying power");
    }
    const order = await A.placeOrder({
      symbol, side, type: type as A.OrderRequest["type"], qty, notional, limitPrice, stopPrice,
      timeInForce: tif as "day" | "gtc", clientOrderId,
    });
    console.info("[audit] order placed", { mode: "paper", symbol, side, type, qty, notional, limitPrice, stopPrice, clientOrderId, id: order.id });
    return ok(order, meta("alpaca", "realtime", "Paper trading"));
  } catch (e) {
    console.warn("[audit] order rejected", { symbol, side, type, clientOrderId, error: e instanceof Error ? e.message : String(e) });
    return fail(e, 400);
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireSession())) return fail(new Error("unauthorized"), 401);
  if (!A.alpacaConfigured()) return fail(new Error("Alpaca is not configured"), 400);
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail(new Error("Invalid order id"), 400);
  try {
    await A.cancelOrder(id);
    console.info("[audit] order cancel requested", { id });
    return ok({ id }, meta("alpaca", "realtime"));
  } catch (e) { return fail(e, 400); }
}
