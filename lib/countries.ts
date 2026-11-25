import countries from "i18n-iso-countries";
import it from "i18n-iso-countries/langs/it.json";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(it);
countries.registerLocale(en);

const SHORT: Record<string, [string, string]> = {
  USA: ["Stati Uniti", "United States"], GBR: ["Regno Unito", "United Kingdom"], RUS: ["Russia", "Russia"], KOR: ["Corea del Sud", "South Korea"],
  PRK: ["Corea del Nord", "North Korea"], IRN: ["Iran", "Iran"], SYR: ["Siria", "Syria"], VEN: ["Venezuela", "Venezuela"], TWN: ["Taiwan", "Taiwan"],
  PSE: ["Palestina", "Palestine"], COD: ["Congo (RD)", "DR Congo"], CZE: ["Cechia", "Czechia"], TUR: ["Turchia", "Türkiye"], VNM: ["Vietnam", "Vietnam"],
};
export const countryName = (iso3: string, lang: "it" | "en") =>
  SHORT[iso3]?.[lang === "it" ? 0 : 1] ?? countries.getName(iso3, lang) ?? iso3;
export const numericToIso3 = (n: string) => countries.numericToAlpha3(n) ?? null;
export const iso3ToIso2 = (a3: string) => countries.alpha3ToAlpha2(a3) ?? null;
export const flag = (iso3: string) => {
  const a2 = iso3ToIso2(iso3);
  return a2 ? String.fromCodePoint(...[...a2.toUpperCase()].map(c => 0x1f1a5 + c.charCodeAt(0))) : "";
};
