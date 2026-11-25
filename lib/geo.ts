// Static geographic knowledge for the World Map. Descriptions are deliberately
// qualitative; figures quoted are widely published approximations.
type L = { it: string; en: string };

export const CHOKEPOINTS: { id: string; at: [number, number]; name: L; note: L }[] = [
  { id: "hormuz", at: [56.3, 26.6], name: { it: "Stretto di Hormuz", en: "Strait of Hormuz" },
    note: { it: "Ci passa circa un quinto del petrolio consumato nel mondo, oltre a molto gas liquefatto del Qatar. Tensioni con l'Iran fanno salire subito petrolio e gas.", en: "About a fifth of the world's oil consumption passes here, plus much of Qatar's LNG. Tension with Iran lifts oil and gas prices immediately." } },
  { id: "bab", at: [43.4, 12.6], name: { it: "Bab el-Mandeb e Mar Rosso", en: "Bab el-Mandeb & Red Sea" },
    note: { it: "Porta d'ingresso al canale di Suez. Gli attacchi degli Houthi dal 2023 hanno costretto molte navi a circumnavigare l'Africa, alzando costi e tempi.", en: "Gateway to the Suez Canal. Houthi attacks since 2023 forced many ships around Africa, raising costs and transit times." } },
  { id: "suez", at: [32.35, 30.6], name: { it: "Canale di Suez", en: "Suez Canal" },
    note: { it: "La scorciatoia tra Asia ed Europa: una quota importante del commercio mondiale, spesso stimata intorno al 12%. Il blocco della Ever Given nel 2021 fermò il traffico per sei giorni.", en: "The Asia–Europe shortcut: a large share of world trade, often estimated around 12%. The Ever Given blockage in 2021 halted traffic for six days." } },
  { id: "malacca", at: [101.0, 2.8], name: { it: "Stretto di Malacca", en: "Strait of Malacca" },
    note: { it: "La via più breve tra Oceano Indiano e Pacifico: passa gran parte del petrolio diretto in Cina, Giappone e Corea.", en: "Shortest link between the Indian Ocean and the Pacific: much of the oil bound for China, Japan and Korea passes here." } },
  { id: "taiwan", at: [119.5, 24.2], name: { it: "Stretto di Taiwan", en: "Taiwan Strait" },
    note: { it: "Rotta navale cruciale e casa di TSMC, che produce la maggior parte dei chip più avanzati al mondo. Una crisi qui colpirebbe tutta l'industria tecnologica.", en: "A crucial shipping lane and home of TSMC, which makes most of the world's most advanced chips. A crisis here would hit the entire tech industry." } },
  { id: "panama", at: [-79.7, 9.1], name: { it: "Canale di Panama", en: "Panama Canal" },
    note: { it: "Collega Atlantico e Pacifico. La siccità del 2023 abbassò il livello dei laghi che lo alimentano e ridusse i passaggi, rallentando il commercio americano.", en: "Links the Atlantic and Pacific. The 2023 drought lowered the lakes feeding it and cut transits, slowing US trade." } },
  { id: "bosphorus", at: [29.05, 41.1], name: { it: "Bosforo", en: "Bosphorus" },
    note: { it: "Unica uscita del Mar Nero: grano ucraino e russo, petrolio russo e del Caspio.", en: "The Black Sea's only exit: Ukrainian and Russian grain, Russian and Caspian oil." } },
  { id: "gibraltar", at: [-5.6, 35.95], name: { it: "Stretto di Gibilterra", en: "Strait of Gibraltar" },
    note: { it: "Porta tra Mediterraneo e Atlantico, per l'Italia la via verso le Americhe e il Nord Europa.", en: "Gate between the Mediterranean and the Atlantic: Italy's route to the Americas and Northern Europe." } },
  { id: "cape", at: [18.5, -34.4], name: { it: "Capo di Buona Speranza", en: "Cape of Good Hope" },
    note: { it: "L'alternativa quando il Mar Rosso è insicuro: circa 10–14 giorni di viaggio in più tra Asia ed Europa.", en: "The alternative when the Red Sea is unsafe: roughly 10–14 extra days between Asia and Europe." } },
];

