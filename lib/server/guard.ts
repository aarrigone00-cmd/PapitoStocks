import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "./session";
import type { Freshness, Meta } from "@/lib/types";
import { UpstreamError } from "./alpaca";

export async function requireSession() {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

export const meta = (source: Meta["source"], freshness: Freshness, note?: string): Meta =>
  ({ source, freshness, asOf: new Date().toISOString(), ...(note ? { note } : {}) });

export function ok<T>(data: T, m: Meta) {
  return NextResponse.json({ data, meta: m }, { headers: { "Cache-Control": "no-store" } });
}

export function fail(e: unknown, status = 500) {
  const msg = e instanceof Error ? e.message : String(e);
  const own = (e as { status?: number })?.status;
  const code = e instanceof UpstreamError ? (e.status === 401 || e.status === 403 ? 502 : e.status) : own ?? status;
  console.error("[api]", msg);
  return NextResponse.json({ error: msg, meta: meta("none", "unavailable") }, { status: code, headers: { "Cache-Control": "no-store" } });
}
