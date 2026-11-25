"use client";
import { useMemo, useState } from "react";
import { usePrefs } from "@/components/prefs";
import { PanelHead } from "@/components/ui";
import { GLOSSARY, LESSONS } from "@/lib/academy";

export default function Academy() {
  const { lang } = usePrefs();
  const it = lang === "it";
  const [open, setOpen] = useState<string | null>(LESSONS[0].id);
  const [q, setQ] = useState("");
  const terms = useMemo(() => {
    const t = q.trim().toLowerCase();
    return [...GLOSSARY].sort((a, b) => a.term[lang].localeCompare(b.term[lang], lang))
      .filter(x => !t || x.term[lang].toLowerCase().includes(t) || x.def[lang].toLowerCase().includes(t));
  }, [q, lang]);
  const levels = { 1: it ? "Base" : "Basics", 2: it ? "Intermedio" : "Intermediate", 3: it ? "Avanzato" : "Advanced" };

  return (
    <div className="page">
      <header className="masthead">
        <div>
          <div className="kicker">{it ? "Accademia" : "Academy"}</div>
          <h1 className="h1">{it ? "Capire, prima di investire" : "Understand before you invest"}</h1>
          <p className="lede" style={{ margin: ".4rem 0 0" }}>{it ? "Lezioni brevi e un glossario dei termini usati nell'app." : "Short lessons and a glossary of the terms used in the app."}</p>
        </div>
      </header>
      <div className="grid">
        <section className="panel span-7">
          <PanelHead kicker={it ? "Lezioni" : "Lessons"} title={it ? `${LESSONS.length} lezioni` : `${LESSONS.length} lessons`} />
          {LESSONS.map((l, i) => {
            const isOpen = open === l.id;
            return (
              <article key={l.id} className="story" style={{ padding: "1.1rem 0" }}>
                <button onClick={() => setOpen(isOpen ? null : l.id)} aria-expanded={isOpen}
                  style={{ background: "none", border: 0, padding: 0, cursor: "pointer", textAlign: "left", color: "inherit", width: "100%", display: "grid", gridTemplateColumns: "2.6rem 1fr auto", gap: ".8rem", alignItems: "baseline" }}>
                  <span className="display" style={{ fontSize: "1.8rem", color: "var(--accent-ink)" }}>{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="h3" style={{ display: "block" }}>{l.title[lang]}</span>
                    <span className="tiny muted">{levels[l.level]} · {l.minutes} min</span>
                  </span>
                  <span className="muted">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div style={{ paddingLeft: "3.4rem", marginTop: ".7rem" }}>
                    <p className="lede" style={{ fontSize: "1.15rem", borderLeft: "2px solid var(--accent)", paddingLeft: ".9rem" }}>{l.key[lang]}</p>
                    {l.body.map((p, k) => <p key={k}>{p[lang]}</p>)}
                  </div>
                )}
              </article>
            );
          })}
        </section>
        <aside className="panel span-5 vrule">
          <PanelHead kicker={it ? "Glossario" : "Glossary"} title={it ? "Le parole della finanza" : "The words of finance"} />
          <input className="input" placeholder={it ? "Cerca un termine…" : "Search a term…"} value={q} onChange={e => setQ(e.target.value)} style={{ marginBottom: ".8rem" }} />
          <dl style={{ margin: 0 }}>
            {terms.map(t => (
              <div key={t.id} id={t.id} className="glossary-term" style={{ padding: ".7rem 0", borderBottom: "1px solid var(--rule)" }}>
                <dt className="h3" style={{ fontSize: "1.1rem" }}>{t.term[lang]}</dt>
                <dd style={{ margin: ".2rem 0 0" }} className="small">{t.def[lang]}</dd>
              </div>
            ))}
            {!terms.length && <p className="muted small">{it ? "Nessun termine trovato." : "No term found."}</p>}
          </dl>
          <p className="tiny muted" style={{ marginTop: "1rem" }}>{it ? "Contenuto educativo, non consulenza finanziaria." : "Educational content, not financial advice."}</p>
        </aside>
      </div>
    </div>
  );
}
