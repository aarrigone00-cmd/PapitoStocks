// Small server-side helper that talks to Alpaca for the app.
// The Alpaca keys live here (as environment variables on the host), never in the browser.
// It ONLY talks to the paper-trading (practice money) account.

const TRADE = "https://paper-api.alpaca.markets";
const DATA = "https://data.alpaca.markets";
const SYMBOL_RE = /^[A-Z][A-Z.]{0,9}$/;

let assetCache = null; // { at, list, bySymbol }
let fxCache = null; // { at, rate, date }

async function usdToEur() {
  if (fxCache && Date.now() - fxCache.at < 6 * 3600e3) return fxCache;
  // Free daily European Central Bank rates, no key needed.
  for (const url of ["https://api.frankfurter.app/latest?from=USD&to=EUR", "https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR"]) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const j = await r.json();
      if (j.rates && j.rates.EUR) { fxCache = { at: Date.now(), rate: j.rates.EUR, date: j.date }; return fxCache; }
    } catch { /* try next */ }
  }
  if (fxCache) return fxCache;
  const e = new Error("Exchange rate unavailable"); e.status = 502; throw e;
}

function headers() {
  return {
    "APCA-API-KEY-ID": process.env.ALPACA_KEY_ID,
    "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY,
    "Content-Type": "application/json",
  };
}

async function call(base, path, opts = {}) {
  const r = await fetch(base + path, { ...opts, headers: headers() });
  const text = await r.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { message: text }; }
  if (!r.ok) {
    const err = new Error(body.message || `Alpaca error ${r.status}`);
    err.status = r.status;
    throw err;
  }
  return body;
}

function cleanName(n) {
  return (n || "")
    .replace(/\s+(Common Stock|Ordinary Shares|Class [A-C] Common Stock|Common Shares).*$/i, "")
    .replace(/,?\s+Inc\.?$/i, "")
    .trim();
}

async function assets() {
  if (assetCache && Date.now() - assetCache.at < 12 * 3600e3) return assetCache;
  const list = await call(TRADE, "/v2/assets?status=active&asset_class=us_equity");
  const usable = list
    .filter(a => a.tradable && SYMBOL_RE.test(a.symbol))
    .map(a => ({ symbol: a.symbol, name: cleanName(a.name), fractionable: a.fractionable }));
  const bySymbol = Object.fromEntries(usable.map(a => [a.symbol, a]));
  assetCache = { at: Date.now(), list: usable, bySymbol };
  return assetCache;
}

function symbolsParam(raw) {
  const syms = String(raw || "").toUpperCase().split(",").map(s => s.trim()).filter(Boolean);
  if (!syms.length || syms.length > 50 || !syms.every(s => SYMBOL_RE.test(s))) {
    const e = new Error("Bad stock symbol"); e.status = 400; throw e;
  }
  return syms;
}

const RANGES = {
  "1M": { days: 31, tf: "1Day" },
  "6M": { days: 183, tf: "1Day" },
  "1Y": { days: 366, tf: "1Day" },
  "5Y": { days: 5 * 366, tf: "1Week" },
};

async function handle(req) {
  const q = req.query || {};
  const action = q.action;

  switch (action) {
    case "ping":
      return { ok: true };

    case "fx": {
      const { rate, date } = await usdToEur();
      return { rate, date };
    }

    case "clock":
      return call(TRADE, "/v2/clock");

    case "account":
      return call(TRADE, "/v2/account");

    case "positions":
      return call(TRADE, "/v2/positions");

    case "orders":
      return call(TRADE, "/v2/orders?status=all&limit=15&direction=desc");

    case "search": {
      const term = String(q.q || "").trim().toLowerCase();
      if (term.length < 1) return [];
      const { list } = await assets();
      const scored = [];
      for (const a of list) {
        const sym = a.symbol.toLowerCase(), name = a.name.toLowerCase();
        let s = 0;
        if (sym === term) s = 100;
        else if (name === term) s = 90;
        else if (name.startsWith(term)) s = 70;
        else if (sym.startsWith(term)) s = 50;
        else if (name.includes(" " + term)) s = 30;
        if (s) scored.push([s - a.name.length / 100, a]);
      }
      return scored.sort((x, y) => y[0] - x[0]).slice(0, 8).map(x => x[1]);
    }

    case "quotes": {
      const syms = symbolsParam(q.symbols);
      const [snap, { bySymbol }] = await Promise.all([
        call(DATA, `/v2/stocks/snapshots?symbols=${syms.join(",")}&feed=iex`),
        assets(),
      ]);
      return syms.map(sym => {
        const s = snap[sym] || {};
        const price = s.latestTrade?.p ?? s.dailyBar?.c ?? null;
        const prev = s.prevDailyBar?.c ?? null;
        return {
          symbol: sym,
          name: bySymbol[sym]?.name || sym,
          price,
          prevClose: prev,
          change: price != null && prev ? price - prev : null,
          changePct: price != null && prev ? ((price - prev) / prev) * 100 : null,
        };
      });
    }

    case "bars": {
      const [sym] = symbolsParam(q.symbol);
      const r = RANGES[q.range] || RANGES["1Y"];
      const start = new Date(Date.now() - r.days * 864e5).toISOString().slice(0, 10);
      const data = await call(DATA, `/v2/stocks/${sym}/bars?timeframe=${r.tf}&start=${start}&feed=iex&limit=10000&adjustment=split`);
      return (data.bars || []).map(b => ({ t: b.t, c: b.c }));
    }

    case "order": {
      if (req.method !== "POST") { const e = new Error("Use POST"); e.status = 405; throw e; }
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const [sym] = symbolsParam(body.symbol);
      if (body.side === "sell_all") {
        return call(TRADE, `/v2/positions/${sym}`, { method: "DELETE" });
      }
      if (!["buy", "sell"].includes(body.side)) { const e = new Error("Bad side"); e.status = 400; throw e; }
      const dollars = Math.round(Number(body.dollars) * 100) / 100;
      if (!(dollars >= 1 && dollars <= 100000)) { const e = new Error("Amount must be between $1 and $100,000"); e.status = 400; throw e; }
      return call(TRADE, "/v2/orders", {
        method: "POST",
        body: JSON.stringify({ symbol: sym, side: body.side, type: "market", time_in_force: "day", notional: dollars.toFixed(2) }),
      });
    }

    default: {
      const e = new Error("Unknown action"); e.status = 400; throw e;
    }
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!process.env.ALPACA_KEY_ID || !process.env.ALPACA_SECRET_KEY) {
    res.status(503).json({ error: "not_configured" });
    return;
  }
  const pass = process.env.APP_PASSCODE;
  if (pass && req.headers["x-app-passcode"] !== pass) {
    res.status(401).json({ error: "passcode" });
    return;
  }
  try {
    res.status(200).json(await handle(req));
  } catch (e) {
    res.status(e.status && e.status < 600 ? e.status : 500).json({ error: e.message || "Something went wrong" });
  }
};
