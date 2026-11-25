// Signed session cookie (HMAC-SHA256 via Web Crypto, works in Proxy and Route Handlers).
// Single-user access protection until Supabase Auth is added (Phase 1b).
export const SESSION_COOKIE = "ps_session";
const MAX_AGE_S = 30 * 24 * 3600;

const enc = new TextEncoder();

async function hmac(data: string) {
  const secret = process.env.SESSION_SECRET || process.env.APP_PASSCODE || "";
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  let bin = "";
  for (const b of new Uint8Array(sig)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export const authRequired = () => Boolean(process.env.APP_PASSCODE);

export async function createSession() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_S;
  return { value: `${exp}.${await hmac(String(exp))}`, maxAge: MAX_AGE_S };
}

export async function verifySession(value: string | undefined) {
  if (!authRequired()) return true;
  if (!value) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, await hmac(exp));
}

export function passcodeMatches(input: string) {
  const expected = process.env.APP_PASSCODE ?? "";
  return expected.length > 0 && safeEqual(input, expected);
}
