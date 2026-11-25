// Rule-based classification used by Risk Radar and the shock simulator.
// It covers the companies and funds the app tracks; anything else is shown
// honestly as "unclassified" (sector data from a provider arrives in Phase 2).
import { HEATMAP, INDICES, type Sector } from "./universe";

export type SectorKey = Sector | "broad" | "other";
export type Region = "us" | "europe" | "italy" | "asia" | "global" | "unknown";

const EXTRA_SECTOR: Record<string, SectorKey> = {
  SPY: "broad", VOO: "broad", IVV: "broad", VTI: "broad", DIA: "broad", IWM: "broad", QQQ: "tech",
  EWU: "broad", EWG: "broad", EWI: "broad", FEZ: "broad", EWJ: "broad", EWH: "broad", ASHR: "broad", VEA: "broad", VWO: "broad",
  XLK: "tech", XLC: "comm", XLY: "discretionary", XLF: "financials", XLV: "health", XLP: "staples", XLE: "energy",
  XLI: "industrials", XLU: "utilities", SMH: "tech", SOXX: "tech", GLD: "other", TLT: "other",
  INTC: "tech", CSCO: "tech", IBM: "tech", QCOM: "tech", TXN: "tech", MU: "tech", ASML: "tech", TSM: "tech", SAP: "tech",
  T: "comm", VZ: "comm", CMCSA: "comm", SBUX: "discretionary", LOW: "discretionary", TGT: "discretionary",
  WFC: "financials", C: "financials", MS: "financials", AXP: "financials", BRK_B: "financials", HSBC: "financials", ING: "financials", UBS: "financials",
  ABT: "health", TMO: "health", AZN: "health", NVO: "health", NVS: "health", GSK: "health", SNY: "health",
  MO: "staples", PM: "staples", MDLZ: "staples", CL: "staples", UL: "staples", DEO: "staples", BTI: "staples",
  COP: "energy", SLB: "energy", SHEL: "energy", BP: "energy", TTE: "energy", EQNR: "energy",
  UPS: "industrials", RTX: "industrials", LMT: "industrials", DE: "industrials", UNP: "industrials",
  DUK: "utilities", SO: "utilities", D: "utilities",
};

// The "europe" bucket of the heatmap holds European ADRs; map them to their real sector here.
const EURO_ADR_SECTOR: Record<string, SectorKey> = { RACE: "discretionary", STLA: "discretionary", E: "energy" };

const REGION: Record<string, Region> = {
  RACE: "italy", STLA: "italy", E: "italy", EWI: "italy",
  ASML: "europe", SAP: "europe", NVO: "europe", NVS: "europe", AZN: "europe", GSK: "europe", SNY: "europe", SHEL: "europe",
  BP: "europe", TTE: "europe", EQNR: "europe", UL: "europe", DEO: "europe", BTI: "europe", HSBC: "europe", ING: "europe", UBS: "europe",
  EWU: "europe", EWG: "europe", FEZ: "europe", VEA: "global", VWO: "asia",
  EWJ: "asia", EWH: "asia", ASHR: "asia", TSM: "asia",
};

export function sectorOf(symbol: string): SectorKey {
  if (EURO_ADR_SECTOR[symbol]) return EURO_ADR_SECTOR[symbol];
  const h = HEATMAP.find(x => x.symbol === symbol);
  if (h && h.sector !== "europe") return h.sector;
  return EXTRA_SECTOR[symbol] ?? "other";
}

export function regionOf(symbol: string): Region {
  if (REGION[symbol]) return REGION[symbol];
  if (INDICES.some(i => i.symbol === symbol && i.region === "US")) return "us";
  if (HEATMAP.some(h => h.symbol === symbol) || EXTRA_SECTOR[symbol]) return "us";
  return "unknown";
}

export const SECTOR_LABEL: Record<"it" | "en", Record<SectorKey, string>> = {
  it: { tech: "Tecnologia", comm: "Comunicazioni", discretionary: "Consumi discrezionali", financials: "Finanza", health: "Salute",
    staples: "Beni primari", energy: "Energia", industrials: "Industria", utilities: "Servizi pubblici", europe: "Europa", broad: "Fondi diversificati", other: "Non classificato" },
  en: { tech: "Technology", comm: "Communication", discretionary: "Consumer discretionary", financials: "Financials", health: "Health care",
    staples: "Consumer staples", energy: "Energy", industrials: "Industrials", utilities: "Utilities", europe: "Europe", broad: "Diversified funds", other: "Unclassified" },
};

export const REGION_LABEL: Record<"it" | "en", Record<Region, string>> = {
  it: { us: "Stati Uniti", europe: "Europa", italy: "Italia", asia: "Asia", global: "Globale", unknown: "Non classificato" },
  en: { us: "United States", europe: "Europe", italy: "Italy", asia: "Asia", global: "Global", unknown: "Unclassified" },
};

// Rule-of-thumb sensitivities (−2 hurt a lot … +2 helped a lot). Textbook tendencies, not forecasts.
export const RATE_SENS: Record<SectorKey, number> = {
  tech: -2, comm: -1, discretionary: -1, financials: 1, health: 0, staples: -1, energy: 0, industrials: -1, utilities: -2, europe: -1, broad: -1, other: 0,
};
export const INFL_SENS: Record<SectorKey, number> = {
  tech: -1, comm: -1, discretionary: -2, financials: 0, health: 0, staples: -1, energy: 2, industrials: 0, utilities: -1, europe: -1, broad: -1, other: 0,
};
