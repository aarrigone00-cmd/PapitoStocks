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
    tabHome: "Home", tabStocks: "Azioni", tabHistory: "Storico", tabLearn: "Impara", tabSettings: "Opzioni",
    open: "🟢 Borsa aperta", closed: "🔴 Borsa chiusa",
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

// ---------- extra texts: market, history, advice, companies ----------
const COMPANY_NAMES = {
  AAPL: "Apple", MSFT: "Microsoft", AMZN: "Amazon", GOOGL: "Alphabet (Google)", NVDA: "NVIDIA", META: "Meta (Facebook)",
  TSLA: "Tesla", NFLX: "Netflix", KO: "Coca-Cola", PEP: "PepsiCo", MCD: "McDonald's", DIS: "Disney", NKE: "Nike",
  V: "Visa", JPM: "JPMorgan Chase", JNJ: "Johnson & Johnson", PFE: "Pfizer", WMT: "Walmart", COST: "Costco",
  PG: "Procter & Gamble", XOM: "Exxon Mobil", BA: "Boeing", RACE: "Ferrari", STLA: "Stellantis", E: "Eni",
  SPY: "S&P 500 (SPY)", DIA: "Dow Jones (DIA)", QQQ: "Nasdaq 100 (QQQ)",
};
const POPULAR = ["AAPL", "MSFT", "AMZN", "GOOGL", "NVDA", "META", "TSLA", "NFLX", "KO", "PEP", "MCD", "DIS", "NKE", "V",
  "JPM", "JNJ", "PFE", "WMT", "COST", "PG", "XOM", "BA", "RACE", "STLA", "E"];
const INDEXES = ["SPY", "DIA", "QQQ"];
const SECTORS = ["XLK", "XLV", "XLF", "XLE", "XLP", "XLY", "XLI", "XLU", "XLRE", "XLC", "XLB"];

