"use client";
import Link from "next/link";
import { usePrefs } from "./prefs";
import { ago, isToday } from "@/lib/format";
import type { NewsItem } from "@/lib/types";

export function NewsList({ items, compactMode = false }: { items: NewsItem[]; compactMode?: boolean }) {
  const { t, lang } = usePrefs();
  return (
    <div>
      {items.map(n => (
        <article key={n.id} className="story" style={compactMode ? { padding: ".7rem 0" } : undefined}>
          <a href={n.url} target="_blank" rel="noopener noreferrer">
            <h3 className="h3" style={compactMode ? { fontSize: "1.05rem" } : undefined}>{n.headline}</h3>
          </a>
          <div className="story-meta">
            {isToday(n.createdAt) && <span className="tag today">{t.todayNews}</span>}
            <span>{n.source}</span>
            <span title={new Date(n.createdAt).toLocaleString()}>{ago(n.createdAt, lang)}</span>
            {n.symbols.slice(0, 4).map(s => <Link key={s} href={`/research/${s}`} className="tag">{s}</Link>)}
          </div>
        </article>
      ))}
    </div>
  );
}
