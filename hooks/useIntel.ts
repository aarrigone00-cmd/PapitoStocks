"use client";
import { useEffect, useRef, useState } from "react";
import { GDELT_TOPICS, dedupeKey, detectCompanies, detectCountries, tagTopics, type IntelItem, type TopicId } from "@/lib/intel";
import type { Meta, NewsItem } from "@/lib/types";

export type TopicStatus = { id: TopicId; state: "pending" | "ok" | "error"; meta?: Meta; error?: string; count?: number };

function fromAlpaca(n: NewsItem): IntelItem {
  const text = `${n.headline} ${n.summary}`;
  const { countries, eu } = detectCountries(n.headline);
  return {
    id: "a" + n.id, title: n.headline, url: n.url, domain: "benzinga.com", source: n.source === "benzinga" ? "Benzinga" : n.source,
    tier: "major", sourceCountry: "United States", lang: "English", seen: n.createdAt, updated: n.updatedAt, image: n.image,
    topics: tagTopics(text, "markets"), countries, eu, symbols: [...new Set([...n.symbols, ...detectCompanies(n.headline)])], coverage: 1, origin: "alpaca",
  };
}

function merge(list: IntelItem[]) {
  const byKey = new Map<string, IntelItem>();
  for (const it of list) {
    const k = dedupeKey(it.title);
    const prev = byKey.get(k);
    if (!prev) { byKey.set(k, it); continue; }
    byKey.set(k, {
      ...prev,
      topics: [...new Set([...prev.topics, ...it.topics])],
      countries: [...new Set([...prev.countries, ...it.countries])],
      symbols: [...new Set([...prev.symbols, ...it.symbols])],
      coverage: Math.max(prev.coverage, it.coverage),
      seen: prev.seen < it.seen ? prev.seen : it.seen,
    });
  }
  return [...byKey.values()];
}

/** Loads every GDELT topic one after another (GDELT allows ~1 request / 5 s), plus Alpaca news. */
export function useIntel(topics: TopicId[] = GDELT_TOPICS.map(t => t.id)) {
  const [items, setItems] = useState<IntelItem[]>([]);
  const [status, setStatus] = useState<TopicStatus[]>(() => topics.map(id => ({ id, state: "pending" })));
  const [alpacaMeta, setAlpacaMeta] = useState<Meta | null>(null);
  const key = topics.join(",");
  const raw = useRef<IntelItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    raw.current = [];
    const push = (more: IntelItem[]) => { raw.current = [...raw.current, ...more]; if (!cancelled) setItems(merge(raw.current)); };
    (async () => {
      try {
        const r = await fetch("/api/data/news?limit=50", { cache: "no-store" });
        const j = await r.json();
        if (r.ok && j.data && j.meta?.source === "alpaca") { push((j.data as NewsItem[]).map(fromAlpaca)); setAlpacaMeta(j.meta); }
      } catch { /* news optional */ }
      for (const id of key.split(",") as TopicId[]) {
        if (cancelled) return;
        try {
          const r = await fetch(`/api/intel?topic=${id}`, { cache: "no-store" });
          if (r.status === 401) { window.location.href = "/login"; return; }
          const j = await r.json();
          if (!r.ok || j.error) throw new Error(j.error ?? `HTTP ${r.status}`);
          push(j.data as IntelItem[]);
          if (!cancelled) setStatus(s => s.map(x => x.id === id ? { id, state: "ok", meta: j.meta, count: (j.data as IntelItem[]).length } : x));
        } catch (e) {
          if (!cancelled) setStatus(s => s.map(x => x.id === id ? { id, state: "error", error: e instanceof Error ? e.message : String(e) } : x));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [key]);

  return { items, status, alpacaMeta, done: status.every(s => s.state !== "pending") };
}
