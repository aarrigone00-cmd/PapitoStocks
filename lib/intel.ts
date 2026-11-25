// Global intelligence: topics, source credibility, country/company detection.
// Used on the server (to tag GDELT articles) and in the browser (to tag Alpaca news).
import { HEATMAP } from "./universe";

type L = { it: string; en: string };

export type TopicId = "geopolitics" | "trade" | "centralbanks" | "macro" | "elections" | "energy" | "commodities" | "supply" | "tech" | "corporate" | "climate" | "regulation" | "italy" | "markets";

export type Topic = {
  id: TopicId; glyph: string; label: L;
  /** GDELT query (kept short: GDELT rejects long queries) */
  query?: string;
  /** keywords used to tag articles from other sources */
  keywords: RegExp;
  /** how this kind of news usually reaches markets (textbook mechanisms, not analysis of a specific story) */
  why: L;
  sectors: { name: L; dir: 1 | -1 | 0 }[];
};

const S = (it: string, en: string, dir: 1 | -1 | 0) => ({ name: { it, en }, dir });

export const TOPICS: Topic[] = [
  { id: "geopolitics", glyph: "⚔", label: { it: "Geopolitica e conflitti", en: "Geopolitics & conflicts" },
    query: '(war OR ceasefire OR missile OR invasion OR airstrike) sourcelang:english',
    keywords: /\b(war|ceasefire|missile|invasion|airstrike|troops|military|NATO|attack|conflict|guerra|militar)/i,
    why: { it: "I conflitti alzano l'incertezza: gli investitori vendono azioni e comprano beni rifugio (oro, dollaro, titoli di Stato). Se colpiscono aree che producono energia o rotte commerciali, salgono petrolio e costi di trasporto, e con loro l'inflazione.", en: "Conflicts raise uncertainty: investors sell shares and buy safe havens (gold, dollar, government bonds). If they hit energy-producing areas or trade routes, oil and freight costs rise, and inflation with them." },
    sectors: [S("Difesa", "Defence", 1), S("Energia", "Energy", 1), S("Compagnie aeree", "Airlines", -1), S("Turismo e consumi", "Travel & consumer", -1), S("Oro", "Gold", 1)] },
  { id: "trade", glyph: "⇆", label: { it: "Commercio, dazi e sanzioni", en: "Trade, tariffs & sanctions" },
    query: '(tariffs OR sanctions OR "trade war" OR embargo OR "export controls") sourcelang:english',
    keywords: /\b(tariff|sanction|trade war|embargo|export control|import dut|dazi|sanzion)/i,
    why: { it: "I dazi sono tasse sulle importazioni: alzano i costi delle aziende che comprano dall'estero e possono essere scaricati sui prezzi. Colpiscono soprattutto esportatori, industria, auto e chi dipende da catene di fornitura globali; a volte proteggono i produttori nazionali.", en: "Tariffs are taxes on imports: they raise costs for companies buying abroad and can be passed on to prices. They hit exporters, industry, autos and anyone relying on global supply chains; sometimes they protect domestic producers." },
    sectors: [S("Industria", "Industrials", -1), S("Auto", "Autos", -1), S("Tecnologia (componenti)", "Tech (components)", -1), S("Produttori nazionali", "Domestic producers", 1), S("Esportatori europei", "European exporters", -1)] },
  { id: "centralbanks", glyph: "⌂", label: { it: "Banche centrali e tassi", en: "Central banks & rates" },
    query: '("central bank" OR "Federal Reserve" OR ECB OR "interest rates" OR "rate cut") sourcelang:english',
    keywords: /\b(central bank|Federal Reserve|the Fed\b|Fed's|ECB|BCE|Bank of England|Bank of Japan|interest rate|rate cut|rate hike|Powell|Lagarde|tassi)/i,
    why: { it: "Tassi più alti rendono il denaro più caro: frenano consumi e investimenti, riducono il valore di oggi dei profitti futuri (colpendo le aziende in crescita) e rafforzano la valuta. Tassi più bassi fanno l'opposto. Spesso conta più la sorpresa rispetto alle attese che la decisione in sé.", en: "Higher rates make money dearer: they slow spending and investment, shrink today's value of future profits (hitting growth companies) and strengthen the currency. Lower rates do the opposite. The surprise versus expectations often matters more than the decision itself." },
    sectors: [S("Banche (se i tassi salgono)", "Banks (if rates rise)", 1), S("Tecnologia e crescita", "Tech & growth", -1), S("Immobiliare", "Real estate", -1), S("Servizi pubblici", "Utilities", -1)] },
  { id: "macro", glyph: "∿", label: { it: "Economia: inflazione, crescita, lavoro", en: "Economy: inflation, growth, jobs" },
    query: '(inflation OR recession OR unemployment OR GDP OR "consumer prices") sourcelang:english',
    keywords: /\b(inflation|recession|unemployment|jobless|GDP|consumer prices|payrolls|PMI|retail sales|inflazione|recessione|disoccupazione|PIL)/i,
    why: { it: "I dati economici cambiano le attese su profitti e tassi. Inflazione più alta del previsto fa temere tassi più alti; crescita debole fa temere minori profitti, ma può spingere le banche centrali a tagliare i tassi.", en: "Economic data change expectations for profits and rates. Higher-than-expected inflation raises fears of higher rates; weak growth raises fears of lower profits but can push central banks to cut." },
    sectors: [S("Beni primari (difensivi)", "Staples (defensive)", 0), S("Consumi discrezionali", "Discretionary", -1), S("Banche", "Banks", 0)] },
  { id: "elections", glyph: "☐", label: { it: "Elezioni e politica", en: "Elections & politics" },
    query: '(election OR referendum OR "prime minister" OR parliament OR "government collapse") sourcelang:english',
    keywords: /\b(election|referendum|prime minister|parliament|president|vote|coalition|elezion|governo)/i,
    why: { it: "Le elezioni cambiano tasse, spesa pubblica, regole e rapporti commerciali. I mercati reagiscono soprattutto all'incertezza e ai programmi su debito pubblico, energia e regolamentazione dei settori.", en: "Elections change taxes, public spending, rules and trade relations. Markets react mostly to uncertainty and to plans on public debt, energy and sector regulation." },
    sectors: [S("Titoli di Stato", "Government bonds", 0), S("Banche nazionali", "Domestic banks", 0), S("Settori regolati", "Regulated sectors", 0)] },
  { id: "energy", glyph: "⛽", label: { it: "Energia: petrolio e gas", en: "Energy: oil & gas" },
    query: '(OPEC OR "oil prices" OR "natural gas" OR LNG OR "crude oil") sourcelang:english',
    keywords: /\b(OPEC|oil price|crude|natural gas|LNG|Brent|petrolio|gas naturale|refiner|pipeline)/i,
    why: { it: "Il prezzo dell'energia entra in quasi tutti i costi: se sale guadagnano le aziende petrolifere, soffrono trasporti, chimica e consumatori, e cresce l'inflazione. L'Europa, che importa gran parte dell'energia, è più esposta degli Stati Uniti.", en: "Energy prices feed into almost every cost: when they rise oil companies gain, transport, chemicals and consumers suffer, and inflation climbs. Europe, which imports most of its energy, is more exposed than the US." },
    sectors: [S("Petroliferi", "Oil & gas", 1), S("Compagnie aeree", "Airlines", -1), S("Chimica e industria", "Chemicals & industry", -1), S("Rinnovabili", "Renewables", 1)] },
  { id: "commodities", glyph: "◇", label: { it: "Materie prime", en: "Commodities" },
    query: '(gold OR copper OR wheat OR lithium OR "commodity prices") sourcelang:english',
    keywords: /\b(gold price|copper|wheat|lithium|commodit|iron ore|soybean|cocoa|coffee prices|nickel|oro|rame|grano)/i,
    why: { it: "Le materie prime sono il primo anello della catena: rame e litio seguono l'industria e l'elettrificazione, il grano il clima, l'oro la paura e i tassi reali. I rialzi aiutano i produttori e pesano su chi le usa.", en: "Commodities are the first link in the chain: copper and lithium track industry and electrification, wheat the weather, gold fear and real rates. Price rises help producers and weigh on users." },
    sectors: [S("Minerari", "Miners", 1), S("Alimentare", "Food producers", -1), S("Auto elettriche", "EV makers", -1)] },
  { id: "supply", glyph: "⚓", label: { it: "Catene di fornitura e trasporti", en: "Supply chains & shipping" },
    query: '("supply chain" OR shipping OR "Red Sea" OR "Suez Canal" OR "Strait of Hormuz") sourcelang:english',
    keywords: /\b(supply chain|shipping|freight|container|Red Sea|Suez|Hormuz|Panama Canal|port strike|logistic)/i,
    why: { it: "Se una rotta si blocca (Suez, Mar Rosso, Hormuz, Panama), le navi allungano il percorso: salgono noli, tempi e costi delle merci. Guadagnano gli armatori, soffrono i dettaglianti e i produttori che dipendono da componenti importati.", en: "If a route closes (Suez, Red Sea, Hormuz, Panama), ships take longer: freight rates, delivery times and goods costs rise. Shipping lines gain; retailers and manufacturers relying on imported parts suffer." },
    sectors: [S("Armatori", "Shipping lines", 1), S("Commercio al dettaglio", "Retail", -1), S("Industria", "Industrials", -1), S("Energia", "Energy", 1)] },
  { id: "tech", glyph: "⌘", label: { it: "Tecnologia e intelligenza artificiale", en: "Technology & AI" },
    query: '("artificial intelligence" OR semiconductor OR chipmaker OR Nvidia OR TSMC) sourcelang:english',
    keywords: /\b(artificial intelligence|\bAI\b|semiconductor|chip|Nvidia|TSMC|data cent|OpenAI|cloud|intelligenza artificiale)/i,
    why: { it: "L'intelligenza artificiale guida gran parte degli investimenti e dei profitti tecnologici: chip, data center, energia elettrica. Notizie su domanda di chip, controlli all'export verso la Cina o costi dei data center muovono un gruppo di titoli che pesa molto negli indici.", en: "AI drives much of tech investment and profit: chips, data centres, electricity. News on chip demand, export controls to China or data-centre costs moves a group of stocks that weighs heavily in the indices." },
    sectors: [S("Semiconduttori", "Semiconductors", 0), S("Cloud e software", "Cloud & software", 0), S("Elettricità e reti", "Power & grids", 1)] },
  { id: "corporate", glyph: "▣", label: { it: "Aziende: fusioni, conti, fallimenti", en: "Companies: deals, earnings, bankruptcies" },
    query: '(merger OR acquisition OR takeover OR bankruptcy OR layoffs) sourcelang:english',
    keywords: /\b(merger|acquisition|acquire|takeover|bankrupt|layoff|earnings|profit|revenue|IPO|buyback|fusione|acquisizione|fallimento|utili)/i,
    why: { it: "Fusioni e acquisizioni di solito fanno salire il titolo di chi viene comprato; i risultati trimestrali spostano il prezzo in base alla sorpresa rispetto alle attese; i fallimenti possono contagiare fornitori e creditori.", en: "Mergers usually lift the target's shares; quarterly results move prices according to the surprise versus expectations; bankruptcies can spill over to suppliers and lenders." },
    sectors: [S("Aziende acquisite", "Acquired companies", 1), S("Creditori dei falliti", "Lenders to failed firms", -1)] },
  { id: "climate", glyph: "☂", label: { it: "Clima e disastri naturali", en: "Climate & natural disasters" },
    query: '(drought OR hurricane OR flood OR wildfire OR earthquake) sourcelang:english',
    keywords: /\b(drought|hurricane|typhoon|flood|wildfire|earthquake|heatwave|climate|siccità|alluvion|terremoto)/i,
    why: { it: "Siccità e alluvioni colpiscono raccolti e prezzi alimentari; uragani e terremoti fermano impianti, porti e raffinerie, e pesano sulle assicurazioni. Gli eventi climatici estremi spingono anche investimenti e regole verdi.", en: "Droughts and floods hit crops and food prices; hurricanes and earthquakes shut plants, ports and refineries and hurt insurers. Extreme weather also drives green investment and rules." },
    sectors: [S("Assicurazioni", "Insurers", -1), S("Agricoltura e alimentare", "Agriculture & food", -1), S("Ricostruzione e materiali", "Rebuilding & materials", 1)] },
  { id: "regulation", glyph: "§", label: { it: "Regole e autorità", en: "Regulation" },
    query: '(antitrust OR regulators OR "European Commission" OR "competition authority" OR "Securities and Exchange Commission") sourcelang:english',
    keywords: /\b(antitrust|regulator|European Commission|competition authority|SEC\b|watchdog|probe|fine[sd]? \$|Consob|Antitrust)/i,
    why: { it: "Multe, indagini antitrust e nuove regole possono limitare i profitti di un'azienda o di un intero settore (tecnologia, banche, farmaceutica, energia). Contano soprattutto le decisioni di Washington e Bruxelles.", en: "Fines, antitrust probes and new rules can cap the profits of a company or a whole sector (tech, banks, pharma, energy). Decisions in Washington and Brussels matter most." },
    sectors: [S("Grandi piattaforme tecnologiche", "Big tech platforms", -1), S("Banche", "Banks", 0), S("Farmaceutica", "Pharma", 0)] },
  { id: "italy", glyph: "❦", label: { it: "Dall'Italia (stampa italiana)", en: "From Italy (Italian press)" },
    query: '(dazi OR BCE OR inflazione OR spread OR Borsa) sourcelang:italian',
    keywords: /\b(Italia|italian|Meloni|Piazza Affari|FTSE MIB|spread BTP|Roma)\b/i,
    why: { it: "Per chi vive in Italia contano spread (costo del debito italiano), decisioni della BCE, tasse e misure del governo, e l'andamento di Piazza Affari, dominata da banche ed energia.", en: "For someone in Italy, the BTP spread (Italy's borrowing cost), ECB decisions, taxes and government measures matter, as does Milan's stock exchange, dominated by banks and energy." },
    sectors: [S("Banche italiane", "Italian banks", 0), S("Energia (Eni, Enel)", "Energy (Eni, Enel)", 0), S("Titoli di Stato (BTP)", "Italian bonds (BTP)", 0)] },
  { id: "markets", glyph: "▤", label: { it: "Mercati e aziende (Alpaca)", en: "Markets & companies (Alpaca)" },
    keywords: /$^/,
    why: { it: "Notizie finanziarie su aziende e mercati americani dall'Alpaca News API (Benzinga), con orari di pubblicazione e aggiornamento.", en: "Financial news on US companies and markets from the Alpaca News API (Benzinga), with publication and update times." },
    sectors: [] },
];

export const GDELT_TOPICS = TOPICS.filter(t => t.query);

// ---------- source credibility ----------
// "major": international wires, leading financial & national newspapers, official bodies.
// "established": recognised national/regional outlets. Everything else is "other" (hidden by default).
const MAJOR = ["reuters.com", "apnews.com", "afp.com", "bloomberg.com", "bnnbloomberg.ca", "ft.com", "wsj.com", "economist.com", "nytimes.com", "washingtonpost.com",
  "bbc.co.uk", "bbc.com", "theguardian.com", "cnbc.com", "marketwatch.com", "barrons.com", "politico.com", "politico.eu", "axios.com", "aljazeera.com", "dw.com",
  "france24.com", "asia.nikkei.com", "nikkei.com", "scmp.com", "ansa.it", "ilsole24ore.com", "corriere.it", "repubblica.it", "lastampa.it", "milanofinanza.it",
  "lemonde.fr", "lesechos.fr", "handelsblatt.com", "spiegel.de", "faz.net", "elpais.com", "cnn.com", "npr.org", "forbes.com", "fortune.com", "finance.yahoo.com",
  "businessinsider.com", "theglobeandmail.com", "economictimes.indiatimes.com", "livemint.com", "straitstimes.com", "ilfattoquotidiano.it", "rainews.it", "tg24.sky.it",
  "ecb.europa.eu", "federalreserve.gov", "imf.org", "worldbank.org", "oecd.org", "un.org", "europa.eu", "benzinga.com", "foxbusiness.com", "cbsnews.com", "abcnews.go.com",
  "nbcnews.com", "time.com", "theatlantic.com", "independent.co.uk", "telegraph.co.uk", "irishtimes.com", "japantimes.co.jp", "koreaherald.com", "abc.net.au", "smh.com.au", "afr.com"];
const ESTABLISHED = ["aol.com", "yahoo.com", "japantoday.com", "asiaone.com", "freemalaysiatoday.com", "hindustantimes.com", "thehindu.com", "ndtv.com", "timesofindia.indiatimes.com",
  "euronews.com", "rfi.fr", "swissinfo.ch", "theconversation.com", "newsweek.com", "usatoday.com", "latimes.com", "chicagotribune.com", "seattletimes.com", "spokesman.com",
  "thehill.com", "cbc.ca", "globalnews.ca", "news.sky.com", "skynews.com.au", "channelnewsasia.com", "dawn.com", "arabnews.com", "thenationalnews.com", "timesofisrael.com",
  "haaretz.com", "jpost.com", "kyivindependent.com", "themoscowtimes.com", "ilgiornale.it", "ilmessaggero.it", "agi.it", "adnkronos.com", "ilpost.it", "money.it", "firstonline.info",
  "investing.com", "fxstreet.com", "kitco.com", "oilprice.com", "rigzone.com", "lloydslist.com", "splash247.com", "theverge.com", "techcrunch.com", "wired.com", "arstechnica.com",
  "semafor.com", "qz.com", "fool.com", "seekingalpha.com", "zacks.com", "morningstar.com", "thestreet.com", "investopedia.com", "nasdaq.com", "theglobeandmail.com"];

export type Tier = "major" | "established" | "other";
export function tierOf(domain: string): Tier {
  const d = domain.replace(/^www\./, "").toLowerCase();
  const hit = (list: string[]) => list.some(x => d === x || d.endsWith("." + x));
  return hit(MAJOR) ? "major" : hit(ESTABLISHED) ? "established" : "other";
}

const PRETTY: Record<string, string> = {
  "reuters.com": "Reuters", "apnews.com": "AP", "bloomberg.com": "Bloomberg", "bnnbloomberg.ca": "BNN Bloomberg", "ft.com": "Financial Times", "wsj.com": "Wall Street Journal",
  "economist.com": "The Economist", "nytimes.com": "New York Times", "bbc.co.uk": "BBC", "bbc.com": "BBC", "theguardian.com": "The Guardian", "cnbc.com": "CNBC",
  "aljazeera.com": "Al Jazeera", "dw.com": "Deutsche Welle", "france24.com": "France 24", "scmp.com": "South China Morning Post", "ansa.it": "ANSA", "ilsole24ore.com": "Il Sole 24 Ore",
  "corriere.it": "Corriere della Sera", "repubblica.it": "la Repubblica", "politico.eu": "Politico Europe", "politico.com": "Politico", "theglobeandmail.com": "The Globe and Mail",
  "economictimes.indiatimes.com": "Economic Times", "livemint.com": "Mint", "benzinga.com": "Benzinga", "foxbusiness.com": "Fox Business", "finance.yahoo.com": "Yahoo Finance",
};
export const prettySource = (domain: string) => PRETTY[domain.replace(/^www\./, "")] ?? domain.replace(/^www\./, "");

// ---------- countries ----------
// ISO3 → [region, case-sensitive name patterns]. Detection reads headlines, so it finds the
// country a story is ABOUT (GDELT's own field only says where the outlet is based).
export type RegionId = "europe" | "namerica" | "latam" | "asia" | "mideast" | "africa";
const C: Record<string, [RegionId, string]> = {
  USA: ["namerica", "United States|U\\.S\\.|US|USA|America|American|Americans|Washington|White House|Trump|Stati Uniti|americano|americana"],
  CAN: ["namerica", "Canada|Canadian|Ottawa|Carney"], MEX: ["latam", "Mexico|Mexican|Messico"],
  BRA: ["latam", "Brazil|Brazilian|Lula|Brasile"], ARG: ["latam", "Argentina|Argentine|Milei"], CHL: ["latam", "Chile|Chilean"], COL: ["latam", "Colombia|Colombian"],
  VEN: ["latam", "Venezuela|Venezuelan|Maduro"], CUB: ["latam", "Cuba|Cuban"], PER: ["latam", "Peru|Peruvian"],
  GBR: ["europe", "Britain|British|UK|U\\.K\\.|London|England|Starmer|Regno Unito|Londra"], IRL: ["europe", "Ireland|Irish"],
  FRA: ["europe", "France|French|Paris|Macron|Francia|Parigi"], DEU: ["europe", "Germany|German|Berlin|Merz|Bundesbank|Germania|tedesc[oa]"],
  ITA: ["europe", "Italy|Italian|Rome|Milan|Meloni|Italia|italian[oa]|Roma|Milano"], ESP: ["europe", "Spain|Spanish|Madrid|Sánchez|Spagna"],
  PRT: ["europe", "Portugal|Portuguese"], NLD: ["europe", "Netherlands|Dutch|Amsterdam"], BEL: ["europe", "Belgium|Belgian"], CHE: ["europe", "Switzerland|Swiss|Svizzera"],
  AUT: ["europe", "Austria|Austrian"], POL: ["europe", "Poland|Polish|Warsaw|Polonia"], HUN: ["europe", "Hungary|Hungarian|Orban|Orbán|Ungheria"],
  GRC: ["europe", "Greece|Greek|Athens|Grecia"], SWE: ["europe", "Sweden|Swedish"], NOR: ["europe", "Norway|Norwegian"], DNK: ["europe", "Denmark|Danish"],
  FIN: ["europe", "Finland|Finnish"], CZE: ["europe", "Czech"], ROU: ["europe", "Romania|Romanian"], SRB: ["europe", "Serbia|Serbian"],
  UKR: ["europe", "Ukraine|Ukrainian|Kyiv|Kiev|Zelensky|Zelenskiy|Ucraina"], RUS: ["europe", "Russia|Russian|Moscow|Kremlin|Putin|Russia|Mosca"],
  BLR: ["europe", "Belarus"], TUR: ["mideast", "Turkey|Turkish|Türkiye|Erdogan|Erdoğan|Ankara|Turchia"], GRL: ["namerica", "Greenland|Groenlandia"],
  ISR: ["mideast", "Israel|Israeli|Netanyahu|Israele"], PSE: ["mideast", "Gaza|Palestinian|West Bank|Hamas"], LBN: ["mideast", "Lebanon|Lebanese|Hezbollah|Libano"],
  SYR: ["mideast", "Syria|Syrian"], IRQ: ["mideast", "Iraq|Iraqi"], IRN: ["mideast", "Iran|Iranian|Tehran|Teheran"], SAU: ["mideast", "Saudi|Riyadh|Arabia Saudita"],
  ARE: ["mideast", "UAE|Emirates|Emirati|Dubai|Abu Dhabi"], QAT: ["mideast", "Qatar|Qatari|Doha"], YEM: ["mideast", "Yemen|Houthi|Houthis"], EGY: ["africa", "Egypt|Egyptian|Cairo|Egitto"],
  CHN: ["asia", "China|Chinese|Beijing|Xi Jinping|Xi|Cina|cinese|Pechino"], TWN: ["asia", "Taiwan|Taiwanese|Taipei"], HKG: ["asia", "Hong Kong"],
  JPN: ["asia", "Japan|Japanese|Tokyo|Giappone"], KOR: ["asia", "South Korea|South Korean|Seoul|Corea del Sud"], PRK: ["asia", "North Korea|North Korean|Pyongyang|Kim Jong"],
  IND: ["asia", "India|Indian|Modi|New Delhi"], PAK: ["asia", "Pakistan|Pakistani"], BGD: ["asia", "Bangladesh"], AFG: ["asia", "Afghanistan|Taliban"],
  VNM: ["asia", "Vietnam|Vietnamese"], IDN: ["asia", "Indonesia|Indonesian|Jakarta"], MYS: ["asia", "Malaysia|Malaysian"], SGP: ["asia", "Singapore"],
  THA: ["asia", "Thailand|Thai"], PHL: ["asia", "Philippines|Philippine|Manila"], AUS: ["asia", "Australia|Australian|Canberra"], NZL: ["asia", "New Zealand"],
  KAZ: ["asia", "Kazakhstan"], AZE: ["asia", "Azerbaijan"], ZAF: ["africa", "South Africa|South African"], NGA: ["africa", "Nigeria|Nigerian"],
  KEN: ["africa", "Kenya|Kenyan"], ETH: ["africa", "Ethiopia|Ethiopian"], SDN: ["africa", "Sudan|Sudanese"], LBY: ["africa", "Libya|Libyan|Libia"],
  DZA: ["africa", "Algeria|Algerian"], MAR: ["africa", "Morocco|Moroccan"], COD: ["africa", "Congo"],
};
const COUNTRY_RE = Object.entries(C).map(([iso, [region, pat]]) => ({ iso, region, re: new RegExp(`(?<![\\w])(?:${pat})(?![\\w])`) }));
const EU_RE = /(?<![\w])(EU|European Union|Brussels|Eurozone|euro zone|Unione europea|Bruxelles|Ue)(?![\w])/;

export const regionOfIso = (iso: string): RegionId | null => C[iso]?.[0] ?? null;
export const TRACKED_ISO = Object.keys(C);

export function detectCountries(text: string) {
  const out = COUNTRY_RE.filter(c => c.re.test(text)).map(c => c.iso);
  return { countries: out, eu: EU_RE.test(text) };
}

// ---------- companies ----------
const COMPANY_PATTERNS: [string, RegExp][] = HEATMAP
  .filter(h => !["V", "META", "GE", "MA", "E"].includes(h.symbol))
  .map(h => [h.symbol, new RegExp(`(?<![\\w])${h.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "['’]")}(?![\\w])`, h.name.length >= 5 ? "i" : "")] as [string, RegExp])
  .concat([["META", /(?<![\w])(Meta Platforms|Facebook|Instagram|WhatsApp|Zuckerberg)(?![\w])/], ["E", /(?<![\w])Eni(?![\w])/],
    ["GOOGL", /(?<![\w])(Google|Alphabet|YouTube)(?![\w])/], ["TSLA", /(?<![\w])(Tesla|Musk)(?![\w])/], ["XOM", /(?<![\w])Exxon(?![\w])/],
    ["TSM", /(?<![\w])TSMC(?![\w])/], ["AMZN", /(?<![\w])(Amazon|AWS)(?![\w])/], ["MSFT", /(?<![\w])(Microsoft|OpenAI)(?![\w])/]]);

export function detectCompanies(text: string) {
  return [...new Set(COMPANY_PATTERNS.filter(([, re]) => re.test(text)).map(([s]) => s))];
}

// ---------- text cleanup (GDELT tokenises punctuation) ----------
export function cleanTitle(t: string) {
  return t
    .replace(/\b([A-Z]) \. ([A-Z]) \./g, "$1.$2.")
    .replace(/\s+([.,;:!?%)’'])/g, "$1")
    .replace(/([(‘])\s+/g, "$1")
    .replace(/(\w) - (\w)/g, "$1-$2")
    .replace(/(\w) ' (\w)/g, "$1'$2")
    .replace(/\$ (\d)/g, "$$$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export const dedupeKey = (title: string) => title.toLowerCase().replace(/[^a-z0-9àèéìòù ]/g, "").split(" ").filter(w => w.length > 2).slice(0, 9).join(" ");

export type IntelItem = {
  id: string; title: string; url: string; domain: string; source: string; tier: Tier;
  sourceCountry: string; lang: string; seen: string; updated?: string; image: string | null;
  topics: TopicId[]; countries: string[]; eu: boolean; symbols: string[]; coverage: number; origin: "gdelt" | "alpaca";
};

export function tagTopics(text: string, base?: TopicId): TopicId[] {
  const t = new Set<TopicId>(base ? [base] : []);
  for (const tp of TOPICS) if (tp.keywords.test(text)) t.add(tp.id);
  return [...t];
}

/** Relevance score: source quality + how many outlets carried it + recency + concrete market links. */
export function score(it: IntelItem, holdings: string[] = []) {
  const tierW = it.tier === "major" ? 3 : it.tier === "established" ? 1.6 : 0.5;
  const hours = (Date.now() - new Date(it.seen).getTime()) / 36e5;
  const recency = Math.max(0, 1.5 - hours / 16);
  const links = Math.min(it.symbols.length, 2) * 0.6 + Math.min(it.countries.length, 3) * 0.2;
  const mine = it.symbols.some(s => holdings.includes(s)) ? 2 : 0;
  return tierW + Math.log2(1 + it.coverage) * 1.4 + recency + links + mine;
}