export const ROUTES: { id: string; name: L; path: [number, number][]; kind: "goods" | "energy" }[] = [
  { id: "asia-europe", kind: "goods", name: { it: "Asia–Europa via Suez (container)", en: "Asia–Europe via Suez (containers)" },
    path: [[121.5, 31], [114, 21], [103.8, 1.3], [80, 6], [52, 13], [43.4, 12.6], [38, 21], [32.5, 29.9], [32.3, 31.3], [20, 35], [12, 37.5], [-5.6, 35.95], [-9.5, 39], [-5, 48.5], [4, 51.9]] },
  { id: "gulf-asia", kind: "energy", name: { it: "Petrolio dal Golfo verso l'Asia", en: "Gulf oil to Asia" },
    path: [[50.5, 27], [56.3, 26.6], [60, 22], [75, 9], [95, 6], [101, 2.8], [105, 4], [115, 15], [122, 25], [135, 33.5]] },
  { id: "gulf-europe", kind: "energy", name: { it: "Petrolio e gas dal Golfo verso l'Europa", en: "Gulf oil & gas to Europe" },
    path: [[51.5, 25.5], [56.3, 26.6], [58.5, 22], [52, 13], [43.4, 12.6], [38, 21], [32.5, 29.9], [32.3, 31.3], [22, 34], [15, 38], [13.5, 45.5]] },
  { id: "cape", kind: "goods", name: { it: "Rotta del Capo (alternativa a Suez)", en: "Cape route (Suez alternative)" },
    path: [[103.8, 1.3], [80, -8], [45, -28], [18.5, -34.4], [5, -15], [-15, 10], [-15, 28], [-9.5, 39], [-5, 48.5], [4, 51.9]] },
  { id: "transpacific", kind: "goods", name: { it: "Transpacifico Asia–Stati Uniti", en: "Transpacific Asia–US" },
    path: [[121.5, 31], [140, 35], [180, 42], [-150, 42], [-118.2, 33.8]] },
  { id: "transatlantic", kind: "goods", name: { it: "Transatlantico Europa–Stati Uniti", en: "Transatlantic Europe–US" },
    path: [[4, 51.9], [-5, 49.5], [-40, 45], [-74, 40.5]] },
  { id: "panama", kind: "goods", name: { it: "Costa est USA–Asia via Panama", en: "US East Coast–Asia via Panama" },
    path: [[-74, 40.5], [-75, 25], [-79.9, 9.4], [-79.5, 8.8], [-100, 12], [-140, 25], [180, 32], [135, 33.5]] },
];

/** US-listed ETFs that track each country's stock market (proxies). */
export const COUNTRY_ETF: Record<string, string> = {
  USA: "SPY", CAN: "EWC", MEX: "EWW", BRA: "EWZ", ARG: "ARGT", CHL: "ECH", PER: "EPU",
  GBR: "EWU", IRL: "EIRL", FRA: "EWQ", DEU: "EWG", ITA: "EWI", ESP: "EWP", NLD: "EWN", BEL: "EWK", CHE: "EWL", AUT: "EWO",
  SWE: "EWD", NOR: "NORW", DNK: "EDEN", FIN: "EFNL", POL: "EPOL", GRC: "GREK", TUR: "TUR", ISR: "EIS", SAU: "KSA", ARE: "UAE", QAT: "QAT",
  ZAF: "EZA", CHN: "MCHI", HKG: "EWH", TWN: "EWT", JPN: "EWJ", KOR: "EWY", IND: "INDA", IDN: "EIDO", MYS: "EWM", SGP: "EWS", THA: "THD",
  PHL: "EPHE", VNM: "VNM", AUS: "EWA", NZL: "ENZL",
};

/** Home country of tracked securities (others default to the US when listed there). */
export const SYMBOL_COUNTRY: Record<string, string> = {
  RACE: "ITA", STLA: "ITA", E: "ITA", EWI: "ITA", ASML: "NLD", SAP: "DEU", NVO: "DNK", NVS: "CHE", AZN: "GBR", GSK: "GBR", SNY: "FRA",
  SHEL: "GBR", BP: "GBR", TTE: "FRA", EQNR: "NOR", UL: "GBR", DEO: "GBR", BTI: "GBR", HSBC: "GBR", ING: "NLD", UBS: "CHE", TSM: "TWN",
  ...Object.fromEntries(Object.entries(COUNTRY_ETF).map(([iso, etf]) => [etf, iso])),
};
