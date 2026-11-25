import type { Lang } from "./i18n";

const loc = (l: Lang) => (l === "it" ? "it-IT" : "en-US");

export const usd = (n: number | null | undefined, l: Lang, digits = 2) =>
  n == null || !isFinite(n) ? "—" :
  new Intl.NumberFormat(loc(l), { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);

export const num = (n: number | null | undefined, l: Lang, digits = 2) =>
  n == null || !isFinite(n) ? "—" : new Intl.NumberFormat(loc(l), { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(n);

export const compact = (n: number | null | undefined, l: Lang) =>
  n == null || !isFinite(n) ? "—" : new Intl.NumberFormat(loc(l), { notation: "compact", maximumFractionDigits: 1 }).format(n);

export const pct = (n: number | null | undefined, l: Lang, signed = true) =>
  n == null || !isFinite(n) ? "—" :
  (signed && n > 0 ? "+" : "") + new Intl.NumberFormat(loc(l), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + "%";

export const dir = (n: number | null | undefined) => (n == null || Math.abs(n) < 0.005 ? "flat" : n > 0 ? "up" : "down");

export const time = (iso: string, l: Lang) => new Date(iso).toLocaleTimeString(loc(l), { hour: "2-digit", minute: "2-digit" });
export const dateTime = (iso: string, l: Lang) =>
  new Date(iso).toLocaleString(loc(l), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const longDate = (d: Date, l: Lang) =>
  d.toLocaleDateString(loc(l), { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

export function ago(iso: string, l: Lang) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(loc(l), { numeric: "auto" });
  if (s < 60) return rtf.format(-Math.round(s), "second");
  if (s < 3600) return rtf.format(-Math.round(s / 60), "minute");
  if (s < 86400) return rtf.format(-Math.round(s / 3600), "hour");
  return rtf.format(-Math.round(s / 86400), "day");
}