Object.assign(TEXT.it, {
  tabMarket: "Mercato",
  ranges: { "1M": "1 mese", "6M": "6 mesi", "1Y": "1 anno", "5Y": "5 anni", "MAX": "Tutto" },
  chartSentence: (r, name, a, b, up, p, from) => {
    const when = { "1M": "Nell'ultimo mese", "6M": "Negli ultimi 6 mesi", "1Y": "Nell'ultimo anno", "5Y": "Negli ultimi 5 anni", "MAX": `Dal ${from} a oggi` }[r];
    return `${when}, ${name} è passata da <b>${a}</b> a <b>${b}</b>: ` +
      (up ? `<b class="t-up">in rialzo del ${p}</b>.` : `<b class="t-down">in calo del ${p}</b>.`);
  },
  ifInvested: (amt, val) => `💡 Se avessi investito <b>${amt}</b> all'inizio di questo periodo, oggi avresti circa <b>${val}</b>.`,
  aboutCompany: "Che cosa fa questa azienda",
  marketTitle: "Il mercato oggi",
  moods: [["⛈️", "Giornata difficile"], ["🌧️", "Giornata negativa"], ["⛅", "Giornata tranquilla"], ["🌤️", "Giornata positiva"], ["☀️", "Giornata molto positiva"]],
  marketSummary: (up, p) => `Oggi le 500 più grandi aziende americane, tutte insieme, sono ${up ? "in rialzo" : "in calo"} del <b>${p}</b>.`,
  flatSummary: "Oggi le 500 più grandi aziende americane, tutte insieme, sono quasi ferme.",
  normalMove: "Movimenti così sono normali e succedono quasi ogni giorno.",
  bigMove: "È un movimento grande: succede qualche volta l'anno. Nel lungo periodo i singoli giorni contano poco.",
  lastSession: "La Borsa è chiusa: questi sono i dati dell'ultima giornata.",
  indexesTitle: "I tre “termometri” della Borsa americana",
  indexes: { SPY: ["S&P 500", "Le 500 aziende americane più grandi. È il termometro più usato."],
    DIA: ["Dow Jones", "30 aziende storiche e famose, come Coca-Cola e McDonald's."],
    QQQ: ["Nasdaq 100", "100 grandi aziende, soprattutto di tecnologia."] },
  sectorsTitle: "Come vanno i settori",
  sectorsHint: "Un settore è un gruppo di aziende che fanno cose simili.",
  sectors: { XLK: "💻 Tecnologia", XLV: "🏥 Salute", XLF: "🏦 Banche e finanza", XLE: "⛽ Energia e petrolio", XLP: "🛒 Beni di tutti i giorni",
    XLY: "🛍️ Shopping e auto", XLI: "🏭 Industria", XLU: "💡 Luce, gas e acqua", XLRE: "🏢 Immobili", XLC: "📱 Comunicazioni e media", XLB: "⛏️ Materiali" },
  moversTitle: "Aziende famose: chi si è mosso di più oggi",
  winners: "▲ Le migliori", losers: "▼ Le peggiori",
  longTitle: "La storia del mercato",
  longSentence: (from, a, b, up, p) => `Dal ${from} a oggi l'S&P 500 è passato da <b>${a}</b> a <b>${b}</b>: ` +
    (up ? `<b class="t-up">+${p}</b>.` : `<b class="t-down">−${p}</b>.`),
  thousand: (from, v) => `💡 <b>1.000 $</b> investiti a ${from} oggi varrebbero circa <b>${v}</b>.`,
  drawdown: (p, when) => `📉 Il calo più grande in questo periodo è stato del <b>${p}</b> (${when}).`,
  recovered: m => ` Poi il mercato ha recuperato tutto in circa <b>${m} mesi</b>.`,
  notRecovered: " Non ha ancora recuperato del tutto.",
  lessonLong: "La lezione: nel breve periodo il mercato sale e scende, ma nel lungo periodo è cresciuto. Per questo conta la pazienza.",
  momentsTitle: "Momenti famosi della storia",
  moments: [
    ["1987 · Il “Lunedì nero”", "Il 19 ottobre 1987 il Dow Jones perse circa il 22% in un solo giorno, il calo giornaliero più grande della storia. Circa due anni dopo era tornato ai livelli di prima."],
    ["2000–2002 · La bolla di Internet", "Le aziende internet erano salite troppo, sull'entusiasmo. L'S&P 500 perse circa il 49% e il Nasdaq quasi l'80%. Ci vollero anni per recuperare."],
    ["2008–2009 · La crisi finanziaria", "Crisi delle banche e dei mutui. L'S&P 500 perse circa il 57% dal punto più alto. Tornò ai livelli di prima nel 2013."],
    ["2020 · Il Covid", "Tra febbraio e marzo 2020 l'S&P 500 perse circa il 34% in poco più di un mese. Ad agosto 2020 aveva già recuperato tutto."],
    ["2022 · Inflazione e tassi alti", "Salirono i prezzi e i tassi di interesse. L'S&P 500 perse circa il 25%. A inizio 2024 era tornato ai massimi."],
  ],
  momentsNote: "In media, nel lungo periodo, l'S&P 500 è cresciuto di circa il 10% l'anno (prima dell'inflazione), ma con anni molto buoni e anni molto brutti.",
  marketHome: "🌍 Com'è andato il mercato oggi?",
  accountHistory: "Il tuo conto nel tempo",
  histRanges: { "1W": "1 sett.", "1M": "1 mese", "3M": "3 mesi", "1A": "1 anno" },
  histSentence: (a, b, up, p) => `In questo periodo il tuo conto è passato da <b>${a}</b> a <b>${b}</b>: ` +
    (up ? `<b class="t-up">+${p}</b>` : `<b class="t-down">−${p}</b>`) + ".",
  histEmpty: "Il grafico apparirà dopo qualche giorno di utilizzo del conto.",
  adviceBtn: "💡 Consigli per te", myTrades: "🧾 Le mie operazioni",
  adviceTitle: "Consigli per te",
  adviceIntro: "Ecco cosa noto guardando il tuo conto di prova:",
  adv: {
    empty: ["🌱", "Non hai ancora investito niente.", "Un buon primo passo: un piccolo acquisto di prova di SPY, il fondo che contiene le 500 aziende più grandi. Così segui “tutto il mercato” invece di una sola azienda."],
    few: n => ["🧺", `Possiedi solo ${n} ${n === 1 ? "azienda" : "aziende diverse"}.`, "Mettere tutte le uova nello stesso paniere è rischioso. Prova a dividere i soldi su più aziende di settori diversi, o su un fondo come SPY."],
    concentrated: (name, p) => ["⚖️", `${name} è il ${p} dei tuoi investimenti.`, "È molto su una sola azienda: se va male, ne risente tutto il conto. Spesso si consiglia che nessuna azione superi il 20–25%."],
    cash: p => ["💵", `Il ${p} del conto è ancora in contanti.`, "Va bene andare piano. Ma i contanti non crescono: puoi provare a investire una parte un po' alla volta, per esempio la stessa cifra ogni mese."],
    loser: (name, p) => ["📉", `${name} è in calo del ${p} da quando l'hai comprata.`, "È normale che un'azione scenda. Prima di vendere per paura chiediti: è cambiato qualcosa nell'azienda, o è solo il mercato che si muove?"],
    winner: (name, p) => ["📈", `${name} è salita del ${p} da quando l'hai comprata.`, "Bene! Alcuni investitori a questo punto vendono una parte per “mettere al sicuro” il guadagno e tengono il resto."],
    busy: n => ["⏱️", `Hai fatto ${n} operazioni negli ultimi 7 giorni.`, "Comprare e vendere troppo spesso di solito fa guadagnare meno. Chi investe con successo spesso compra e tiene per anni."],
    good: ["✅", "Il tuo conto di prova è ben diviso.", "Continua così: pazienza e diversificazione sono le due regole più importanti."],
  },
  planTitle: "Un piano semplice per chi inizia",
  plan: [
    "Fai pratica qui con i soldi finti per almeno 2–3 mesi.",
    "Investi solo soldi che non ti servono per almeno 5 anni.",
    "Preferisci fondi che contengono tante aziende (come SPY) alle singole azioni.",
    "Investi un po' alla volta, per esempio ogni mese, invece che tutto in una volta.",
    "Non farti prendere dal panico quando il mercato scende: è già successo tante volte.",
    "Prima di usare soldi veri, parla con un consulente finanziario abilitato.",
  ],
  adviceDisclaimer: "Sono consigli generali per imparare, calcolati in automatico sul conto di prova. Non sono consigli finanziari personali.",
  companies: {
    AAPL: "Fa iPhone, Mac, iPad e altri prodotti elettronici.", MSFT: "Fa Windows, Office e servizi cloud per le aziende.",
    AMZN: "Il più grande negozio online del mondo, e servizi cloud.", GOOGL: "Possiede Google, YouTube e Android.",
    NVDA: "Fa chip per computer, usati per l'intelligenza artificiale e i videogiochi.", META: "Possiede Facebook, Instagram e WhatsApp.",
    TSLA: "Fa auto elettriche e batterie.", NFLX: "Film e serie TV in streaming.", KO: "Bevande come Coca-Cola, Fanta e Sprite.",
    PEP: "Pepsi, patatine e altri snack.", MCD: "Ristoranti McDonald's in tutto il mondo.", DIS: "Parchi Disney, film (Marvel, Pixar) e Disney+.",
    NKE: "Scarpe e abbigliamento sportivo.", V: "Il circuito delle carte di pagamento Visa.", JPM: "La più grande banca americana.",
    JNJ: "Medicinali e prodotti per la salute.", PFE: "Medicinali e vaccini.", WMT: "La più grande catena di supermercati americana.",
    COST: "Grandi magazzini dove si compra all'ingrosso.", PG: "Prodotti per la casa e la persona, come Dash, Gillette e Pampers.",
    XOM: "Petrolio e gas.", BA: "Aerei, come il Boeing 737.", RACE: "Auto sportive di lusso, fatte a Maranello.",
    STLA: "Auto: Fiat, Alfa Romeo, Jeep, Peugeot e altri marchi.", E: "Energia italiana: petrolio, gas e rinnovabili.",
    SPY: "Un fondo che contiene le 500 più grandi aziende americane. Comprarlo è come comprare un pezzetto di tutte.",
    DIA: "Un fondo con le 30 aziende del Dow Jones.", QQQ: "Un fondo con 100 grandi aziende, soprattutto di tecnologia.",
  },
});

