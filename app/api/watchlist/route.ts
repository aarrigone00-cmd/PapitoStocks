import type { NextRequest } from "next/server";
import * as A from "@/lib/server/alpaca";
import { fail, meta, ok, requireSession } from "@/lib/server/guard";
import { SYMBOL_RE } from "@/lib/universe";

async function handle(req: NextRequest, action: "add" | "remove") {
  if (!(await requireSession())) return fail(new Error("unauthorized"), 401);
  if (!A.alpacaConfigured()) return fail(new Error("Alpaca is not configured (demo mode)"), 400);
  const { symbol } = (await req.json().catch(() => ({}))) as { symbol?: string };
  const sym = String(symbol ?? "").toUpperCase();
  if (!SYMBOL_RE.test(sym)) return fail(new Error("Invalid symbol"), 400);
  try {
    if (action === "add") await A.watchlistAdd(sym); else await A.watchlistRemove(sym);
    return ok(await A.watchlist(), meta("alpaca", "realtime"));
  } catch (e) { return fail(e); }
}

export const POST = (req: NextRequest) => handle(req, "add");
export const DELETE = (req: NextRequest) => handle(req, "remove");
