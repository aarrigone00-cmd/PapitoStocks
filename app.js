/* Le mie azioni / My Stocks — a simple, large-print stock app backed by an Alpaca paper (practice) account.
   Italian by default, with an English switch. Prices in US dollars with an approximate euro amount. */
"use strict";

// ---------- storage ----------
function store(key, val) {
  try {
    if (val === undefined) return JSON.parse(localStorage.getItem("ms_" + key));
    localStorage.setItem("ms_" + key, JSON.stringify(val));
  } catch { return undefined; }
}

// ---------- language ----------
let LANG = store("lang") || "it";
const LOC = () => (LANG === "it" ? "it-IT" : "en-US");

const TEXT = {
  it: {
    appTitle: "Le mie azioni",
    demo: "Stai vedendo <strong>numeri di esempio</strong>. I prezzi veri appaiono quando l'app è configurata.",
    tabHome: "Home", tabStocks: "Azioni", tabHistory: "Storico", tabLearn: "Impara", tabSettings: "Impostazioni",
    open: "🟢 Borsa USA aperta", closed: "🔴 Borsa USA chiusa",
    morning: "Buongiorno", afternoon: "Buon pomeriggio", evening: "Buonasera",
    worth: "Il tuo conto di prova vale",
    cash: "Contanti disponibili",
    practice: "🧪 Questi sono <b>soldi finti</b>, per fare pratica. Qui non si usano soldi veri.",
    closedNote: t => `La Borsa americana ora è chiusa. Riapre alle <b>${t}</b> (ora locale), dal lunedì al venerdì.`,
    own: "Cosa possiedi", shares: "azioni",
    noneOwned: "Non possiedi ancora nessuna azione.",
    noneOwnedHint: "Tocca <b>Azioni</b> qui sotto per cercarne una e provare un acquisto di prova.",
    lookup: "🔎 Cerca un'azione",
    upBy: "▲ In rialzo di", downBy: "▼ In calo di", today: "oggi", sinceBought: "da quando hai comprato",
    noChange: "● Nessuna variazione oggi", noInfo: "Dati non disponibili",
    searchTitle: "Cerca un'azione", searchPh: "Scrivi un'azienda, per esempio Ferrari",
    searchHint: "Si trovano le aziende quotate negli Stati Uniti, anche alcune italiane: Ferrari, Stellantis, Eni.",
    notFound: q => `Nessun risultato per “${q}”. Prova a scriverlo in un altro modo.`,
    watching: "Azioni che seguo",
    noWatch: "Non stai seguendo nessuna azione. Cercane una qui sopra e tocca “Segui questa azione”.",
    perShare: "per azione", oneShare: "prezzo di una azione", symbol: "Simbolo",
    loading: "Caricamento…", starting: "Avvio…", loadingPrices: "Caricamento prezzi…", drawing: "Disegno il grafico…",
    noChart: "Nessun grafico disponibile per questo periodo.",
    ranges: { "1M": "1 mese", "6M": "6 mesi", "1Y": "1 anno", "5Y": "5 anni" },
    chartSentence: (r, name, a, b, up, p) => {
      const when = { "1M": "Nell'ultimo mese", "6M": "Negli ultimi 6 mesi", "1Y": "Nell'ultimo anno", "5Y": "Negli ultimi 5 anni" }[r];
      return `${when}, ${name} è passata da <b>${a}</b> a <b>${b}</b>: ` +
        (up ? `<b style="color:var(--up)">in rialzo del ${p}</b>.` : `<b style="color:var(--down)">in calo del ${p}</b>.`);
    },
    todayLabel: "Oggi", low: "Minimo", high: "Massimo",
    youOwn: "Ne possiedi", sharesCap: "Azioni", worthNow: "Valore attuale",
    gained: "Guadagnato dall'acquisto", lost: "Perso dall'acquisto",
    buy: "Compra", sell: "Vendi", watch: "☆ Segui questa azione", unwatch: "★ Smetti di seguire",
    practiceOnly: "Comprare e vendere qui usa solo soldi finti.",
    back: "‹ Indietro",
    pricePerShare: "Prezzo per azione", cashHave: "Soldi di prova disponibili", sharesWorth: "Le tue azioni valgono",
    howMuchBuy: "Quanti dollari vuoi spendere?", howMuchSell: "Quanti dollari vuoi vendere?",
    sellAll: "Vendi tutto", typeAmount: "Oppure scrivi un importo (in dollari):", amountPh: "Importo in $",
    tooMuchBuy: m => `È più dei tuoi soldi di prova (${m}).`, tooMuchSell: m => `È più di quanto possiedi (${m}).`,
    atLeast: "Inserisci almeno 1 $.",
    about: n => `Sono circa <b>${n} azioni</b>.`,
    next: "Avanti",
    check: "Controlla bene:",
    aboutTo: (buy, what, name) => `Stai per <b>${buy ? "COMPRARE" : "VENDERE"} ${what}</b> di <b>${name}</b> con soldi di prova.`,
    allShares: m => `TUTTE le tue azioni (circa ${m})`,
    closedOrder: t => `La Borsa è chiusa, quindi l'ordine verrà eseguito alla prossima apertura (alle ${t} ora locale, nei giorni feriali). Il prezzo finale potrebbe essere un po' diverso.`,
    yesBuy: "Sì, compra", yesSell: "Sì, vendi", noBack: "No, torna indietro", sending: "Invio…",
    done: "✅ Fatto!",
    sent: (buy, name) => `Il tuo ordine di prova per ${buy ? "comprare" : "vendere"} ${name} è stato inviato.`,
    soon: "Di solito si completa in pochi secondi.", whenOpen: "Verrà completato all'apertura della Borsa.",
    goHome: "Vai alla Home", seeHistory: "Vedi lo storico",
    failed: "L'ordine non è andato a buon fine", tryAgain: "Riprova",
    historyTitle: "Le mie operazioni di prova", bought: "Comprato", sold: "Venduto",
    amount: "Importo", allSharesShort: "Tutte le azioni", when: "Quando", status: "Stato",
    statuses: { filled: "✅ Completato", new: "⏳ In attesa dell'apertura", accepted: "⏳ In attesa dell'apertura", pending_new: "⏳ Invio in corso",
      partially_filled: "⏳ Parzialmente eseguito", canceled: "✖ Annullato", expired: "✖ Scaduto", rejected: "✖ Non accettato" },
    noHistory: "Ancora nessuna operazione. Quando compri o vendi, la trovi qui.",
    errTitle: "Non è stato possibile caricare", errBody: "Controlla la connessione a internet e riprova.",
    passTitle: "Serve il codice", passBody: "Inserisci il codice dell'app in <a href=\"#settings\">Impostazioni</a>.",
    learnTitle: "Le basi", habitsTitle: "Buone abitudini", scamsTitle: "⚠️ Attenzione alle truffe",
    disclaimer: "Questa app serve per imparare e non è un consiglio finanziario.",
    lessons: (o, c) => [
      ["Che cos'è un'azione?", "Un'azione è un piccolo pezzo di proprietà di un'azienda. Se possiedi azioni Ferrari, possiedi una minuscola parte di Ferrari. Quando l'azienda va bene il prezzo di solito sale, quando va male di solito scende."],
      ["Cosa vuol dire “In rialzo dell'1,2% oggi”?", "Confronta il prezzo di oggi con il prezzo di chiusura di ieri. Se un'azione da 100 $ sale dell'1,2%, ora costa circa 101,20 $. I piccoli movimenti giornalieri sono normali."],
      ["Perché i prezzi sono in dollari?", "Le azioni americane si comprano e vendono in dollari. L'app mostra anche il valore approssimativo in euro. Attenzione: se cambia il cambio euro/dollaro, il valore in euro cambia anche se il prezzo in dollari resta uguale."],
      ["Quando è aperta la Borsa americana?", `Dal lunedì al venerdì, dalle ${o} alle ${c} ora locale (9:30–16:00 a New York), festivi americani esclusi. Gli ordini fatti a Borsa chiusa aspettano l'apertura.`],
      ["Che cos'è “il mercato”?", "Di solito si intende l'S&P 500, un elenco di 500 grandi aziende americane. Il fondo SPY le contiene tutte insieme, quindi il suo prezzo mostra come va il mercato nel complesso."],
      ["Che cos'è un ETF o fondo indice?", "Un unico prodotto che contiene tante azioni insieme. Comprandolo dividi i soldi su molte aziende, così se una va male fa meno danno."],
      ["Che cos'è un dividendo?", "Alcune aziende pagano ogni tanto un po' di soldi a chi possiede le loro azioni. Coca-Cola ed Eni sono note per i dividendi."],
      ["Posso comprare un pezzo di azione?", "Sì. In questa app scegli un importo, per esempio 100 $, e ricevi la parte di azione corrispondente, anche se un'azione intera costa di più."],
      ["Perché soldi finti?", "Questo conto usa soldi immaginari a prezzi veri. È un modo sicuro per imparare come funziona comprare e vendere, senza nessun rischio."],
    ],
    habits: [
      "Non investire in azioni soldi che ti servono nei prossimi anni.",
      "Dividere i soldi su molte aziende (o su un fondo indice) è più sicuro che puntare su una sola.",
      "I prezzi salgono e scendono ogni giorno. Ci sono sempre stati grandi cali: conta più la pazienza che il tempismo.",
      "Prima di investire risparmi veri, parla con un consulente finanziario abilitato e di fiducia.",
    ],
    scams: [
      "Nessuno di serio ti telefonerà o scriverà con una “dritta sicura” su un'azione.",
      "Non pagare mai per “sbloccare” o “prelevare” dei guadagni: è sempre una truffa.",
      "Diffida di chi ti mette fretta, ti chiede carte regalo o criptovalute, o ti chiede di installare un'app sul telefono.",
      "La Consob pubblica l'elenco dei siti di investimento abusivi: si trova su consob.it.",
      "Se hai dubbi, riattacca e chiama prima un familiare.",
    ],
    language: "Lingua", textSize: "Dimensione del testo", sizes: ["Normale", "Più grande", "Grandissimo"],
    colors: "Colori", colorOpts: ["Normali", "Alto contrasto"],
    passcode: "Codice dell'app", passHint: "Serve solo se chi ha configurato l'app te ne ha dato uno.",
    passPh: "Codice", savePass: "Salva codice", saved: "Salvato ✓",
    homeScreen: "Aggiungi alla schermata Home",
    android: "<b>Telefono Android (Chrome):</b> tocca il menu ⋮ in alto a destra, poi <b>Aggiungi a schermata Home</b>.",
    windows: "<b>Computer Windows (Edge o Chrome):</b> clicca sul menu ⋯, poi <b>App → Installa questo sito come app</b>, oppure aggiungilo ai preferiti.",
    watchList: "Elenco azioni seguite", resetWatch: "Ripristina l'elenco iniziale", doneShort: "Fatto ✓",
    demoMode: "Stai usando numeri di esempio.", liveMode: "Collegato a un conto di prova Alpaca.",
    fxNote: (r, d) => `Cambio usato per gli euro: 1 $ = ${r} € (Banca Centrale Europea${d ? ", " + d : ""}).`,
  },
  en: {
    appTitle: "My Stocks",
    demo: "Showing <strong>sample numbers</strong>. Real prices appear once the app is set up.",
    tabHome: "Home", tabStocks: "Stocks", tabHistory: "History", tabLearn: "Learn", tabSettings: "Settings",
    open: "🟢 US market open", closed: "🔴 US market closed",
    morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening",
    worth: "Your practice account is worth",
    cash: "Cash ready to use",
    practice: "🧪 This is <b>practice money</b>. Nothing here uses real dollars.",
    closedNote: t => `The US market is closed right now. It opens again at <b>${t}</b> (your local time), Monday–Friday.`,
    own: "What you own", shares: "shares",
    noneOwned: "You don't own any stocks yet.",
    noneOwnedHint: "Tap <b>Stocks</b> below to look one up and try a practice purchase.",
    lookup: "🔎 Look up a stock",
    upBy: "▲ Up", downBy: "▼ Down", today: "today", sinceBought: "since you bought",
    noChange: "● No change today", noInfo: "No change info",
    searchTitle: "Look up a stock", searchPh: "Type a company, like Ferrari",
    searchHint: "You can find companies listed in the US, including some Italian ones: Ferrari, Stellantis, Eni.",
    notFound: q => `Nothing found for “${q}”. Try a different spelling.`,
    watching: "Stocks I'm watching",
    noWatch: "You're not watching any stocks. Look one up above and tap “Watch this stock”.",
    perShare: "per share", oneShare: "price for one share", symbol: "Symbol",
    loading: "Loading…", starting: "Starting up…", loadingPrices: "Loading prices…", drawing: "Drawing chart…",
    noChart: "No chart available for this time.",
    ranges: { "1M": "1 month", "6M": "6 months", "1Y": "1 year", "5Y": "5 years" },
    chartSentence: (r, name, a, b, up, p) => {
      const when = { "1M": "Over the past month", "6M": "Over the past 6 months", "1Y": "Over the past year", "5Y": "Over the past 5 years" }[r];
      return `${when}, ${name} went from <b>${a}</b> to <b>${b}</b>: ` +
        (up ? `<b style="color:var(--up)">up ${p}</b>.` : `<b style="color:var(--down)">down ${p}</b>.`);
    },
    todayLabel: "Today", low: "Lowest", high: "Highest",
    youOwn: "You own this", sharesCap: "Shares", worthNow: "Worth now",
    gained: "Gained since buying", lost: "Lost since buying",
    buy: "Buy", sell: "Sell", watch: "☆ Watch this stock", unwatch: "★ Stop watching",
    practiceOnly: "Buying and selling here uses practice money only.",
    back: "‹ Back",
    pricePerShare: "Price per share", cashHave: "Practice cash you have", sharesWorth: "Your shares are worth",
    howMuchBuy: "How many dollars do you want to spend?", howMuchSell: "How many dollars do you want to sell?",
    sellAll: "Sell everything", typeAmount: "Or type an amount (in dollars):", amountPh: "$ amount",
    tooMuchBuy: m => `That's more than your practice cash (${m}).`, tooMuchSell: m => `That's more than you own (${m}).`,
    atLeast: "Please enter at least $1.",
    about: n => `That's about <b>${n} shares</b>.`,
    next: "Next",
    check: "Please check:",
    aboutTo: (buy, what, name) => `You're about to <b>${buy ? "BUY" : "SELL"} ${what}</b> of <b>${name}</b> with practice money.`,
    allShares: m => `ALL your shares (about ${m})`,
    closedOrder: t => `The market is closed now, so this will go through when it opens next (${t} your local time, on a weekday). The final price may be a little different.`,
    yesBuy: "Yes, buy it", yesSell: "Yes, sell it", noBack: "No, go back", sending: "Sending…",
    done: "✅ Done!",
    sent: (buy, name) => `Your practice order to ${buy ? "buy" : "sell"} ${name} was sent.`,
    soon: "It usually completes within a few seconds.", whenOpen: "It will complete when the market opens.",
    goHome: "Go to Home", seeHistory: "See my history",
    failed: "That didn't go through", tryAgain: "Try again",
    historyTitle: "My practice trades", bought: "Bought", sold: "Sold",
    amount: "Amount", allSharesShort: "All shares", when: "When", status: "Status",
    statuses: { filled: "✅ Completed", new: "⏳ Waiting for market", accepted: "⏳ Waiting for market", pending_new: "⏳ Sending",
      partially_filled: "⏳ Partly done", canceled: "✖ Cancelled", expired: "✖ Expired", rejected: "✖ Not accepted" },
    noHistory: "No trades yet. When you buy or sell, it shows up here.",
    errTitle: "Couldn't load that", errBody: "Please check the internet connection and try again.",
    passTitle: "Passcode needed", passBody: "Please enter the app passcode in <a href=\"#settings\">Settings</a>.",
    learnTitle: "Learn the basics", habitsTitle: "Good habits", scamsTitle: "⚠️ Watch out for scams",
    disclaimer: "This app is for learning and is not financial advice.",
    lessons: (o, c) => [
      ["What is a stock?", "A stock is a small piece of ownership in a company. If you own Ferrari stock, you own a tiny slice of Ferrari. When the company does well, the price usually goes up; when it struggles, it usually goes down."],
      ["What does “Up 1.2% today” mean?", "It compares today's price with yesterday's closing price. If a $100 stock is up 1.2%, it now costs about $101.20. Small daily ups and downs are normal."],
      ["Why are prices in dollars?", "US stocks are bought and sold in dollars. The app also shows the approximate value in euros. Note: if the euro/dollar rate moves, the euro value changes even when the dollar price stays the same."],
      ["When is the US market open?", `Monday to Friday, ${o} to ${c} your local time (9:30 am–4:00 pm in New York), except US holidays. Orders placed when it's closed wait until it opens.`],
      ["What is “the market”?", "People often mean the S&P 500, a list of 500 large US companies. The fund called SPY holds all of them at once, so its price shows how the market as a whole is doing."],
      ["What is an ETF or index fund?", "A single thing you can buy that holds many stocks at once. It spreads your money across lots of companies, so one bad company hurts less."],
      ["What is a dividend?", "Some companies pay owners a bit of cash every so often, just for holding the stock. Coca-Cola and Eni are known for dividends."],
      ["Can I buy part of a share?", "Yes. In this app you choose a dollar amount, like $100, and you get however much of a share that buys, even if one share costs more."],
      ["Why practice money?", "This account uses pretend money at real prices. It's a safe way to learn how buying and selling works, with no risk at all."],
    ],
    habits: [
      "Don't put money in stocks that you'll need in the next few years.",
      "Spreading money across many companies (or one index fund) is safer than betting on one.",
      "Prices go up and down every day. Big drops have always happened; patience usually matters more than timing.",
      "Talk to a trusted, licensed financial advisor before investing real savings.",
    ],
    scams: [
      "Nobody legitimate will call, text, or message you with a “sure thing” stock tip.",
      "Never pay to “unlock” or “withdraw” profits. That's always a scam.",
      "Be wary of anyone who rushes you, asks for gift cards or crypto, or asks you to install an app on your phone.",
      "Italy's regulator Consob publishes a list of illegal investment websites at consob.it.",
      "If you're unsure, hang up and call a family member first.",
    ],
    language: "Language", textSize: "Text size", sizes: ["Normal", "Larger", "Largest"],
    colors: "Colors", colorOpts: ["Regular", "High contrast"],
    passcode: "App passcode", passHint: "Only needed if the person who set this up gave you one.",
    passPh: "Passcode", savePass: "Save passcode", saved: "Saved ✓",
    homeScreen: "Add to your home screen",
    android: "<b>Android phone (Chrome):</b> tap the ⋮ menu at the top right, then <b>Add to Home screen</b>.",
    windows: "<b>Windows computer (Edge or Chrome):</b> click the ⋯ menu, then <b>Apps → Install this site as an app</b>, or just bookmark it.",
    watchList: "Watch list", resetWatch: "Reset watch list to the starting stocks", doneShort: "Done ✓",
    demoMode: "Running with sample numbers.", liveMode: "Connected to an Alpaca practice account.",
    fxNote: (r, d) => `Exchange rate used for euros: $1 = €${r} (European Central Bank${d ? ", " + d : ""}).`,
  },
};
const T = () => TEXT[LANG];

