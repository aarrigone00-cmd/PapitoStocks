// Portfolio analytics computed in the browser from Alpaca price history.
// All metrics are backward-looking: they describe the past, not the future.
import type { Bar } from "./types";

export type Weight = { symbol: string; weight: number }; // weight as a fraction (sums to 1)

const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / Math.max(a.length, 1);
const sd = (a: number[]) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(a.length - 1, 1)); };

/** Aligns closing prices on the dates every symbol has, then turns them into simple returns. */
export function alignedReturns(bars: Record<string, Bar[]>, symbols: string[]) {
  const maps = symbols.map(s => new Map((bars[s] ?? []).map(b => [b.t.slice(0, 10), b.c])));
  const dates = [...(maps[0]?.keys() ?? [])].filter(d => maps.every(m => m.has(d))).sort();
  const prices = symbols.map((_, i) => dates.map(d => maps[i].get(d)!));
  const rets = prices.map(p => p.slice(1).map((v, k) => v / p[k] - 1));
  return { dates, prices, rets }; // rets[i][k] = return of symbol i on dates[k+1]
}

export function portfolioSeries(weights: number[], rets: number[][]) {
  const n = rets[0]?.length ?? 0;
  return Array.from({ length: n }, (_, k) => weights.reduce((s, w, i) => s + w * rets[i][k], 0));
}

export function maxDrawdown(returns: number[]) {
  let v = 1, peak = 1, mdd = 0, troughIdx = 0, peakIdx = 0, bestPeakIdx = 0;
  returns.forEach((r, i) => {
    v *= 1 + r;
    if (v > peak) { peak = v; peakIdx = i; }
    const dd = v / peak - 1;
    if (dd < mdd) { mdd = dd; troughIdx = i; bestPeakIdx = peakIdx; }
  });
  return { mdd, troughIdx, peakIdx: bestPeakIdx };
}

export function correlation(a: number[], b: number[]) {
  const ma = mean(a), mb = mean(b);
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < a.length; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

export function beta(p: number[], m: number[]) {
  const mm = mean(m), mp = mean(p);
  let cov = 0, vm = 0;
  for (let i = 0; i < p.length; i++) { cov += (p[i] - mp) * (m[i] - mm); vm += (m[i] - mm) ** 2; }
  return vm ? cov / vm : 0;
}

/** Full risk report. periodsPerYear: 252 for daily, 52 for weekly bars. rf: annual risk-free assumption (e.g. 0.035). */
export function riskReport(weights: number[], rets: number[][], market: number[], periodsPerYear: number, rf: number) {
  const p = portfolioSeries(weights, rets);
  const vol = sd(p) * Math.sqrt(periodsPerYear);
  const annRet = Math.pow(p.reduce((v, r) => v * (1 + r), 1), periodsPerYear / Math.max(p.length, 1)) - 1;
  const rfPer = Math.pow(1 + rf, 1 / periodsPerYear) - 1;
  const excess = p.map(r => r - rfPer);
  const downside = Math.sqrt(mean(excess.map(r => Math.min(r, 0) ** 2))) * Math.sqrt(periodsPerYear);
  const sorted = [...p].sort((a, b) => a - b);
  const cut = Math.max(1, Math.floor(sorted.length * 0.05));
  const var95 = -sorted[cut - 1];
  const es95 = -mean(sorted.slice(0, cut));
  const b = market.length === p.length ? beta(p, market) : NaN;
  const mktAnn = market.length ? Math.pow(market.reduce((v, r) => v * (1 + r), 1), periodsPerYear / market.length) - 1 : NaN;
  const alpha = annRet - (rf + b * (mktAnn - rf)); // Jensen's alpha, annualised
  return {
    vol, annRet, sharpe: vol ? (annRet - rf) / vol : 0, sortino: downside ? (annRet - rf) / downside : 0,
    var95, es95, beta: b, alpha, mktAnn, mdd: maxDrawdown(p).mdd, n: p.length,
  };
}

export function concentration(weights: number[]) {
  const hhi = weights.reduce((s, w) => s + w * w, 0);
  return { hhi, effectiveN: hhi ? 1 / hhi : 0, top: Math.max(0, ...weights) };
}

export function corrMatrix(rets: number[][]) {
  return rets.map(a => rets.map(b => correlation(a, b)));
}

/** Annualised mean and volatility of log returns (for Monte Carlo). */
export function logStats(returns: number[], periodsPerYear: number) {
  const lr = returns.map(r => Math.log(1 + r));
  return { mu: mean(lr) * periodsPerYear, sigma: sd(lr) * Math.sqrt(periodsPerYear) };
}

// Box–Muller standard normal
function randn(rng: () => number) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

/**
 * Monte Carlo of a portfolio with monthly contributions.
 * mu/sigma: annual log-return mean and volatility. Returns yearly percentiles.
 */
export function monteCarlo(opts: { initial: number; monthly: number; years: number; mu: number; sigma: number; paths?: number; inflation?: number; seed?: number }) {
  const { initial, monthly, years, mu, sigma, paths = 2000, inflation = 0, seed = 7 } = opts;
  const rng = seeded(seed);
  const m = mu / 12, s = sigma / Math.sqrt(12);
  const byYear: number[][] = Array.from({ length: years + 1 }, () => []);
  for (let p = 0; p < paths; p++) {
    let v = initial;
    byYear[0].push(v);
    for (let mo = 1; mo <= years * 12; mo++) {
      v = v * Math.exp(m + s * randn(rng)) + monthly;
      if (mo % 12 === 0) byYear[mo / 12].push(v / Math.pow(1 + inflation, mo / 12));
    }
  }
  const q = (arr: number[], k: number) => { const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(k * a.length))]; };
  return byYear.map((arr, y) => ({ year: y, p10: q(arr, 0.1), p25: q(arr, 0.25), p50: q(arr, 0.5), p75: q(arr, 0.75), p90: q(arr, 0.9) }));
}

/** Compound growth with monthly contributions and a fixed annual return. */
export function compound(initial: number, monthly: number, years: number, annualReturn: number, inflation: number) {
  const r = Math.pow(1 + annualReturn, 1 / 12) - 1;
  const rows: { year: number; contributed: number; value: number; real: number }[] = [];
  let v = initial, contributed = initial;
  rows.push({ year: 0, contributed, value: v, real: v });
  for (let mo = 1; mo <= years * 12; mo++) {
    v = v * (1 + r) + monthly; contributed += monthly;
    if (mo % 12 === 0) rows.push({ year: mo / 12, contributed, value: v, real: v / Math.pow(1 + inflation, mo / 12) });
  }
  return rows;
}
