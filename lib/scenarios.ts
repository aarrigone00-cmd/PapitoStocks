// Illustrative market-shock assumptions for the Simulation Lab.
// These are NOT forecasts: they are round, textbook-style sector reactions,
// written down openly so the user can see and question every number.
import type { SectorKey } from "./classify";

export type Scenario = {
  id: string;
  title: { it: string; en: string };
  story: { it: string; en: string };
  /** central price impact per sector, in % */
  impact: Partial<Record<SectorKey, number>>;
  /** fallback for sectors not listed */
  base: number;
  /** extra change in the EUR value of USD assets (for a euro-based investor), in % */
  fx?: number;
  /** use each holding's measured beta × this market move instead of the sector table */
  betaMove?: number;
};

export const SCENARIOS: Scenario[] = [
  { id: "recession", base: -25,
    title: { it: "Recessione globale", en: "Global recession" },
    story: { it: "Calano consumi, profitti e occupazione. Soffrono di più i settori legati al ciclo economico; tengono meglio beni primari, salute e servizi pubblici.", en: "Spending, profits and jobs fall. Cyclical sectors suffer most; staples, health care and utilities hold up better." },
    impact: { tech: -30, comm: -27, discretionary: -35, financials: -35, health: -12, staples: -10, energy: -32, industrials: -32, utilities: -10, broad: -25 } },
  { id: "crash", base: -34, betaMove: -34,
    title: { it: "Crollo di borsa (tipo Covid 2020)", en: "Stock market crash (Covid-2020 style)" },
    story: { it: "Il mercato scende di circa un terzo in poche settimane. Ogni titolo è stimato con il suo beta misurato: chi di solito si muove più del mercato scende di più.", en: "The market falls about a third in weeks. Each holding is estimated with its measured beta: what usually moves more than the market falls more." },
    impact: {} },
  { id: "rates-up", base: -10,
    title: { it: "Tassi d'interesse in forte rialzo (+2 punti)", en: "Sharply rising interest rates (+2 points)" },
    story: { it: "Il denaro costa di più: i profitti futuri valgono meno oggi, quindi soffrono le aziende in crescita e quelle molto indebitate. Le banche possono guadagnare sui margini.", en: "Money costs more: future profits are worth less today, so growth companies and heavily indebted ones suffer. Banks can earn more on margins." },
    impact: { tech: -16, comm: -12, discretionary: -10, financials: 3, health: -5, staples: -6, energy: 0, industrials: -8, utilities: -14, broad: -10 } },
  { id: "rates-down", base: 6,
    title: { it: "Tassi d'interesse in calo (−2 punti)", en: "Falling interest rates (−2 points)" },
    story: { it: "Il denaro costa meno: favorite le aziende in crescita e i settori sensibili ai tassi; le banche guadagnano un po' meno sui margini. Spesso però i tassi scendono perché l'economia rallenta.", en: "Money is cheaper: growth companies and rate-sensitive sectors benefit; banks earn slightly less. Rates often fall because the economy is slowing, though." },
    impact: { tech: 10, comm: 8, discretionary: 8, financials: -4, health: 4, staples: 4, energy: 0, industrials: 5, utilities: 8, broad: 6 } },
  { id: "oil", base: -6,
    title: { it: "Shock petrolifero (+50% prezzo del greggio)", en: "Oil supply shock (+50% crude price)" },
    story: { it: "Un'interruzione delle forniture fa salire il petrolio: guadagnano le aziende energetiche, soffrono trasporti, industria e consumi; sale l'inflazione e le banche centrali potrebbero alzare i tassi.", en: "A supply disruption lifts oil: energy companies gain, transport, industry and consumers suffer; inflation rises and central banks may raise rates." },
    impact: { energy: 20, industrials: -9, discretionary: -12, staples: -5, tech: -6, comm: -5, financials: -5, health: -3, utilities: -4, broad: -6 } },
  { id: "usd", base: 0, fx: -13,
    title: { it: "Il dollaro perde il 15% contro l'euro", en: "The dollar falls 15% against the euro" },
    story: { it: "Per chi vive in Italia è lo scenario più diretto: anche se i prezzi in dollari non cambiano, il valore in euro del portafoglio scende di circa il 13%. Le multinazionali americane guadagnano un po' (vendono di più all'estero).", en: "For someone living in Italy this is the most direct risk: even if dollar prices don't change, the portfolio's euro value falls about 13%. US multinationals gain a little (foreign sales are worth more)." },
    impact: { tech: 4, staples: 3, health: 2, industrials: 3, comm: 2, broad: 2 } },
  { id: "tariffs", base: -8,
    title: { it: "Guerra dei dazi", en: "Trade war / tariffs" },
    story: { it: "Nuovi dazi alzano i costi e frenano il commercio: soffrono industria, auto, beni di consumo importati e le catene di fornitura globali, compresi molti esportatori europei.", en: "New tariffs raise costs and slow trade: industry, autos, imported consumer goods and global supply chains suffer, including many European exporters." },
    impact: { industrials: -12, discretionary: -13, tech: -10, staples: -5, energy: -5, financials: -6, health: -3, utilities: 0, comm: -4, broad: -8 } },
  { id: "banking", base: -15,
    title: { it: "Crisi bancaria", en: "Banking crisis" },
    story: { it: "Perdita di fiducia nelle banche: crollano i titoli finanziari, il credito si stringe e rallenta tutta l'economia.", en: "Loss of confidence in banks: financial stocks collapse, credit tightens and the whole economy slows." },
    impact: { financials: -32, discretionary: -18, industrials: -15, energy: -15, tech: -12, comm: -12, health: -6, staples: -5, utilities: -5, broad: -15 } },
  { id: "tech", base: -6,
    title: { it: "Correzione dei titoli tecnologici", en: "Technology sector correction" },
    story: { it: "Le valutazioni della tecnologia tornano verso la media dopo una lunga corsa (come nel 2000 o nel 2022), mentre il resto del mercato regge meglio.", en: "Tech valuations fall back after a long run (as in 2000 or 2022) while the rest of the market holds up better." },
    impact: { tech: -30, comm: -25, discretionary: -15, financials: -6, industrials: -8, health: -3, staples: 0, utilities: 0, energy: 0, broad: -12 } },
  { id: "inflation", base: -10,
    title: { it: "Inflazione persistente", en: "Persistent inflation" },
    story: { it: "I prezzi continuano a salire e i tassi restano alti: guadagnano energia e materie prime, soffrono consumi e aziende in crescita.", en: "Prices keep rising and rates stay high: energy and commodities gain, consumer and growth companies suffer." },
    impact: { tech: -15, comm: -12, discretionary: -12, utilities: -10, staples: -5, health: -5, industrials: -5, energy: 10, financials: 0, broad: -10 } },
  { id: "europe", base: -6,
    title: { it: "Crisi economica europea", en: "European economic crisis" },
    story: { it: "Recessione o tensioni sul debito in Europa: colpite soprattutto le aziende europee e le banche; effetti minori sugli Stati Uniti. L'euro di solito si indebolisce (attenuando le perdite in euro sugli investimenti in dollari).", en: "Recession or debt stress in Europe: European companies and banks are hit hardest; smaller effects in the US. The euro usually weakens (softening euro losses on dollar investments)." },
    impact: { financials: -12, tech: -8, energy: -10, industrials: -8, staples: -4, utilities: -4, broad: -10 }, fx: 5 },
];

/** Historical S&P 500 declines (price index, approximate, peak to trough). */
export const HISTORY = [
  { id: "1987", dd: -33.5, from: "1987-08", to: "1987-12", recoverMonths: 20, title: { it: "1987 · Lunedì nero", en: "1987 · Black Monday" } },
  { id: "2000", dd: -49.1, from: "2000-03", to: "2002-10", recoverMonths: 56, title: { it: "2000–02 · Bolla di Internet", en: "2000–02 · Dot-com bust" } },
  { id: "2008", dd: -56.8, from: "2007-10", to: "2009-03", recoverMonths: 49, title: { it: "2007–09 · Crisi finanziaria", en: "2007–09 · Financial crisis" } },
  { id: "2020", dd: -33.9, from: "2020-02-19", to: "2020-03-23", recoverMonths: 5, title: { it: "2020 · Covid", en: "2020 · Covid" } },
  { id: "2022", dd: -25.4, from: "2022-01-03", to: "2022-10-12", recoverMonths: 15, title: { it: "2022 · Inflazione e tassi", en: "2022 · Inflation & rates" } },
];
