// Instruments the app tracks. Alpaca only carries US-listed securities, so
// non-US indices are represented by US-listed ETFs that track them ("proxies").
// They trade during US hours, so they do not show the official local index level.

export type IndexDef = { symbol: string; index: string; region: string; proxy: boolean; note?: string };

export const INDICES: IndexDef[] = [
  { symbol: "SPY", index: "S&P 500", region: "US", proxy: false, note: "ETF (SPDR)" },
  { symbol: "QQQ", index: "Nasdaq 100", region: "US", proxy: false, note: "ETF (Invesco)" },
  { symbol: "DIA", index: "Dow Jones", region: "US", proxy: false, note: "ETF (SPDR)" },
  { symbol: "IWM", index: "Russell 2000", region: "US", proxy: false, note: "ETF (iShares)" },
  { symbol: "EWU", index: "FTSE 100", region: "UK", proxy: true, note: "iShares MSCI UK" },
  { symbol: "EWG", index: "DAX", region: "DE", proxy: true, note: "iShares MSCI Germany" },
  { symbol: "EWI", index: "FTSE MIB", region: "IT", proxy: true, note: "iShares MSCI Italy" },
  { symbol: "FEZ", index: "Euro Stoxx 50", region: "EU", proxy: false, note: "SPDR Euro Stoxx 50 ETF" },
  { symbol: "EWJ", index: "Nikkei 225", region: "JP", proxy: true, note: "iShares MSCI Japan" },
  { symbol: "EWH", index: "Hang Seng", region: "HK", proxy: true, note: "iShares MSCI Hong Kong" },
  { symbol: "ASHR", index: "Shanghai / CSI 300", region: "CN", proxy: true, note: "Xtrackers China A-Shares (CSI 300)" },
];

export type Sector = "tech" | "comm" | "discretionary" | "financials" | "health" | "staples" | "energy" | "industrials" | "utilities" | "europe";

export const HEATMAP: { symbol: string; name: string; sector: Sector }[] = [
  { symbol: "AAPL", name: "Apple", sector: "tech" }, { symbol: "MSFT", name: "Microsoft", sector: "tech" },
  { symbol: "NVDA", name: "NVIDIA", sector: "tech" }, { symbol: "AVGO", name: "Broadcom", sector: "tech" },
  { symbol: "ORCL", name: "Oracle", sector: "tech" }, { symbol: "AMD", name: "AMD", sector: "tech" },
  { symbol: "CRM", name: "Salesforce", sector: "tech" }, { symbol: "ADBE", name: "Adobe", sector: "tech" },
  { symbol: "GOOGL", name: "Alphabet", sector: "comm" }, { symbol: "META", name: "Meta", sector: "comm" },
  { symbol: "NFLX", name: "Netflix", sector: "comm" }, { symbol: "DIS", name: "Disney", sector: "comm" },
  { symbol: "AMZN", name: "Amazon", sector: "discretionary" }, { symbol: "TSLA", name: "Tesla", sector: "discretionary" },
  { symbol: "HD", name: "Home Depot", sector: "discretionary" }, { symbol: "MCD", name: "McDonald's", sector: "discretionary" },
  { symbol: "NKE", name: "Nike", sector: "discretionary" },
  { symbol: "JPM", name: "JPMorgan", sector: "financials" }, { symbol: "V", name: "Visa", sector: "financials" },
  { symbol: "MA", name: "Mastercard", sector: "financials" }, { symbol: "BAC", name: "Bank of America", sector: "financials" },
  { symbol: "GS", name: "Goldman Sachs", sector: "financials" },
  { symbol: "LLY", name: "Eli Lilly", sector: "health" }, { symbol: "UNH", name: "UnitedHealth", sector: "health" },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "health" }, { symbol: "ABBV", name: "AbbVie", sector: "health" },
  { symbol: "MRK", name: "Merck", sector: "health" }, { symbol: "PFE", name: "Pfizer", sector: "health" },
  { symbol: "WMT", name: "Walmart", sector: "staples" }, { symbol: "PG", name: "Procter & Gamble", sector: "staples" },
  { symbol: "KO", name: "Coca-Cola", sector: "staples" }, { symbol: "PEP", name: "PepsiCo", sector: "staples" },
  { symbol: "COST", name: "Costco", sector: "staples" },
  { symbol: "XOM", name: "Exxon Mobil", sector: "energy" }, { symbol: "CVX", name: "Chevron", sector: "energy" },
  { symbol: "CAT", name: "Caterpillar", sector: "industrials" }, { symbol: "GE", name: "GE Aerospace", sector: "industrials" },
  { symbol: "BA", name: "Boeing", sector: "industrials" }, { symbol: "HON", name: "Honeywell", sector: "industrials" },
  { symbol: "NEE", name: "NextEra Energy", sector: "utilities" },
  { symbol: "RACE", name: "Ferrari", sector: "europe" }, { symbol: "STLA", name: "Stellantis", sector: "europe" },
  { symbol: "E", name: "Eni", sector: "europe" },
];

export const DEFAULT_WATCHLIST = ["RACE", "AAPL", "MSFT", "NVDA", "E", "STLA"];

export const SYMBOL_RE = /^[A-Z][A-Z.]{0,9}$/;