// ---------- small helpers ----------
const $ = sel => document.querySelector(sel);
const view = $("#view");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function applyLang() {
  document.documentElement.lang = LANG;
  document.title = T().appTitle;
  $("#title").textContent = T().appTitle;
  $("#demo-banner").innerHTML = T().demo;
  document.querySelectorAll("[data-t]").forEach(el => { el.textContent = T()[el.dataset.t]; });
}

const fmtCur = (n, cur, digits = 2) => n == null || isNaN(n) ? "—" :
  new Intl.NumberFormat(LOC(), { style: "currency", currency: cur, currencyDisplay: "narrowSymbol", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
const money = (n, d = 2) => fmtCur(n, "USD", d);

let FX = store("fx"); // { rate, date }
const eur = (n, d = 2) => FX && FX.rate && n != null && !isNaN(n) ? "≈ " + fmtCur(n * FX.rate, "EUR", d) : "";
const eurSmall = n => { const e = eur(n); return e ? `<div class="eur">${e}</div>` : ""; };
const moneyBoth = n => { const e = eur(n); return money(n) + (e ? ` <span class="eur-inline">(${e})</span>` : ""); };

const num = (n, max = 4) => Number(n).toLocaleString(LOC(), { maximumFractionDigits: max });
const pct = n => n == null || isNaN(n) ? "—" : Math.abs(n).toLocaleString(LOC(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

// Convert a New York clock time (e.g. 9:30) into the viewer's local time, e.g. 15:30 in Italy.
function nyToLocal(h, m) {
  const now = new Date();
  const ny = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "numeric", hourCycle: "h23" })
    .formatToParts(now).reduce((o, p) => (o[p.type] = p.value, o), {});
  let diff = (now.getHours() * 60 + now.getMinutes()) - (+ny.hour * 60 + +ny.minute);
  if (diff > 720) diff -= 1440;
  if (diff <= -720) diff += 1440;
  const mins = ((h * 60 + m + diff) % 1440 + 1440) % 1440;
  return new Date(2000, 0, 1, Math.floor(mins / 60), mins % 60).toLocaleTimeString(LOC(), { hour: "numeric", minute: "2-digit" });
}
const openTime = () => nyToLocal(9, 30);
const closeTime = () => nyToLocal(16, 0);

function changeBadge(chg, chgPct, words) {
  words = words || T().today;
  if (chg == null || isNaN(chg)) return `<span class="change flat">${T().noInfo}</span>`;
  if (Math.abs(chg) < 0.005) return `<span class="change flat">${T().noChange}</span>`;
  const up = chg > 0;
  return `<span class="change ${up ? "up" : "down"}">${up ? T().upBy : T().downBy} ${money(Math.abs(chg))}` +
    (chgPct != null ? ` (${pct(chgPct)})` : "") + ` ${words}</span>`;
}

// ---------- settings ----------
const DEFAULT_WATCH = ["RACE", "AAPL", "MSFT", "KO", "SPY"];
let watchlist = store("watch") || DEFAULT_WATCH.slice();
const saveWatch = () => store("watch", watchlist);

function applyLook() {
  document.documentElement.dataset.size = store("size") || "normal";
  document.documentElement.dataset.contrast = store("contrast") || "normal";
}
applyLook();
applyLang();

// ---------- data layer (real server or sample data) ----------
let DEMO = false;

const api = {
  async get(action, params = {}) {
    if (DEMO) return demo.get(action, params);
    return request("api/alpaca?" + new URLSearchParams({ action, ...params }), { method: "GET" });
  },
  async post(action, body) {
    if (DEMO) return demo.post(action, body);
    return request("api/alpaca?action=" + action, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
  },
};

async function request(url, opts) {
  const pass = store("passcode");
  opts.headers = { ...(opts.headers || {}), ...(pass ? { "x-app-passcode": pass } : {}) };
  const r = await fetch(url, opts);
  let body = {};
  try { body = await r.json(); } catch { /* ignore */ }
  if (!r.ok) {
    const e = new Error(body.error || "error");
    e.code = body.error; e.status = r.status;
    throw e;
  }
  return body;
}

async function detectMode() {
  try {
    await request("api/alpaca?action=ping", { method: "GET" });
    DEMO = false;
  } catch (e) {
    DEMO = e.code !== "passcode";
  }
  $("#demo-banner").hidden = !DEMO;
}

async function refreshFx() {
  try {
    const fx = await api.get("fx");
    if (fx && fx.rate) { FX = fx; store("fx", fx); }
  } catch { /* keep last known rate */ }
}

// Sample data so the app can be tried before Alpaca is connected.
const demo = (() => {
  const info = {
    RACE: ["Ferrari", 445.2], AAPL: ["Apple", 231.4], MSFT: ["Microsoft", 418.2], KO: ["Coca-Cola", 63.1],
    SPY: ["SPDR S&P 500 ETF", 589.3], STLA: ["Stellantis", 13.2], E: ["Eni", 29.8], JNJ: ["Johnson & Johnson", 158.7],
    GOOGL: ["Alphabet (Google)", 172.5], AMZN: ["Amazon", 201.3], NVDA: ["NVIDIA", 141.9],
  };
  const seed = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return () => ((h = (h * 1103515245 + 12345) >>> 0) / 2 ** 32); };
  let cash = 10000;
  const pos = { RACE: { qty: 1.5, cost: 380 }, KO: { qty: 15, cost: 58.2 } };
  const orders = [];
  const quote = sym => {
    const [name, price] = info[sym] || [sym, 50];
    const prev = price * (1 + (seed(sym + "q")() - 0.5) * 0.04);
    return { symbol: sym, name, price, prevClose: prev, change: price - prev, changePct: (price - prev) / prev * 100 };
  };
  const positions = () => Object.entries(pos).map(([s, p]) => {
    const q = quote(s);
    return { symbol: s, qty: String(p.qty), avg_entry_price: String(p.cost), market_value: String(p.qty * q.price),
      unrealized_pl: String(p.qty * (q.price - p.cost)), lastday_price: String(q.prevClose) };
  });
  return {
    async get(action, p) {
      await new Promise(r => setTimeout(r, 120));
      if (action === "fx") return { rate: 0.92, date: "" };
      if (action === "clock") {
        const now = new Date(), d = now.getUTCDay(), h = now.getUTCHours() + now.getUTCMinutes() / 60;
        return { is_open: d > 0 && d < 6 && h >= 14.5 && h < 21 };
      }
      if (action === "account") {
        const value = positions().reduce((s, x) => s + +x.market_value, 0);
        const last = positions().reduce((s, x) => s + x.qty * x.lastday_price, 0);
        return { equity: String(cash + value), last_equity: String(cash + last), cash: String(cash) };
      }
      if (action === "positions") return positions();
      if (action === "orders") return orders.slice().reverse();
      if (action === "quotes") return p.symbols.split(",").map(quote);
      if (action === "search") {
        const t = p.q.toLowerCase();
        return Object.entries(info).filter(([s, [n]]) => s.toLowerCase().startsWith(t) || n.toLowerCase().includes(t))
          .map(([symbol, [name]]) => ({ symbol, name }));
      }
      if (action === "bars") {
        const n = { "1M": 22, "6M": 126, "1Y": 252, "5Y": 260 }[p.range] || 252;
        const days = { "1M": 31, "6M": 183, "1Y": 366, "5Y": 1830 }[p.range] || 366;
        const rnd = seed(p.symbol + p.range), out = [];
        let v = quote(p.symbol).price;
        for (let i = 0; i < n; i++) { out.push(v); v = v / (1 + (rnd() - 0.48) * (p.range === "5Y" ? 0.05 : 0.025)); }
        return out.reverse().map((c, i) => ({ t: new Date(Date.now() - (n - i) / n * days * 864e5).toISOString(), c }));
      }
      throw new Error("Unknown");
    },
    async post(action, b) {
      await new Promise(r => setTimeout(r, 300));
      const q = quote(b.symbol);
      let dollars = +b.dollars, side = b.side;
      if (side === "sell_all") { dollars = (pos[b.symbol]?.qty || 0) * q.price; side = "sell"; }
      const qty = dollars / q.price;
      if (side === "buy") {
        if (dollars > cash) throw new Error("Not enough practice cash");
        cash -= dollars;
        const p = pos[b.symbol] || { qty: 0, cost: 0 };
        p.cost = (p.cost * p.qty + dollars) / (p.qty + qty); p.qty += qty; pos[b.symbol] = p;
      } else {
        const p = pos[b.symbol];
        if (!p || p.qty * q.price + 0.01 < dollars) throw new Error("Not enough shares");
        p.qty -= qty; cash += dollars; if (p.qty < 1e-6) delete pos[b.symbol];
      }
      const o = { symbol: b.symbol, side, notional: dollars.toFixed(2), status: "filled", filled_avg_price: String(q.price),
        filled_qty: String(qty), submitted_at: new Date().toISOString() };
      orders.push(o);
      return o;
    },
  };
})();

// Names cache so we can show "Ferrari" not "RACE"
const names = store("names") || {};
const rememberNames = list => { list.forEach(x => { if (x.name) names[x.symbol] = x.name; }); store("names", names); };
const nameOf = sym => names[sym] || sym;

// ---------- market status pill ----------
async function refreshMarket() {
  try {
    const c = await api.get("clock");
    $("#market").textContent = c.is_open ? T().open : T().closed;
    return c;
  } catch { $("#market").textContent = ""; return null; }
}

// ---------- screens ----------
function loading(msg) { view.innerHTML = `<div class="spinner">${esc(msg || T().loading)}</div>`; }
function errorBox(e) {
  if (e && e.code === "passcode") return `<div class="card err"><h3>${T().passTitle}</h3><p>${T().passBody}</p></div>`;
  const detail = e && e.message && e.message !== "error" && e.message !== "Failed to fetch" ? `<p class="small muted">${esc(e.message)}</p>` : "";
  return `<div class="card err"><h3>${T().errTitle}</h3><p>${T().errBody}</p>${detail}
    <button class="btn secondary" onclick="route()">${T().tryAgain}</button></div>`;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? T().morning : h < 17 ? T().afternoon : T().evening;
}

async function screenHome() {
  loading();
  try {
    const [acct, positions, clock] = await Promise.all([api.get("account"), api.get("positions"), refreshMarket()]);
    const equity = +acct.equity, dayChg = equity - +acct.last_equity;
    const dayPct = +acct.last_equity ? dayChg / +acct.last_equity * 100 : 0;
    const held = positions.map(p => ({ ...p, qty: +p.qty, mv: +p.market_value, pl: +p.unrealized_pl }));
    const missing = held.map(p => p.symbol).filter(s => !names[s]);
    if (missing.length) rememberNames(await api.get("quotes", { symbols: missing.join(",") }).catch(() => []));

    view.innerHTML = `
      <h2>${greeting()}!</h2>
      <div class="card hero">
        <div class="muted">${T().worth}</div>
        <div class="big">${money(equity)}</div>
        ${eurSmall(equity)}
        <div style="margin-top:.4rem">${changeBadge(dayChg, dayPct)}</div>
        <p class="small muted" style="margin-top:.7rem">${T().cash}: <b>${moneyBoth(+acct.cash)}</b></p>
      </div>
      <div class="card notice small">${T().practice}
        ${clock && !clock.is_open ? "<br>" + T().closedNote(openTime()) : ""}</div>

      <h2>${T().own}</h2>
      ${held.length ? held.map(p => `
        <div class="card"><a class="stock" href="#stock/${esc(p.symbol)}">
          <div><div class="name">${esc(nameOf(p.symbol))}</div>
            <div class="sym">${esc(p.symbol)} · ${num(p.qty)} ${T().shares}</div>
            <div style="margin-top:.3rem">${changeBadge(p.pl, +p.avg_entry_price ? p.pl / (p.qty * +p.avg_entry_price) * 100 : null, T().sinceBought)}</div></div>
          <div class="right"><div class="price">${money(p.mv)}</div>${eurSmall(p.mv)}<div class="chev">›</div></div>
        </a></div>`).join("")
        : `<div class="card"><p>${T().noneOwned}</p><p class="muted">${T().noneOwnedHint}</p></div>`}

      <a class="btn" href="#stocks">${T().lookup}</a>`;
  } catch (e) { view.innerHTML = errorBox(e); }
}

async function screenStocks() {
  view.innerHTML = `
    <h2>${T().searchTitle}</h2>
    <input id="q" type="search" placeholder="${esc(T().searchPh)}" autocomplete="off" aria-label="${esc(T().searchTitle)}">
    <p class="small muted">${T().searchHint}</p>
    <div id="results"></div>
    <h2>${T().watching}</h2>
    <div id="watch"><div class="spinner">${T().loadingPrices}</div></div>`;

  let timer;
  $("#q").addEventListener("input", e => {
    clearTimeout(timer);
    const term = e.target.value.trim();
    if (!term) { $("#results").innerHTML = ""; return; }
    timer = setTimeout(async () => {
      try {
        const res = await api.get("search", { q: term });
        rememberNames(res);
        $("#results").innerHTML = res.length ? res.map(a => `
          <div class="card"><a class="stock" href="#stock/${esc(a.symbol)}">
            <div><div class="name">${esc(a.name)}</div><div class="sym">${esc(a.symbol)}</div></div><div class="chev">›</div></a></div>`).join("")
          : `<p class="muted">${T().notFound(esc(term))}</p>`;
      } catch (err) { $("#results").innerHTML = errorBox(err); }
    }, 350);
  });

  if (!watchlist.length) { $("#watch").innerHTML = `<p class="muted">${T().noWatch}</p>`; return; }
  try {
    const qs = await api.get("quotes", { symbols: watchlist.join(",") });
    rememberNames(qs);
    $("#watch").innerHTML = qs.map(q => `
      <div class="card"><a class="stock" href="#stock/${esc(q.symbol)}">
        <div><div class="name">${esc(q.name)}</div><div class="sym">${esc(q.symbol)}</div>
          <div style="margin-top:.3rem">${changeBadge(q.change, q.changePct)}</div></div>
        <div class="right"><div class="price">${money(q.price)}</div>${eurSmall(q.price)}<div class="sym">${T().perShare}</div></div>
      </a></div>`).join("");
  } catch (e) { $("#watch").innerHTML = errorBox(e); }
  refreshMarket();
}

function chartSVG(bars, up) {
  const W = 600, H = 260, P = 6;
  const vals = bars.map(b => b.c);
  const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
  const pts = vals.map((v, i) => [P + i * (W - 2 * P) / Math.max(vals.length - 1, 1), P + (H - 2 * P) * (1 - (v - min) / span)]);
  const line = pts.map(p => p.map(n => n.toFixed(1)).join(",")).join(" ");
  const col = up ? "var(--up)" : "var(--down)";
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <polygon points="${P},${H - P} ${line} ${W - P},${H - P}" fill="${col}" opacity=".12"/>
    <polyline points="${line}" fill="none" stroke="${col}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="7" fill="${col}"/>
  </svg>`;
}

async function screenStock(sym) {
  loading();
  try {
    const [[q], positions] = await Promise.all([api.get("quotes", { symbols: sym }), api.get("positions")]);
    rememberNames([q]);
    const pos = positions.find(p => p.symbol === sym);
    const watching = watchlist.includes(sym);
    const range = store("range") || "1Y";

    view.innerHTML = `
      <a href="javascript:history.back()" class="muted">${T().back}</a>
      <div class="card hero">
        <h2 style="margin:0">${esc(q.name)}</h2>
        <div class="muted small">${T().symbol}: ${esc(sym)}</div>
        <div class="big">${money(q.price)}</div>
        ${eurSmall(q.price)}
        <div class="muted small">${T().oneShare}</div>
        <div style="margin-top:.4rem">${changeBadge(q.change, q.changePct)}</div>
      </div>

      <div class="card">
        <div class="chips range" role="group">
          ${Object.keys(T().ranges).map(r => `<button class="chip" data-range="${r}" aria-pressed="${r === range}">${T().ranges[r]}</button>`).join("")}
        </div>
        <div id="chart"><div class="spinner">${T().drawing}</div></div>
      </div>

      ${pos ? `<div class="card ok"><h3>${T().youOwn}</h3>
        <div class="kv"><span>${T().sharesCap}</span><b>${num(+pos.qty)}</b></div>
        <div class="kv"><span>${T().worthNow}</span><b>${moneyBoth(+pos.market_value)}</b></div>
        <div class="kv"><span>${+pos.unrealized_pl >= 0 ? T().gained : T().lost}</span><b>${moneyBoth(Math.abs(+pos.unrealized_pl))}</b></div>
      </div>` : ""}

      <div class="row">
        <a class="btn buy" href="#trade/${esc(sym)}/buy">${T().buy}</a>
        ${pos ? `<a class="btn sell" href="#trade/${esc(sym)}/sell">${T().sell}</a>` : ""}
      </div>
      <button class="btn secondary" id="watchBtn">${watching ? T().unwatch : T().watch}</button>
      <p class="small muted">${T().practiceOnly}</p>`;

    $("#watchBtn").onclick = () => {
      watchlist = watching ? watchlist.filter(s => s !== sym) : [...watchlist, sym];
      saveWatch(); screenStock(sym);
    };
    const draw = async r => {
      store("range", r);
      view.querySelectorAll("[data-range]").forEach(b => b.setAttribute("aria-pressed", b.dataset.range === r));
      $("#chart").innerHTML = `<div class="spinner">${T().drawing}</div>`;
      try {
        const bars = await api.get("bars", { symbol: sym, range: r });
        if (bars.length < 2) { $("#chart").innerHTML = `<p class="muted">${T().noChart}</p>`; return; }
        const first = bars[0].c, last = q.price ?? bars.at(-1).c, diff = last - first;
        const d = s => new Date(s).toLocaleDateString(LOC(), { month: "short", year: "numeric", ...(r === "1M" ? { day: "numeric" } : {}) });
        $("#chart").innerHTML = chartSVG(bars, diff >= 0) +
          `<div class="chart-labels"><span>${d(bars[0].t)}</span><span>${T().todayLabel}</span></div>
           <p style="margin-top:.7rem">${T().chartSentence(r, esc(q.name), money(first), money(last), diff >= 0, pct(diff / first * 100))}</p>
           <p class="small muted">${T().low}: ${money(Math.min(...bars.map(b => b.c)))} · ${T().high}: ${money(Math.max(...bars.map(b => b.c)))}</p>`;
      } catch (e) { $("#chart").innerHTML = errorBox(e); }
    };
    view.querySelectorAll("[data-range]").forEach(b => b.onclick = () => draw(b.dataset.range));
    draw(range);
  } catch (e) { view.innerHTML = errorBox(e); }
}

async function screenTrade(sym, side) {
  loading();
  try {
    const [[q], acct, positions, clock] = await Promise.all([
      api.get("quotes", { symbols: sym }), api.get("account"), api.get("positions"), api.get("clock")]);
    const pos = positions.find(p => p.symbol === sym);
    const isBuy = side === "buy";
    const max = isBuy ? +acct.cash : (pos ? +pos.market_value : 0);
    let amount = null, sellAll = false;
    const presets = [50, 100, 250, 500, 1000].filter(v => v <= max);

    view.innerHTML = `
      <a href="#stock/${esc(sym)}" class="muted">${T().back}</a>
      <h2>${isBuy ? T().buy : T().sell} ${esc(q.name)}</h2>
      <div class="card"><div class="kv"><span>${T().pricePerShare}</span><b>${moneyBoth(q.price)}</b></div>
        <div class="kv"><span>${isBuy ? T().cashHave : T().sharesWorth}</span><b>${moneyBoth(max)}</b></div></div>
      <div id="step"></div>`;

    const step1 = () => {
      $("#step").innerHTML = `
        <h3>${isBuy ? T().howMuchBuy : T().howMuchSell}</h3>
        <div class="chips">${presets.map(v => `<button class="chip" data-amt="${v}">${money(v, 0)}<span class="eur">${eur(v, 0)}</span></button>`).join("")}
          ${!isBuy ? `<button class="chip" data-all="1">${T().sellAll}</button>` : ""}</div>
        <label for="amt" class="muted small">${T().typeAmount}</label>
        <input id="amt" type="number" inputmode="decimal" min="1" step="1" placeholder="${esc(T().amountPh)}">
        <p id="estimate" class="muted"></p>
        <button class="btn ${isBuy ? "buy" : "sell"}" id="next" disabled>${T().next}</button>`;

      const set = (v, all = false) => {
        sellAll = all; amount = all ? max : v;
        view.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed",
          all ? !!c.dataset.all : (!c.dataset.all && +c.dataset.amt === v)));
        const ok = amount >= 1 && amount <= max + 0.01;
        $("#next").disabled = !ok;
        $("#estimate").innerHTML = !amount ? "" : !ok
          ? `<span style="color:var(--down)">${amount > max ? (isBuy ? T().tooMuchBuy(money(max)) : T().tooMuchSell(money(max))) : T().atLeast}</span>`
          : `${moneyBoth(amount)}. ${T().about(num(amount / q.price))}`;
      };
      view.querySelectorAll(".chip").forEach(c => c.onclick = () => { $("#amt").value = ""; c.dataset.all ? set(max, true) : set(+c.dataset.amt); });
      $("#amt").oninput = e => set(parseFloat(String(e.target.value).replace(",", ".")) || 0);
      $("#next").onclick = step2;
    };

    const step2 = () => {
      const what = sellAll ? T().allShares(moneyBoth(amount)) : moneyBoth(amount);
      $("#step").innerHTML = `
        <div class="card notice">
          <h3>${T().check}</h3>
          <p style="font-size:1.15rem">${T().aboutTo(isBuy, what, esc(q.name))}</p>
          ${clock.is_open ? "" : `<p>${T().closedOrder(openTime())}</p>`}
        </div>
        <button class="btn ${isBuy ? "buy" : "sell"}" id="confirm">${isBuy ? T().yesBuy : T().yesSell}</button>
        <button class="btn secondary" id="back">${T().noBack}</button>`;
      $("#back").onclick = step1;
      $("#confirm").onclick = async () => {
        $("#confirm").disabled = true; $("#confirm").textContent = T().sending;
        try {
          await api.post("order", sellAll ? { symbol: sym, side: "sell_all" } : { symbol: sym, side, dollars: amount });
          $("#step").innerHTML = `
            <div class="card ok"><h3>${T().done}</h3>
              <p>${T().sent(isBuy, esc(q.name))}</p>
              <p class="muted small">${clock.is_open ? T().soon : T().whenOpen}</p></div>
            <a class="btn" href="#home">${T().goHome}</a>
            <a class="btn secondary" href="#history">${T().seeHistory}</a>`;
        } catch (e) {
          $("#step").innerHTML = `<div class="card err"><h3>${T().failed}</h3><p>${esc(e.message)}</p></div>
            <button class="btn secondary" onclick="route()">${T().tryAgain}</button>`;
        }
      };
    };
    step1();
  } catch (e) { view.innerHTML = errorBox(e); }
}

async function screenHistory() {
  loading();
  try {
    const orders = await api.get("orders");
    view.innerHTML = `<h2>${T().historyTitle}</h2>` + (orders.length ? orders.map(o => {
      const amt = o.notional ? +o.notional : (+o.filled_qty || +o.qty || 0) * (+o.filled_avg_price || 0);
      return `<div class="card">
        <h3>${o.side === "buy" ? T().bought : T().sold} ${esc(nameOf(o.symbol))}</h3>
        <div class="kv"><span>${T().amount}</span><b>${amt ? moneyBoth(amt) : T().allSharesShort}</b></div>
        ${o.filled_avg_price ? `<div class="kv"><span>${T().pricePerShare}</span><b>${money(+o.filled_avg_price)}</b></div>` : ""}
        <div class="kv"><span>${T().when}</span><b>${new Date(o.submitted_at).toLocaleString(LOC(), { dateStyle: "medium", timeStyle: "short" })}</b></div>
        <div class="kv"><span>${T().status}</span><b>${T().statuses[o.status] || esc(o.status)}</b></div></div>`;
    }).join("") : `<div class="card"><p>${T().noHistory}</p></div>`);
  } catch (e) { view.innerHTML = errorBox(e); }
}

function screenLearn() {
  view.innerHTML = `<h2>${T().learnTitle}</h2>
    ${T().lessons(openTime(), closeTime()).map(([q, a]) => `<details class="learn"><summary>${esc(q)}</summary><div><p>${esc(a)}</p></div></details>`).join("")}
    <h2>${T().habitsTitle}</h2><div class="card"><ul class="list-plain">${T().habits.map(h => `<li>${esc(h)}</li>`).join("")}</ul></div>
    <h2>${T().scamsTitle}</h2><div class="card notice"><ul class="list-plain">${T().scams.map(h => `<li>${esc(h)}</li>`).join("")}</ul></div>
    <p class="small muted">${T().disclaimer}</p>`;
}

function screenSettings() {
  const size = store("size") || "normal", contrast = store("contrast") || "normal";
  const chip = (attr, v, label, on) => `<button class="chip" data-${attr}="${v}" aria-pressed="${on}">${label}</button>`;
  view.innerHTML = `
    <h2>${T().language} / ${LANG === "it" ? "Language" : "Lingua"}</h2>
    <div class="chips">${chip("lang", "it", "🇮🇹 Italiano", LANG === "it")}${chip("lang", "en", "🇬🇧 English", LANG === "en")}</div>
    <h2>${T().textSize}</h2>
    <div class="chips">${["normal", "large", "huge"].map((v, i) => chip("size", v, T().sizes[i], v === size)).join("")}</div>
    <h2>${T().colors}</h2>
    <div class="chips">${["normal", "high"].map((v, i) => chip("contrast", v, T().colorOpts[i], v === contrast)).join("")}</div>
    <h2>${T().passcode}</h2>
    <p class="muted small">${T().passHint}</p>
    <input id="pass" type="password" value="${esc(store("passcode") || "")}" placeholder="${esc(T().passPh)}" autocomplete="off">
    <button class="btn" id="savePass">${T().savePass}</button>
    <h2>${T().homeScreen}</h2>
    <div class="card small"><p>${T().android}</p><p>${T().windows}</p></div>
    <h2>${T().watchList}</h2>
    <button class="btn secondary" id="resetWatch">${T().resetWatch}</button>
    <p class="small muted">${DEMO ? T().demoMode : T().liveMode}
      ${FX && FX.rate ? "<br>" + T().fxNote(FX.rate.toLocaleString(LOC(), { maximumFractionDigits: 4 }), FX.date) : ""}</p>`;

  view.querySelectorAll("[data-lang]").forEach(b => b.onclick = () => { LANG = b.dataset.lang; store("lang", LANG); applyLang(); refreshMarket(); screenSettings(); });
  view.querySelectorAll("[data-size]").forEach(b => b.onclick = () => { store("size", b.dataset.size); applyLook(); screenSettings(); });
  view.querySelectorAll("[data-contrast]").forEach(b => b.onclick = () => { store("contrast", b.dataset.contrast); applyLook(); screenSettings(); });
  $("#savePass").onclick = async () => { store("passcode", $("#pass").value.trim()); await detectMode(); $("#savePass").textContent = T().saved; };
  $("#resetWatch").onclick = () => { watchlist = DEFAULT_WATCH.slice(); saveWatch(); $("#resetWatch").textContent = T().doneShort; };
}

// ---------- router ----------
function route() {
  const [tab, a, b] = (location.hash.slice(1) || "home").split("/");
  const active = tab === "stock" || tab === "trade" ? "stocks" : tab;
  document.querySelectorAll(".tabs a").forEach(l => {
    if (l.dataset.tab === active) l.setAttribute("aria-current", "page");
    else l.removeAttribute("aria-current");
  });
  window.scrollTo(0, 0);
  const sym = (a || "").toUpperCase();
  if (tab === "stocks") return screenStocks();
  if (tab === "stock" && sym) return screenStock(sym);
  if (tab === "trade" && sym) return screenTrade(sym, b === "sell" ? "sell" : "buy");
  if (tab === "history") return screenHistory();
  if (tab === "learn") return screenLearn();
  if (tab === "settings") return screenSettings();
  return screenHome();
}
window.route = route;
window.addEventListener("hashchange", route);

(async () => {
  loading(T().starting);
  await detectMode();
  await refreshFx();
  refreshMarket();
  route();
  setInterval(refreshMarket, 60000);
})();
