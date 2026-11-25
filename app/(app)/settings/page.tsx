"use client";
import { useApi, send } from "@/hooks/useApi";
import { usePrefs } from "@/components/prefs";
import { PanelHead, Skeleton } from "@/components/ui";

type Status = { alpaca: boolean; mode: string; authProtected: boolean; tradingDisabled: boolean; maxOrderNotional: number; providers: Record<string, boolean> };

const PROVIDERS: { key: string; name: string; phase: number; it: string; en: string }[] = [
  { key: "alpaca", name: "Alpaca (paper)", phase: 1, it: "Conto, ordini, prezzi, storico, notizie", en: "Account, orders, prices, history, news" },
  { key: "supabase", name: "Supabase", phase: 1, it: "Database, accessi, diario, biblioteca", en: "Database, sign-in, journal, library" },
  { key: "fmp", name: "Financial Modeling Prep", phase: 2, it: "Bilanci, multipli, stime, screener", en: "Financials, multiples, estimates, screener" },
  { key: "finnhub", name: "Finnhub", phase: 3, it: "Calendario trimestrali ed eventi", en: "Earnings & events calendar" },
  { key: "fred", name: "FRED", phase: 3, it: "Dati macroeconomici USA", en: "US macroeconomic data" },
  { key: "claude", name: "Claude (Anthropic)", phase: 4, it: "Analista AI, briefing, analisi delle notizie", en: "AI analyst, briefings, news analysis" },
];

export default function Settings() {
  const { t, lang, theme, scale, set } = usePrefs();
  const st = useApi<Status>("/api/data/status");
  const logout = async () => { await send("/api/auth", "DELETE"); window.location.href = "/login"; };

  return (
    <div className="page">
      <header className="masthead"><div><div className="kicker">{t.settings}</div><h1 className="h1">{t.settings}</h1></div></header>
      <div className="grid">
        <section className="panel span-6">
          <PanelHead kicker={lang === "it" ? "Lettura" : "Reading"} title={lang === "it" ? "Aspetto" : "Appearance"} />
          <div style={{ display: "grid", gap: "1.2rem" }}>
            <div className="field"><label>{t.language}</label>
              <div className="seg"><button aria-pressed={lang === "it"} onClick={() => set({ lang: "it" })}>Italiano</button><button aria-pressed={lang === "en"} onClick={() => set({ lang: "en" })}>English</button></div></div>
            <div className="field"><label>{t.theme}</label>
              <div className="seg"><button aria-pressed={theme === "light"} onClick={() => set({ theme: "light" })}>{t.light}</button><button aria-pressed={theme === "dark"} onClick={() => set({ theme: "dark" })}>{t.dark}</button></div></div>
            <div className="field"><label>{t.textSize}</label>
              <div className="seg">{(["md", "lg", "xl"] as const).map((s, i) => <button key={s} aria-pressed={scale === s} onClick={() => set({ scale: s })} style={{ fontSize: `${.72 + i * .1}rem` }}>A</button>)}</div></div>
          </div>
        </section>
        <section className="panel span-6 vrule">
          <PanelHead kicker={t.security} title={lang === "it" ? "Accesso e trading" : "Access & trading"} meta={st.meta} />
          {!st.data ? <Skeleton /> : (
            <div className="rows small">
              <div><span>{st.data.authProtected ? t.passcodeOn : t.passcodeOff}</span><b className={st.data.authProtected ? "up" : "down"}>{st.data.authProtected ? "✓" : "!"}</b></div>
              <div><span>{st.data.tradingDisabled ? t.tradingOff : t.tradingOn}</span><b>{st.data.mode.toUpperCase()}</b></div>
              <div><span>{lang === "it" ? "Limite per ordine" : "Per-order limit"}</span><b className="num">${st.data.maxOrderNotional.toLocaleString()}</b></div>
              <div><span>{lang === "it" ? "Trading reale" : "Live trading"}</span><b>{lang === "it" ? "Disattivato (Fase 7)" : "Disabled (Phase 7)"}</b></div>
            </div>
          )}
          <button className="btn ghost" style={{ marginTop: "1rem" }} onClick={logout}>{t.logout}</button>
        </section>
        <section className="panel span-12">
          <PanelHead kicker={t.dataSources} title={lang === "it" ? "Servizi collegati" : "Connected services"} />
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{lang === "it" ? "Servizio" : "Service"}</th><th>{lang === "it" ? "Usato per" : "Used for"}</th><th>{t.phase}</th><th>{t.status}</th></tr></thead>
              <tbody>{PROVIDERS.map(p => (
                <tr key={p.key}><td><b>{p.name}</b></td><td className="small">{p[lang]}</td><td className="num">{p.phase}</td>
                  <td className={st.data?.providers[p.key] ? "up" : "muted"}>{st.data ? (st.data.providers[p.key] ? `● ${t.connected}` : `○ ${t.missing}`) : "…"}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
