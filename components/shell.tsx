"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { GROUPS, ALL_SECTIONS } from "@/lib/sections";
import { useApi } from "@/hooks/useApi";
import { usePrefs } from "./prefs";
import { pct, dir, usd } from "@/lib/format";
import type { Quote } from "@/lib/types";

type IndexRow = { symbol: string; index: string; quote: Quote | null };

function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { lang, t } = usePrefs();
  const path = usePathname();
  const [closed, setClosed] = useState<string[]>([]);
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <aside className="side" data-open={open} aria-label="Navigation">
      <div className="side-brand">
        <Link href="/" className="brand-mark" onClick={onNavigate}>
          <span className="monogram">P</span>
          <span>
            <div className="brand-name">Papitostocks</div>
            <div className="brand-sub">{t.subtitle}</div>
          </span>
        </Link>
      </div>
      <nav className="nav">
        {GROUPS.map(g => {
          const isOpen = !closed.includes(g.id);
          return (
            <div key={g.id} className="nav-group" data-open={isOpen}>
              <button onClick={() => setClosed(c => (isOpen ? [...c, g.id] : c.filter(x => x !== g.id)))} aria-expanded={isOpen}>
                <span>{g.title[lang]}</span><span aria-hidden>▾</span>
              </button>
              {isOpen && g.items.map(s => (
                <Link key={s.slug} href={s.href} className="nav-link" aria-current={isActive(s.href) ? "page" : undefined} onClick={onNavigate}>
                  <span className="nav-glyph" aria-hidden>{s.glyph}</span>
                  <span>{s.title[lang]}</span>
                  {!s.live && <span className="soon">{t.phase} {s.phase}</span>}
                </Link>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="side-foot">
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: ".95rem", color: "#D9D2BF" }}>{t.tagline}</div>
      </div>
    </aside>
  );
}

function Search() {
  const { lang, t } = usePrefs();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const [remote, setRemote] = useState<{ symbol: string; name: string }[]>([]);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 1) return;
    const id = setTimeout(async () => {
      try {
        const r = await fetch(`/api/data/search?q=${encodeURIComponent(term)}`);
        const j = await r.json();
        setRemote(j.data ?? []);
      } catch { setRemote([]); }
    }, 220);
    return () => clearTimeout(id);
  }, [q]);

  const sections = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? ALL_SECTIONS.filter(s => s.title[lang].toLowerCase().includes(term) || s.title.en.toLowerCase().includes(term)).slice(0, 4) : [];
  }, [q, lang]);

  const results = [
    ...(q.trim() ? remote : []).slice(0, 7).map(r => ({ href: `/research/${r.symbol}`, label: r.name, right: r.symbol, group: lang === "it" ? "Aziende" : "Companies" })),
    ...sections.map(s => ({ href: s.href, label: s.title[lang], right: s.live ? "→" : `${t.phase} ${s.phase}`, group: lang === "it" ? "Sezioni" : "Sections" })),
  ];

  const go = (href: string) => { setQ(""); setFocus(false); router.push(href); };

  return (
    <div className="search" ref={box} onBlur={e => { if (!box.current?.contains(e.relatedTarget as Node)) setFocus(false); }}>
      <span className="glass" aria-hidden>⌕</span>
      <input
        value={q} placeholder={t.searchPh} aria-label={t.searchPh}
        onFocus={() => setFocus(true)}
        onChange={e => { setQ(e.target.value); setActive(0); }}
        onKeyDown={e => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
          if (e.key === "Enter" && results[active]) go(results[active].href);
          if (e.key === "Escape") setFocus(false);
        }}
      />
      {focus && results.length > 0 && (
        <div className="search-results" role="listbox">
          {results.map((r, i) => (
            <div key={r.href + i}>
              {(i === 0 || results[i - 1].group !== r.group) && <div className="grp kicker">{r.group}</div>}
              <a href={r.href} data-active={i === active} onMouseDown={e => { e.preventDefault(); go(r.href); }}>
                <span>{r.label}</span><span className="muted num">{r.right}</span>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Ticker() {
  const { lang } = usePrefs();
  const { data } = useApi<IndexRow[]>("/api/data/indices", 60_000);
  if (!data) return <div className="ticker"><div className="loader-line" /></div>;
  const items = data.map(r => (
    <span key={r.symbol} className="ticker-item">
      <b>{r.index}</b>
      <span className="num">{usd(r.quote?.price, lang)}</span>
      <span className={dir(r.quote?.changePct)}>{pct(r.quote?.changePct, lang)}</span>
    </span>
  ));
  return (
    <div className="ticker" aria-label="Indices">
      <div className="ticker-track">{items}{items.map((el, i) => <span key={"d" + i} aria-hidden>{el}</span>)}</div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { t, lang, set, theme } = usePrefs();
  const [open, setOpen] = useState(false);
  const { data: status } = useApi<{ alpaca: boolean }>("/api/data/status");

  return (
    <div className="shell">
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(o => !o)} aria-label="Menu">☰</button>
          <Search />
          <div className="top-meta">
            {status && <span className={`mode-badge ${status.alpaca ? "" : "demo"}`}>{status.alpaca ? t.paper : t.demo}</span>}
            <button className="icon-btn hide-sm" onClick={() => set({ lang: lang === "it" ? "en" : "it" })} aria-label={t.language}>{lang === "it" ? "EN" : "IT"}</button>
            <button className="icon-btn" onClick={() => set({ theme: theme === "light" ? "dark" : "light" })} aria-label={t.theme}>{theme === "light" ? "☾" : "☀"}</button>
          </div>
        </header>
        <Ticker />
        {children}
      </div>
    </div>
  );
}
