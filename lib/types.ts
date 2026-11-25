// Every API response carries provenance so the UI can label it honestly.
export type Freshness = "realtime" | "delayed" | "historical" | "demo" | "unavailable";

export type Meta = {
  source: "alpaca" | "demo" | "none";
  freshness: Freshness;
  asOf: string; // ISO time the server fetched it
  note?: string;
};

export type ApiResult<T> = { data: T; meta: Meta } | { error: string; meta: Meta };

export type Quote = {
  symbol: string;
  name: string;
  price: number | null;
  prevClose: number | null;
  change: number | null;
  changePct: number | null;
  volume: number | null;
  dollarVolume: number | null;
  time: string | null; // timestamp of the latest trade
};

export type Bar = { t: string; o: number; h: number; l: number; c: number; v: number };

export type Account = {
  equity: number;
  lastEquity: number;
  cash: number;
  buyingPower: number;
  longMarketValue: number;
  status: string;
  currency: string;
  paper: boolean;
};

export type Position = {
  symbol: string;
  qty: number;
  avgEntry: number;
  price: number;
  marketValue: number;
  costBasis: number;
  unrealizedPl: number;
  unrealizedPlPct: number;
  changeTodayPct: number;
};

export type Order = {
  id: string;
  clientOrderId: string;
  symbol: string;
  side: "buy" | "sell";
  type: string;
  qty: number | null;
  notional: number | null;
  filledQty: number;
  filledAvgPrice: number | null;
  limitPrice: number | null;
  stopPrice: number | null;
  status: string;
  timeInForce: string;
  submittedAt: string;
  filledAt: string | null;
};

export type NewsItem = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  author: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  symbols: string[];
  image: string | null;
};

export type Clock = { isOpen: boolean; nextOpen: string; nextClose: string; timestamp: string };

export type HistoryPoint = { t: string; equity: number; pl: number };

export type Mover = { symbol: string; price: number; changePct: number };
export type Active = { symbol: string; volume: number; tradeCount: number };
