import type { Lang } from "./i18n";

export type Section = {
  slug: string; href: string; glyph: string; phase: number; live: boolean;
  title: Record<Lang, string>; blurb: Record<Lang, string>; needs?: string[];
};
export type Group = { id: string; title: Record<Lang, string>; items: Section[] };

const s = (slug: string, glyph: string, phase: number, live: boolean, it: string, en: string, bit: string, ben: string, needs?: string[], href?: string): Section =>
  ({ slug, glyph, phase, live, href: href ?? (live ? `/${slug}` : `/s/${slug}`), title: { it, en }, blurb: { it: bit, en: ben }, needs });

export const GROUPS: Group[] = [
  { id: "home", title: { it: "Panoramica", en: "Overview" }, items: [
    s("overview", "◆", 1, true, "Panoramica", "Overview", "Il tuo patrimonio e il mondo, in una pagina.", "Your wealth and the world, on one page.", [], "/"),
  ]},
  { id: "intel", title: { it: "Intelligence globale", en: "Global intelligence" }, items: [
    s("intelligence", "◎", 3, false, "Intelligence globale", "Global Intelligence",
      "Un quotidiano finanziario che si aggiorna da solo: geopolitica, banche centrali, commercio, energia, tecnologia. Ogni notizia con fonte, orario e un'analisi AI su perché conta e chi ne è toccato.",
      "A self-updating financial newspaper: geopolitics, central banks, trade, energy, technology. Every story with source, timestamp and an AI analysis of why it matters and who is affected.",
      ["GDELT (free)", "Alpaca News", "Claude API"]),
    s("news", "❡", 1, true, "Notizie in diretta", "Live News", "", ""),
    s("world-map", "◍", 3, false, "Mappa del mondo", "World Map",
      "Mappa interattiva: clicca un Paese per vederne notizie, economia, inflazione, tassi, valuta, borsa, rischi e legami con il tuo portafoglio. Livelli per rotte commerciali, energia, sanzioni.",
      "Interactive map: click a country for its headlines, economy, inflation, rates, currency, market, risks and links to your portfolio. Layers for trade routes, energy, sanctions.",
      ["World Bank / IMF (free)", "GDELT (free)", "MapLibre (free)"]),
    s("macro", "∿", 3, false, "Macroeconomia", "Macroeconomics",
      "PIL, inflazione, occupazione, curve dei rendimenti, cambi, materie prime e le sei grandi banche centrali, con spiegazioni su come influenzano ogni settore.",
      "GDP, inflation, jobs, yield curves, currencies, commodities and the six major central banks, with explanations of how they affect each sector.",
      ["FRED (free key)", "ECB / central bank data (free)"]),
    s("calendar", "▦", 3, false, "Agenda economica", "Economic Calendar",
      "Riunioni delle banche centrali, dati su inflazione e lavoro, trimestrali, dividendi, elezioni, OPEC: con dato precedente, attese, risultato e promemoria.",
      "Central bank meetings, inflation and jobs data, earnings, dividends, elections, OPEC: with previous figure, consensus, actual result and reminders.",
      ["Finnhub (free key)"]),
  ]},
  { id: "markets", title: { it: "Mercati e ricerca", en: "Markets & research" }, items: [
    s("markets", "▤", 1, true, "Mercati", "Markets", "", ""),
    s("research", "§", 1, true, "Ricerca titoli", "Stock Research", "", ""),
    s("screener", "⌕", 2, false, "Selezione titoli", "Stock Screener",
      "Filtra le aziende per crescita, margini, debito, dividendi, valutazione, oppure chiedi in italiano: «aziende europee redditizie con dividendi in crescita e poco debito».",
      "Filter companies by growth, margins, debt, dividends, valuation, or ask in plain words: “profitable European companies with growing dividends and low debt”.",
      ["Financial Modeling Prep", "Claude API"]),
    s("opportunities", "✧", 5, false, "Radar opportunità", "Opportunity Radar",
      "Aziende che potrebbero beneficiare degli sviluppi in corso, con il ragionamento esplicito e i rischi. Mai presentate come certezze.",
      "Companies that may benefit from current developments, with explicit reasoning and risks. Never presented as certainties.",
      ["Financial Modeling Prep", "Claude API"]),
    s("valuation", "⚖", 5, false, "Laboratorio di valutazione", "Valuation Laboratory",
      "DCF, modello a dividendi, multipli comparabili, WACC e tabelle di sensibilità con scenari rialzista, base e ribassista. Ogni formula spiegata.",
      "DCF, dividend discount model, comparable multiples, WACC and sensitivity tables with bull, base and bear scenarios. Every formula explained.",
      ["Financial Modeling Prep"]),
  ]},
  { id: "wealth", title: { it: "Patrimonio", en: "Wealth" }, items: [
    s("portfolio", "◧", 1, true, "Il mio portafoglio", "My Portfolio", "", ""),
    s("risk", "◬", 5, true, "Radar dei rischi", "Risk Radar",
      "Concentrazione, settori, Paesi, valute, sensibilità a tassi e inflazione, catene di fornitura condivise, correlazioni: con il perché di ogni rischio.",
      "Concentration, sectors, countries, currencies, rate and inflation sensitivity, shared supply chains, correlations: with the reason behind each risk.",
      ["Financial Modeling Prep", "Claude API"]),
    s("simulation", "∞", 5, true, "Laboratorio di simulazione", "Simulation Laboratory",
      "Interesse composto, pensione, Monte Carlo, backtest, e un simulatore di shock: recessione, crollo, tassi, petrolio, dazi, crisi bancaria.",
      "Compound interest, retirement, Monte Carlo, backtests, and a shock simulator: recession, crash, rates, oil, tariffs, banking crisis.",
      ["Alpaca historical data"]),
    s("trade", "⇄", 1, true, "Centro operativo", "Trading Center", "", ""),
  ]},
  { id: "ai", title: { it: "Intelligenza artificiale", en: "Artificial intelligence" }, items: [
    s("analyst", "✦", 4, false, "Analista AI", "AI Analyst",
      "Chiedi «perché il mio portafoglio scende oggi?» o «confronta Apple, Microsoft e Nvidia»: risposte basate su dati reali, con fonti, date e livelli di spiegazione semplice, intermedia o professionale.",
      "Ask “why is my portfolio down today?” or “compare Apple, Microsoft and Nvidia”: answers grounded in real data, with sources, dates and simple, intermediate or professional depth.",
      ["Claude API"]),
    s("committee", "⚜", 4, false, "Comitato d'investimento AI", "AI Investment Committee",
      "Sette prospettive simulate (Toro, Orso, Value, Macro, Geopolitica, Rischio, Strategia) discutono un investimento; poi una sintesi equilibrata. Non sono esperti umani.",
      "Seven simulated perspectives (Bull, Bear, Value, Macro, Geopolitics, Risk, Strategy) debate an investment, then a balanced synthesis. They are not human experts.",
      ["Claude API"]),
  ]},
  { id: "personal", title: { it: "Personale", en: "Personal" }, items: [
    s("journal", "✎", 6, false, "Diario d'investimento", "Investment Journal",
      "Perché hai comprato, la tesi, i rischi attesi, gli obiettivi; poi l'AI confronta la tesi con quello che è successo davvero.",
      "Why you bought, the thesis, expected risks, goals; then AI compares the thesis with what actually happened.",
      ["Supabase (free)", "Claude API"]),
    s("library", "❏", 6, false, "Biblioteca", "Research Library",
      "Articoli, bilanci, analisi AI, modelli di valutazione e note personali, salvati e organizzati.",
      "Articles, reports, AI analyses, valuation models and personal notes, saved and organised.",
      ["Supabase (free)"]),
    s("academy", "❦", 6, true, "Accademia", "Financial Academy",
      "Corsi brevi su termini, concetti e metodi. Ogni termine tecnico nell'app sarà cliccabile per una spiegazione.",
      "Short lessons on terms, concepts and methods. Every technical term in the app will be clickable for an explanation.",
      ["Claude API (optional)"]),
    s("settings", "⚙", 1, true, "Impostazioni", "Settings", "", ""),
  ]},
];

export const ALL_SECTIONS = GROUPS.flatMap(g => g.items);
export const sectionBySlug = (slug: string) => ALL_SECTIONS.find(x => x.slug === slug);
