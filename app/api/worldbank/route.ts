import type { NextRequest } from "next/server";
import { fail, meta, ok, requireSession } from "@/lib/server/guard";
import { WB_INDICATORS, worldBank, type WbKey } from "@/lib/server/worldbank";

export async function GET(req: NextRequest) {
  if (!(await requireSession())) return fail(new Error("unauthorized"), 401);
  const key = req.nextUrl.searchParams.get("ind") as WbKey;
  if (!(key in WB_INDICATORS)) return fail(Object.assign(new Error("Unknown indicator"), { status: 400 }));
  try {
    const r = await worldBank(key);
    return ok(r.data, { ...meta("worldbank", "historical", `World Bank ${WB_INDICATORS[key]} (latest available year per country)`), asOf: r.fetchedAt });
  } catch (e) { return fail(e, 503); }
}