Object.assign(TEXT.en, {
  tabMarket: "Market",
  ranges: { "1M": "1 month", "6M": "6 months", "1Y": "1 year", "5Y": "5 years", "MAX": "All" },
  chartSentence: (r, name, a, b, up, p, from) => {
    const when = { "1M": "Over the past month", "6M": "Over the past 6 months", "1Y": "Over the past year", "5Y": "Over the past 5 years", "MAX": `From ${from} to today` }[r];
    return `${when}, ${name} went from <b>${a}</b> to <b>${b}</b>: ` +
      (up ? `<b class="t-up">up ${p}</b>.` : `<b class="t-down">down ${p}</b>.`);
  },
  ifInvested: (amt, val) => `💡 If you had invested <b>${amt}</b> at the start of this period, today you'd have about <b>${val}</b>.`,
  aboutCompany: "What this company does",
  marketTitle: "The market today",
  moods: [["⛈️", "A rough day"], ["🌧️", "A down day"], ["⛅", "A quiet day"], ["🌤️", "A good day"], ["☀️", "A very good day"]],
  marketSummary: (up, p) => `Today the 500 largest US companies, taken together, are ${up ? "up" : "down"} <b>${p}</b>.`,
  flatSummary: "Today the 500 largest US companies, taken together, are barely moving.",
  normalMove: "Moves like this are normal and happen almost every day.",
  bigMove: "That's a big move: it happens a few times a year. Over the long run, single days matter little.",
  lastSession: "The market is closed: these are the numbers from the last trading day.",
  indexesTitle: "The three “thermometers” of the US market",
  indexes: { SPY: ["S&P 500", "The 500 largest US companies. The most-watched thermometer."],
    DIA: ["Dow Jones", "30 famous, long-established companies like Coca-Cola and McDonald's."],
    QQQ: ["Nasdaq 100", "100 big companies, mostly technology."] },
  sectorsTitle: "How each sector is doing",
  sectorsHint: "A sector is a group of companies that do similar things.",
  sectors: { XLK: "💻 Technology", XLV: "🏥 Health", XLF: "🏦 Banks & finance", XLE: "⛽ Energy & oil", XLP: "🛒 Everyday goods",
    XLY: "🛍️ Shopping & cars", XLI: "🏭 Industry", XLU: "💡 Power, gas & water", XLRE: "🏢 Real estate", XLC: "📱 Communication & media", XLB: "⛏️ Materials" },
  moversTitle: "Famous companies: biggest moves today",
  winners: "▲ Best", losers: "▼ Worst",
  longTitle: "The market's history",
  longSentence: (from, a, b, up, p) => `From ${from} to today the S&P 500 went from <b>${a}</b> to <b>${b}</b>: ` +
    (up ? `<b class="t-up">+${p}</b>.` : `<b class="t-down">−${p}</b>.`),
  thousand: (from, v) => `💡 <b>$1,000</b> invested in ${from} would be worth about <b>${v}</b> today.`,
  drawdown: (p, when) => `📉 The biggest drop in this period was <b>${p}</b> (${when}).`,
  recovered: m => ` The market then recovered all of it in about <b>${m} months</b>.`,
  notRecovered: " It hasn't fully recovered yet.",
  lessonLong: "The lesson: in the short run the market goes up and down, but over the long run it has grown. That's why patience matters.",
  momentsTitle: "Famous moments in history",
  moments: [
    ["1987 · “Black Monday”", "On October 19, 1987 the Dow Jones lost about 22% in a single day, the biggest one-day drop ever. About two years later it was back where it had been."],
    ["2000–2002 · The dot-com bubble", "Internet companies had risen too far on excitement. The S&P 500 lost about 49% and the Nasdaq almost 80%. It took years to recover."],
    ["2008–2009 · The financial crisis", "A banking and mortgage crisis. The S&P 500 fell about 57% from its peak. It got back to its old level in 2013."],
    ["2020 · Covid", "In February–March 2020 the S&P 500 lost about 34% in just over a month. By August 2020 it had recovered all of it."],
    ["2022 · Inflation and high rates", "Prices and interest rates rose. The S&P 500 lost about 25%. By early 2024 it was back at record highs."],
  ],
  momentsNote: "On average over the long run, the S&P 500 has grown about 10% a year (before inflation), but with some very good and some very bad years.",
  marketHome: "🌍 How did the market do today?",
  accountHistory: "Your account over time",
  histRanges: { "1W": "1 week", "1M": "1 month", "3M": "3 months", "1A": "1 year" },
  histSentence: (a, b, up, p) => `In this period your account went from <b>${a}</b> to <b>${b}</b>: ` +
    (up ? `<b class="t-up">+${p}</b>` : `<b class="t-down">−${p}</b>`) + ".",
  histEmpty: "The chart will appear after the account has been used for a few days.",
  adviceBtn: "💡 Tips for you", myTrades: "🧾 My trades",
  adviceTitle: "Tips for you",
  adviceIntro: "Here's what I notice in your practice account:",
  adv: {
    empty: ["🌱", "You haven't invested anything yet.", "A good first step: a small practice purchase of SPY, the fund that holds the 500 largest companies. That way you follow “the whole market” instead of one company."],
    few: n => ["🧺", `You only own ${n} ${n === 1 ? "company" : "different companies"}.`, "Putting all your eggs in one basket is risky. Try spreading money across companies in different sectors, or a fund like SPY."],
    concentrated: (name, p) => ["⚖️", `${name} is ${p} of your investments.`, "That's a lot in one company: if it does badly, your whole account feels it. A common rule is that no single stock should be more than 20–25%."],
    cash: p => ["💵", `${p} of your account is still cash.`, "Going slowly is fine. But cash doesn't grow: you could invest a part a little at a time, for example the same amount every month."],
    loser: (name, p) => ["📉", `${name} is down ${p} since you bought it.`, "It's normal for a stock to drop. Before selling out of fear, ask: did something change at the company, or is it just the market moving?"],
    winner: (name, p) => ["📈", `${name} is up ${p} since you bought it.`, "Nice! Some investors sell a part at this point to “lock in” the gain and keep the rest."],
    busy: n => ["⏱️", `You made ${n} trades in the last 7 days.`, "Buying and selling too often usually earns less. Successful investors often buy and hold for years."],
    good: ["✅", "Your practice account is well spread out.", "Keep it up: patience and diversification are the two most important rules."],
  },
  planTitle: "A simple plan for beginners",
  plan: [
    "Practice here with pretend money for at least 2–3 months.",
    "Only invest money you won't need for at least 5 years.",
    "Prefer funds that hold many companies (like SPY) over single stocks.",
    "Invest a little at a time, for example every month, instead of all at once.",
    "Don't panic when the market drops: it has happened many times before.",
    "Before using real money, talk to a licensed financial advisor.",
  ],
  adviceDisclaimer: "These are general learning tips, worked out automatically from the practice account. They are not personal financial advice.",
  companies: {
    AAPL: "Makes iPhones, Macs, iPads and other electronics.", MSFT: "Makes Windows, Office and cloud services for businesses.",
    AMZN: "The world's biggest online store, plus cloud services.", GOOGL: "Owns Google, YouTube and Android.",
    NVDA: "Makes computer chips used for artificial intelligence and video games.", META: "Owns Facebook, Instagram and WhatsApp.",
    TSLA: "Makes electric cars and batteries.", NFLX: "Streaming movies and TV series.", KO: "Drinks like Coca-Cola, Fanta and Sprite.",
    PEP: "Pepsi, chips and other snacks.", MCD: "McDonald's restaurants around the world.", DIS: "Disney parks, movies (Marvel, Pixar) and Disney+.",
    NKE: "Sports shoes and clothing.", V: "The Visa payment card network.", JPM: "The largest US bank.",
    JNJ: "Medicines and health products.", PFE: "Medicines and vaccines.", WMT: "The largest US supermarket chain.",
    COST: "Warehouse stores that sell in bulk.", PG: "Household and personal products like Tide, Gillette and Pampers.",
    XOM: "Oil and gas.", BA: "Airplanes, like the Boeing 737.", RACE: "Luxury sports cars, made in Maranello, Italy.",
    STLA: "Cars: Fiat, Alfa Romeo, Jeep, Peugeot and other brands.", E: "Italian energy company: oil, gas and renewables.",
    SPY: "A fund holding the 500 largest US companies. Buying it is like buying a small piece of all of them.",
    DIA: "A fund holding the 30 Dow Jones companies.", QQQ: "A fund holding 100 big companies, mostly technology.",
  },
});

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
    const [name, price] = info[sym] || [COMPANY_NAMES[sym] || sym, 20 + seed(sym)() * 300];
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
      if (action === "history") {
        const n = { "1W": 5, "1M": 21, "3M": 63, "1A": 250 }[p.period] || 21, rnd = seed("hist" + p.period), out = [];
        let v = 10000 + positions().reduce((s, x) => s + +x.market_value, 0) - (cash < 10000 ? 0 : 0);
        for (let i = 0; i < n; i++) { out.push(v); v = v / (1 + (rnd() - 0.47) * 0.01); }
        return out.reverse().map((c, i) => ({ t: new Date(Date.now() - (n - i) * 864e5).toISOString(), c }));
      }
      if (action === "quotes") return p.symbols.split(",").map(quote);
      if (action === "search") {
        const t = p.q.toLowerCase();
        return Object.entries(info).filter(([s, [n]]) => s.toLowerCase().startsWith(t) || n.toLowerCase().includes(t))
          .map(([symbol, [name]]) => ({ symbol, name }));
      }
      if (action === "bars") {
        const n = { "1M": 22, "6M": 126, "1Y": 252, "5Y": 260, "MAX": 520 }[p.range] || 252;
        const days = { "1M": 31, "6M": 183, "1Y": 366, "5Y": 1830, "MAX": 3650 }[p.range] || 366;
        const rnd = seed(p.symbol + p.range), out = [];
        let v = quote(p.symbol).price;
        for (let i = 0; i < n; i++) { out.push(v); v = v / (1 + (rnd() - 0.48) * (p.range === "5Y" || p.range === "MAX" ? 0.05 : 0.025)); }
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
const nameOf = sym => names[sym] || COMPANY_NAMES[sym] || sym;

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
      <div class="card hero balance">
        <div class="muted">${T().worth}</div>
        <div class="big">${money(equity)}</div>
        ${eurSmall(equity)}
        <div style="margin-top:.4rem">${changeBadge(dayChg, dayPct)}</div>
        <p class="small muted" style="margin-top:.7rem">${T().cash}: <b>${moneyBoth(+acct.cash)}</b></p>
      </div>
      <div class="row">
        <a class="btn" href="#market">${T().marketHome}</a>
      </div>
      <div class="row">
        <a class="btn secondary" href="#advice">${T().adviceBtn}</a>
        <a class="btn secondary" href="#history">${T().myTrades}</a>
      </div>
      <div class="card" id="acct-history"></div>
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
    drawAccountHistory($("#acct-history"));
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

let chartId = 0;
function chartSVG(bars, up) {
  const W = 600, H = 240, P = 8, id = "g" + (++chartId);
  const vals = bars.map(b => b.c);
  const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
  const pts = vals.map((v, i) => [P + i * (W - 2 * P) / Math.max(vals.length - 1, 1), P + (H - 2 * P) * (1 - (v - min) / span)]);
  const line = pts.map(p => p.map(n => n.toFixed(1)).join(",")).join(" ");
  const col = up ? "var(--up)" : "var(--down)";
  const [ex, ey] = pts.at(-1);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${col}" stop-opacity=".28"/><stop offset="100%" stop-color="${col}" stop-opacity="0"/>
    </linearGradient></defs>
    ${[0.25, 0.5, 0.75].map(f => `<line x1="0" x2="${W}" y1="${H * f}" y2="${H * f}" stroke="var(--line)" stroke-dasharray="4 6"/>`).join("")}
    <polygon points="${P},${H} ${line} ${W - P},${H}" fill="url(#${id})"/>
    <polyline points="${line}" fill="none" stroke="${col}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${ex}" cy="${ey}" r="13" fill="${col}" opacity=".18"/>
    <circle cx="${ex}" cy="${ey}" r="7" fill="${col}" stroke="var(--card)" stroke-width="3"/>
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
      <a href="javascript:history.back()" class="back">${T().back}</a>
      <div class="card hero">
        <h2 style="margin:0">${esc(q.name)}</h2>
        <div class="muted small">${T().symbol}: ${esc(sym)}</div>
        <div class="big">${money(q.price)}</div>
        ${eurSmall(q.price)}
        <div class="muted small">${T().oneShare}</div>
        <div style="margin-top:.4rem">${changeBadge(q.change, q.changePct)}</div>
      </div>

      ${T().companies[sym] ? `<div class="card about"><h3>${T().aboutCompany}</h3><p>${esc(T().companies[sym])}</p></div>` : ""}

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
           <p style="margin-top:.7rem">${T().chartSentence(r, esc(q.name), money(first), money(last), diff >= 0, pct(diff / first * 100), d(bars[0].t))}</p>
           <p class="tip">${T().ifInvested(money(1000, 0), moneyBoth(1000 * last / first))}</p>
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
      <a href="#stock/${esc(sym)}" class="back">${T().back}</a>
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
    view.innerHTML = `<a href="#home" class="back">${T().back}</a><h2>${T().historyTitle}</h2>` + (orders.length ? orders.map(o => {
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

// ---------- market, history and advice ----------
function moodFor(p) {
  const m = T().moods;
  return p <= -1 ? m[0] : p <= -0.2 ? m[1] : p < 0.2 ? m[2] : p < 1 ? m[3] : m[4];
}

function pctPill(p) {
  if (p == null || isNaN(p)) return `<span class="pill flat">—</span>`;
  const cls = p > 0.005 ? "up" : p < -0.005 ? "down" : "flat";
  return `<span class="pill ${cls}">${p > 0.005 ? "▲" : p < -0.005 ? "▼" : "●"} ${pct(p)}</span>`;
}

function maxDrawdown(bars) {
  let peak = bars[0], best = null;
  bars.forEach((b, i) => {
    if (b.c > peak.c) peak = b;
    const dd = (b.c - peak.c) / peak.c;
    if (!best || dd < best.dd) best = { dd, peak, trough: b, i };
  });
  if (!best || best.dd > -0.05) return null;
  best.rec = bars.slice(best.i).find(b => b.c >= best.peak.c) || null;
  return best;
}

const monthYear = s => new Date(s).toLocaleDateString(LOC(), { month: "long", year: "numeric" });

async function screenMarket() {
  loading();
  try {
    const syms = [...INDEXES, ...SECTORS, ...POPULAR];
    const [qs, clock] = await Promise.all([api.get("quotes", { symbols: syms.join(",") }), refreshMarket()]);
    const by = Object.fromEntries(qs.map(q => [q.symbol, q]));
    const spy = by.SPY || {};
    const p = spy.changePct ?? 0;
    const [icon, mood] = moodFor(p);
    const summary = Math.abs(p) < 0.05 ? T().flatSummary : T().marketSummary(p > 0, pct(p));

    const sectors = SECTORS.map(s => by[s]).filter(q => q && q.changePct != null).sort((a, b) => b.changePct - a.changePct);
    const maxAbs = Math.max(0.5, ...sectors.map(q => Math.abs(q.changePct)));
    const pop = POPULAR.map(s => by[s]).filter(q => q && q.changePct != null).sort((a, b) => b.changePct - a.changePct);
    const moverRow = q => `<a class="mini" href="#stock/${esc(q.symbol)}"><span>${esc(nameOf(q.symbol))}</span>${pctPill(q.changePct)}</a>`;

    view.innerHTML = `
      <h2>${T().marketTitle}</h2>
      <div class="card hero mood ${p > 0.2 ? "good" : p < -0.2 ? "bad" : "calm"}">
        <div class="mood-icon" aria-hidden="true">${icon}</div>
        <div class="mood-title">${mood}</div>
        <p class="lead">${summary}</p>
        <p class="small">${Math.abs(p) >= 2 ? T().bigMove : T().normalMove}</p>
        ${clock && !clock.is_open ? `<p class="small muted">${T().lastSession}</p>` : ""}
      </div>

      <h2>${T().indexesTitle}</h2>
      ${INDEXES.map(s => { const q = by[s] || {}; const [n, d] = T().indexes[s]; return `
        <a class="card stock" href="#stock/${s}">
          <div><div class="name">${n}</div><div class="sym">${d}</div></div>
          <div class="right">${pctPill(q.changePct)}</div>
        </a>`; }).join("")}

      <h2>${T().sectorsTitle}</h2>
      <p class="small muted">${T().sectorsHint}</p>
      <div class="card">
        ${sectors.map(q => `<div class="bar-row">
          <span class="bar-label">${T().sectors[q.symbol]}</span>
          <span class="bar-track"><span class="bar ${q.changePct >= 0 ? "up" : "down"}" style="width:${Math.max(4, Math.abs(q.changePct) / maxAbs * 100).toFixed(0)}%"></span></span>
          <span class="bar-val ${q.changePct >= 0 ? "t-up" : "t-down"}">${q.changePct >= 0 ? "+" : "−"}${pct(q.changePct)}</span>
        </div>`).join("")}
      </div>

      <h2>${T().moversTitle}</h2>
      <div class="two-col">
        <div class="card"><h3 class="t-up">${T().winners}</h3>${pop.slice(0, 4).map(moverRow).join("")}</div>
        <div class="card"><h3 class="t-down">${T().losers}</h3>${pop.slice(-4).reverse().map(moverRow).join("")}</div>
      </div>

      <h2>${T().longTitle}</h2>
      <div class="card" id="longrun"><div class="spinner">${T().drawing}</div></div>

      <h2>${T().momentsTitle}</h2>
      ${T().moments.map(([q, a]) => `<details class="learn"><summary>${esc(q)}</summary><div><p>${esc(a)}</p></div></details>`).join("")}
      <p class="small muted">${T().momentsNote}</p>`;

    try {
      const bars = await api.get("bars", { symbol: "SPY", range: "MAX" });
      if (bars.length < 10) throw new Error("no data");
      const first = bars[0].c, last = spy.price ?? bars.at(-1).c, from = monthYear(bars[0].t), growth = last / first;
      const dd = maxDrawdown(bars);
      let ddText = "";
      if (dd) {
        ddText = T().drawdown(pct(dd.dd * 100), monthYear(dd.trough.t)) +
          (dd.rec ? T().recovered(Math.max(1, Math.round((new Date(dd.rec.t) - new Date(dd.trough.t)) / (30.4 * 864e5)))) : T().notRecovered);
      }
      $("#longrun").innerHTML = chartSVG(bars, last >= first) +
        `<div class="chart-labels"><span>${esc(from)}</span><span>${T().todayLabel}</span></div>
         <p>${T().longSentence(esc(from), money(first), money(last), last >= first, pct(Math.abs(growth - 1) * 100))}</p>
         <p class="tip">${T().thousand(esc(from), moneyBoth(1000 * growth))}</p>
         ${ddText ? `<p>${ddText}</p>` : ""}
         <p class="small muted">${T().lessonLong}</p>`;
    } catch (e) { $("#longrun").innerHTML = `<p class="muted">${T().noChart}</p>`; }
  } catch (e) { view.innerHTML = errorBox(e); }
}

async function drawAccountHistory(el) {
  const range = store("hrange") || "1M";
  el.innerHTML = `
    <h3>${T().accountHistory}</h3>
    <div class="chips range" role="group">${Object.keys(T().histRanges).map(r =>
      `<button class="chip" data-hrange="${r}" aria-pressed="${r === range}">${T().histRanges[r]}</button>`).join("")}</div>
    <div id="hchart"><div class="spinner">${T().drawing}</div></div>`;
  el.querySelectorAll("[data-hrange]").forEach(b => b.onclick = () => { store("hrange", b.dataset.hrange); drawAccountHistory(el); });
  try {
    const pts = await api.get("history", { period: range });
    if (pts.length < 2) { $("#hchart").innerHTML = `<p class="muted">${T().histEmpty}</p>`; return; }
    const a = pts[0].c, b = pts.at(-1).c;
    $("#hchart").innerHTML = chartSVG(pts, b >= a) +
      `<p>${T().histSentence(money(a), money(b), b >= a, pct(Math.abs(b - a) / a * 100))}</p>`;
  } catch { $("#hchart").innerHTML = `<p class="muted">${T().histEmpty}</p>`; }
}

async function screenAdvice() {
  loading();
  try {
    const [acct, positions, orders] = await Promise.all([api.get("account"), api.get("positions"), api.get("orders")]);
    const equity = +acct.equity, cash = +acct.cash;
    const pos = positions.map(p => {
      const cost = +p.qty * +p.avg_entry_price;
      return { sym: p.symbol, mv: +p.market_value, pl: cost ? (+p.market_value - cost) / cost * 100 : 0 };
    });
    const invested = pos.reduce((s, p) => s + p.mv, 0);
    const A = T().adv, items = [];
    const pct = n => Math.round(Math.abs(n)) + "%";
    if (!pos.length) items.push(A.empty);
    else {
      if (pos.length < 3) items.push(A.few(pos.length));
      const top = pos.reduce((m, p) => (p.mv > m.mv ? p : m));
      if (pos.length >= 2 && top.mv / invested > 0.4) items.push(A.concentrated(nameOf(top.sym), pct(top.mv / invested * 100)));
      if (equity && cash / equity > 0.7) items.push(A.cash(pct(cash / equity * 100)));
      pos.filter(p => p.pl <= -15).slice(0, 2).forEach(p => items.push(A.loser(nameOf(p.sym), pct(-p.pl))));
      pos.filter(p => p.pl >= 25).slice(0, 2).forEach(p => items.push(A.winner(nameOf(p.sym), pct(p.pl))));
    }
    const recent = orders.filter(o => Date.now() - new Date(o.submitted_at) < 7 * 864e5).length;
    if (recent >= 8) items.push(A.busy(recent));
    if (!items.length) items.push(A.good);

    view.innerHTML = `
      <a href="#home" class="back">${T().back}</a>
      <h2>${T().adviceTitle}</h2>
      <p class="muted">${T().adviceIntro}</p>
      ${items.map(([icon, title, body]) => `
        <div class="card advice"><div class="advice-icon" aria-hidden="true">${icon}</div>
          <div><h3>${esc(title)}</h3><p>${esc(body)}</p></div></div>`).join("")}
      <h2>${T().planTitle}</h2>
      <div class="card"><ol class="plan">${T().plan.map(s => `<li>${esc(s)}</li>`).join("")}</ol></div>
      <p class="small muted">${T().adviceDisclaimer}</p>`;
  } catch (e) { view.innerHTML = errorBox(e); }
}

// ---------- router ----------
function route() {
  const [tab, a, b] = (location.hash.slice(1) || "home").split("/");
  const active = tab === "stock" || tab === "trade" ? "stocks" : tab === "history" || tab === "advice" ? "home" : tab;
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
  if (tab === "market") return screenMarket();
  if (tab === "advice") return screenAdvice();
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
