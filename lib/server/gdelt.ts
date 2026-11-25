import "server-only";
import { unstable_cache } from "next/cache";
import { GDELT_TOPICS, cleanTitle, dedupeKey, detectCompanies, detectCountries, prettySource, tagTopics, tierOf, type IntelItem, type TopicId } from "@/lib/intel";

// GDELT DOC 2.0 API: free, no key, global news monitoring in 65 languages.
// Rate limit: one request every 5 seconds per IP. We therefore cache each topic
// for 20 minutes in Next's shared data cache and retry politely on HTTP 429.
const BASE = "https://api.gdeltproject.org/api/v2/doc/doc";
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

type Raw = { url: string; title: string; seendate: string; socialimage?: string; domain: string; language: string; sourcecountry: string };

async function fetchGdelt(query: string): Promise<Raw[]> {
  const qs = new URLSearchParams({ query, mode: "artlist", format: "json", maxrecords: "120", sort: "hybridrel", timespan: "24h" });
  let last = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) await sleep(5500);
    try {
      const r = await fetch(`${BASE}?${qs}`, { cache: "no-store", signal: AbortSignal.timeout(20_000), headers: { "User-Agent": "Papitostocks/1.0 (private research app)" } });
      const text = await r.text();
      if (r.status === 429 || text.startsWith("Please limit")) { last = "rate limited"; continue; }
      if (!r.ok) { last = `HTTP ${r.status}`; continue; }
      if (!text.trim().startsWith("{")) throw new Error(text.slice(0, 120)); // GDELT reports query errors as plain text
      const j = JSON.parse(text) as { articles?: Raw[] };
      return j.articles ?? [];
    } catch (e) { last = e instanceof Error ? e.message : String(e); }
  }
  throw new Error(`GDELT unavailable (${last})`);
}

const toIso = (s: string) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}Z`;

function hash(s: string) { let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return h.toString(36); }

function normalise(raw: Raw[], topic: TopicId): IntelItem[] {
  const groups = new Map<string, Raw[]>();
  for (const r of raw) {
    const t = cleanTitle(r.title);
    if (t.length < 20) continue;
    const k = dedupeKey(t);
    groups.set(k, [...(groups.get(k) ?? []), { ...r, title: t }]);
  }
  const rank = { major: 0, established: 1, other: 2 };
  return [...groups.values()].map(g => {
    const best = [...g].sort((a, b) => rank[tierOf(a.domain)] - rank[tierOf(b.domain)] || a.seendate.localeCompare(b.seendate))[0];
    const first = g.reduce((m, x) => (x.seendate < m ? x.seendate : m), g[0].seendate);
    const { countries, eu } = detectCountries(best.title);
    return {
      id: hash(best.url), title: best.title, url: best.url, domain: best.domain, source: prettySource(best.domain), tier: tierOf(best.domain),
      sourceCountry: best.sourcecountry, lang: best.language, seen: toIso(first),
      image: best.socialimage && /^https:\/\//.test(best.socialimage) ? best.socialimage : null,
      topics: tagTopics(best.title, topic), countries, eu, symbols: detectCompanies(best.title),
      coverage: new Set(g.map(x => x.domain)).size, origin: "gdelt" as const,
    };
  });
}

const cachedTopic = unstable_cache(
  async (topic: TopicId) => {
    const t = GDELT_TOPICS.find(x => x.id === topic);
    if (!t?.query) throw new Error("Unknown topic");
    const items = normalise(await fetchGdelt(t.query), topic);
    return { items, fetchedAt: new Date().toISOString() };
  },
  ["gdelt-topic-v1"],
  { revalidate: 1200 },
);

// Last good result per topic in this server instance, used if GDELT is down.
const lastGood = new Map<TopicId, { items: IntelItem[]; fetchedAt: string }>();

export async function topicNews(topic: TopicId): Promise<{ items: IntelItem[]; fetchedAt: string; stale: boolean }> {
  try {
    const r = await cachedTopic(topic);
    lastGood.set(topic, r);
    return { ...r, stale: false };
  } catch (e) {
    const prev = lastGood.get(topic);
    if (prev) return { ...prev, stale: true };
    throw e;
  }
}
