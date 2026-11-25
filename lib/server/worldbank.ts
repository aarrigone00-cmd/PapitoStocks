import "server-only";
import { unstable_cache } from "next/cache";

// World Bank Indicators API: free, no key. Annual data, published with a lag.
export const WB_INDICATORS = {
  gdp: "NY.GDP.MKTP.KD.ZG",      // GDP growth, annual %
  infl: "FP.CPI.TOTL.ZG",        // Inflation, consumer prices, annual %
  unemp: "SL.UEM.TOTL.ZS",       // Unemployment, % of labour force (ILO estimate)
  debt: "GC.DOD.TOTL.GD.ZS",     // Central government debt, % of GDP
  ca: "BN.CAB.XOKA.GD.ZS",       // Current account balance, % of GDP
  gdppc: "NY.GDP.PCAP.CD",       // GDP per capita, current US$
  exports: "NE.EXP.GNFS.ZS",     // Exports of goods & services, % of GDP
  pop: "SP.POP.TOTL",            // Population
  rate: "FR.INR.LEND",           // Lending interest rate, %
  fdi: "BX.KLT.DINV.WD.GD.ZS",   // Foreign direct investment, net inflows, % of GDP
} as const;
export type WbKey = keyof typeof WB_INDICATORS;

export const worldBank = unstable_cache(
  async (key: WbKey) => {
    const code = WB_INDICATORS[key];
    const r = await fetch(`https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&mrnev=1&per_page=400`,
      { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    if (!r.ok) throw new Error(`World Bank HTTP ${r.status}`);
    const j = (await r.json()) as [unknown, { countryiso3code: string; date: string; value: number | null }[] | null];
    const out: Record<string, { value: number; year: string }> = {};
    for (const row of j[1] ?? []) if (row.countryiso3code && row.value != null) out[row.countryiso3code] = { value: row.value, year: row.date };
    return { data: out, fetchedAt: new Date().toISOString() };
  },
  ["worldbank-v1"],
  { revalidate: 86400 },
);
