import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, createSession, passcodeMatches, authRequired } from "@/lib/server/session";

// Simple per-instance brute-force brake. (Serverless instances don't share memory;
// a shared limiter arrives with Supabase in Phase 1b.)
const attempts = new Map<string, { n: number; until: number }>();

export async function POST(req: NextRequest) {
  if (!authRequired()) return NextResponse.json({ ok: true });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const a = attempts.get(ip);
  if (a && a.until > Date.now()) return NextResponse.json({ error: "locked" }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as { passcode?: string };
  if (!passcodeMatches(String(body.passcode ?? ""))) {
    const n = (a?.n ?? 0) + 1;
    attempts.set(ip, { n, until: n >= 5 ? Date.now() + 15 * 60_000 : 0 });
    console.warn("[auth] failed login", { ip, n });
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }
  attempts.delete(ip);
  const s = await createSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, s.value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: s.maxAge });
  console.info("[auth] login", { ip });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
