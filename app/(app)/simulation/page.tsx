"use client";
import { useCallback, useMemo, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { usePrefs } from "@/components/prefs";
import { PanelHead, Skeleton, ErrorNote } from "@/components/ui";
import { PortfolioPicker, type Picked } from "@/components/portfolio-picker";
import { BarList, FanChart, LinesChart } from "@/components/svgcharts";
import { alignedReturns, beta, compound, logStats, maxDrawdown, monteCarlo, portfolioSeries } from "@/lib/analytics";
import { SCENARIOS, HISTORY } from "@/lib/scenarios";
import { sectorOf } from "@/lib/classify";
import { usd, pct, num } from "@/lib/format";
import type { Bar } from "@/lib/types";

type Tab = "compound" | "mc" | "history" | "shock" | "backtest";

function NumField({ label, value, onChange, suffix, step = 1 }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; step?: number }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
        <input className="input num" inputMode="decimal" value={value} step={step}
          onChange={e => onChange(Number(e.target.value.replace(",", ".").replace(/[^\d.-]/g, "")) || 0)} />
        {suffix && <span className="small muted">{suffix}</span>}
      </div>
    </div>
  );
}

export default function SimulationLab() {
  const { lang } = usePrefs();
  const it = lang === "it";
  const [tab, setTab] = useState<Tab>("compound");
  const [picked, setPicked] = useState<Picked | null>(null);
  const onPick = useCallback((p: Picked | null) => setPicked(p), []);
  const needsData = tab !== "compound";
  const symbols = picked ? [...new Set([...picked.symbols, "SPY"])] : [];
  const bars = useApi<Record<string, Bar[]>>(needsData && symbols.length ? `/api/data/multibars?range=MAX&symbols=${symbols.join(",")}` : null);

  // ---------- shared portfolio statistics from weekly history ----------
  const stats = useMemo(() => {
    if (!picked || !bars.data) return null;
    const usable = picked.symbols.filter(s => (bars.data![s]?.length ?? 0) > 52);
    if (!usable.length) return null;
    const w0 = usable.map(s => picked.weights[picked.symbols.indexOf(s)]);
    const ws = w0.reduce((a, b) => a + b, 0), w = w0.map(x => x / ws);
    const { dates, rets, prices } = alignedReturns(bars.data, [...usable, "SPY"]);
    const hold = rets.slice(0, usable.length), mkt = rets[usable.length];
    const port = portfolioSeries(w, hold);
    const betas = hold.map(r => beta(r, mkt));
    return { usable, w, dates, hold, mkt, port, prices, betas, pBeta: beta(port, mkt), log: logStats(port, 52), mlog: logStats(mkt, 52) };
  }, [picked, bars.data]);

  // ---------- compound ----------
  const [c, setC] = useState({ initial: 10000, monthly: 300, years: 20, ret: 7, infl: 2 });
  const comp = useMemo(() => compound(c.initial, c.monthly, Math.min(c.years, 60), c.ret / 100, c.infl / 100), [c]);
  const last = comp[comp.length - 1];

  // ---------- monte carlo ----------
  const [mc, setMc] = useState({ monthly: 0, years: 15, infl: true, muOverride: "", sigmaOverride: "" });
  const mcParams = stats ? {
    mu: mc.muOverride !== "" ? Math.log(1 + Number(mc.muOverride) / 100) : stats.log.mu,
    sigma: mc.sigmaOverride !== "" ? Number(mc.sigmaOverride) / 100 : stats.log.sigma,
  } : null;
  const mcRows = useMemo(() => mcParams && picked ? monteCarlo({ initial: picked.value, monthly: mc.monthly, years: Math.min(mc.years, 40), mu: mcParams.mu, sigma: mcParams.sigma, inflation: mc.infl ? 0.02 : 0 }) : null,
    [mcParams?.mu, mcParams?.sigma, picked?.value, mc.monthly, mc.years, mc.infl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- shocks ----------
  const [scId, setScId] = useState(SCENARIOS[0].id);
  const sc = SCENARIOS.find(s => s.id === scId)!;
  const shock = useMemo(() => {
    if (!picked) return null;
    const per = picked.symbols.map((s, i) => {
      const bi = stats?.usable.indexOf(s) ?? -1;
      const b = bi >= 0 ? stats!.betas[bi] : 1;
      const imp = sc.betaMove != null ? Math.max(-90, b * sc.betaMove) : (sc.impact[sectorOf(s)] ?? sc.base);
      return { s, w: picked.weights[i], imp };
    });
    const central = per.reduce((t, x) => t + x.w * x.imp, 0);
    const lo = central < 0 ? central * 1.6 : central * 0.5, hi = central < 0 ? central * 0.5 : central * 1.6;
    const fx = sc.fx ?? 0;
    const eur = ((1 + central / 100) * (1 + fx / 100) - 1) * 100;
    return { per, central, lo, hi, fx, eur };
  }, [picked, stats, sc]);

  const TABS: [Tab, string][] = [
    ["compound", it ? "Interesse composto" : "Compound interest"], ["mc", "Monte Carlo"],
    ["history", it ? "Crolli storici" : "Historical crashes"], ["shock", it ? "Simulatore di shock" : "Shock simulator"], ["backtest", "Backtest"],
  ];

  return (
    <div className="page">
      <header className="masthead">
        <div>
          <div className="kicker">{it ? "Laboratorio di simulazione" : "Simulation laboratory"}</div>
          <h1 className="h1">{it ? "E se…?" : "What if…?"}</h1>
          <p className="lede" style={{ margin: ".4rem 0 0" }}>{it ? "Esplora risultati ipotetici senza rischiare un euro. Nessuna simulazione è una previsione." : "Explore hypothetical outcomes without risking a cent. No simulation is a forecast."}</p>
        </div>
      </header>
      <div className="tabs-line" role="tablist">{TABS.map(([k, l]) => <button key={k} aria-pressed={tab === k} onClick={() => setTab(k)}>{l}</button>)}</div>

      {needsData && <PortfolioPicker onChange={onPick} />}
      {needsData && bars.error && <ErrorNote error={bars.error} onRetry={bars.reload} />}
      {needsData && picked && !bars.data && !bars.error && <Skeleton lines={8} />}

      {tab === "compound" && (
        <div className="grid">
          <section className="panel span-4">
            <PanelHead kicker={it ? "Ipotesi" : "Assumptions"} title={it ? "I tuoi numeri" : "Your numbers"} />
            <div style={{ display: "grid", gap: "1rem" }}>
              <NumField label={it ? "Capitale iniziale" : "Initial amount"} value={c.initial} onChange={v => setC({ ...c, initial: v })} suffix="$" />
              <NumField label={it ? "Versamento mensile" : "Monthly contribution"} value={c.monthly} onChange={v => setC({ ...c, monthly: v })} suffix="$" />
              <NumField label={it ? "Anni" : "Years"} value={c.years} onChange={v => setC({ ...c, years: Math.max(1, Math.min(60, v)) })} />
              <NumField label={it ? "Rendimento annuo ipotizzato" : "Assumed annual return"} value={c.ret} onChange={v => setC({ ...c, ret: v })} suffix="%" />
              <NumField label={it ? "Inflazione annua" : "Annual inflation"} value={c.infl} onChange={v => setC({ ...c, infl: v })} suffix="%" />
            </div>
            <p className="tiny muted">{it ? "Dal 1928 l'S&P 500 ha reso in media circa il 10% l'anno prima dell'inflazione, ma con anni molto negativi. Il 7% è un'ipotesi prudente, non una promessa." : "Since 1928 the S&P 500 has averaged roughly 10% a year before inflation, with some very bad years. 7% is a cautious assumption, not a promise."}</p>
          </section>
          <section className="panel span-8 vrule">
            <PanelHead kicker={it ? "Risultato" : "Result"} title={`${usd(last.value, lang, 0)} ${it ? "dopo" : "after"} ${last.year} ${it ? "anni" : "years"}`} />
            <div className="stats">
              <div className="stat"><div className="label">{it ? "Versato in totale" : "Total contributed"}</div><div className="figure-sm">{usd(last.contributed, lang, 0)}</div></div>
              <div className="stat"><div className="label">{it ? "Guadagno dagli interessi" : "Growth from returns"}</div><div className="figure-sm up">{usd(last.value - last.contributed, lang, 0)}</div></div>
              <div className="stat"><div className="label">{it ? "Valore in potere d'acquisto di oggi" : "Value in today's money"}</div><div className="figure-sm">{usd(last.real, lang, 0)}</div></div>
            </div>
            <LinesChart xLabels={comp.map(r => String(r.year))} series={[
              { label: it ? "Valore" : "Value", values: comp.map(r => r.value), color: "var(--forest)" },
              { label: it ? "Valore reale (al netto dell'inflazione)" : "Real value (after inflation)", values: comp.map(r => r.real), color: "var(--accent)" },
              { label: it ? "Soldi versati" : "Money paid in", values: comp.map(r => r.contributed), color: "var(--muted)", dashed: true },
            ]} />
            <p className="small">{it ? "L'interesse composto è il guadagno sui guadagni: col tempo la parte che cresce da sola supera quella versata. Per questo il tempo conta più del momento in cui si entra." : "Compound interest is earning on earnings: over time the self-grown part overtakes what you paid in. That's why time matters more than timing."}</p>
          </section>
        </div>
      )}

      {tab === "mc" && stats && mcRows && mcParams && picked && (
        <div className="grid">
          <section className="panel span-4">
            <PanelHead kicker={it ? "Ipotesi" : "Assumptions"} title="Monte Carlo" meta={bars.meta} />
            <div style={{ display: "grid", gap: "1rem" }}>
              <div className="small">{it ? "Capitale iniziale" : "Starting value"}: <b>{usd(picked.value, lang, 0)}</b></div>
              <NumField label={it ? "Versamento mensile" : "Monthly contribution"} value={mc.monthly} onChange={v => setMc({ ...mc, monthly: v })} suffix="$" />
              <NumField label={it ? "Anni" : "Years"} value={mc.years} onChange={v => setMc({ ...mc, years: Math.max(1, Math.min(40, v)) })} />
              <div className="field"><label>{it ? "Rendimento atteso annuo (vuoto = storico)" : "Expected annual return (blank = historical)"}</label>
                <input className="input num" placeholder={pct((Math.exp(stats.log.mu) - 1) * 100, lang, false)} value={mc.muOverride} onChange={e => setMc({ ...mc, muOverride: e.target.value.replace(",", ".") })} /></div>
              <div className="field"><label>{it ? "Volatilità annua (vuoto = storica)" : "Annual volatility (blank = historical)"}</label>
                <input className="input num" placeholder={pct(stats.log.sigma * 100, lang, false)} value={mc.sigmaOverride} onChange={e => setMc({ ...mc, sigmaOverride: e.target.value.replace(",", ".") })} /></div>
              <label className="small"><input type="checkbox" checked={mc.infl} onChange={e => setMc({ ...mc, infl: e.target.checked })} /> {it ? "In euro/dollari di oggi (inflazione 2%)" : "In today's money (2% inflation)"}</label>
            </div>
            <p className="tiny muted">{it ? `Storico usato: ${stats.dates.length} settimane dal ${stats.dates[0]}. Se il passato è stato eccezionale (come per molti titoli tecnologici), il futuro simulato lo sarà troppo: abbassa il rendimento atteso per essere prudente.` : `History used: ${stats.dates.length} weeks since ${stats.dates[0]}. If the past was exceptional (as for many tech stocks), the simulated future will be too: lower the expected return to be cautious.`}</p>
          </section>
          <section className="panel span-8 vrule">
            <PanelHead kicker={it ? "2.000 futuri possibili" : "2,000 possible futures"} title={`${it ? "Mediana" : "Median"}: ${usd(mcRows[mcRows.length - 1].p50, lang, 0)}`} />
            <FanChart rows={mcRows} labels={{ median: it ? "Esito mediano" : "Median outcome", mid: it ? "50% dei casi" : "50% of cases", wide: it ? "80% dei casi" : "80% of cases" }} />
            <div className="table-wrap" style={{ marginTop: "1rem" }}>
              <table className="table">
                <thead><tr><th>{it ? "Anno" : "Year"}</th><th className="r">{it ? "Sfavorevole (10%)" : "Poor (10%)"}</th><th className="r">{it ? "Mediano" : "Median"}</th><th className="r">{it ? "Favorevole (90%)" : "Good (90%)"}</th></tr></thead>
                <tbody>{mcRows.filter(r => [1, 5, 10, 15, 20, 30, 40].includes(r.year)).map(r => (
                  <tr key={r.year}><td>{r.year}</td><td className="r num down">{usd(r.p10, lang, 0)}</td><td className="r num">{usd(r.p50, lang, 0)}</td><td className="r num up">{usd(r.p90, lang, 0)}</td></tr>
                ))}</tbody>
              </table>
            </div>
            <p className="tiny muted">{it ? `Ogni percorso estrae rendimenti mensili casuali con media ${pct((Math.exp(mcParams.mu) - 1) * 100, lang, false)} e volatilità ${pct(mcParams.sigma * 100, lang, false)} annui (distribuzione log-normale). Limiti: i mercati reali hanno crolli più bruschi e periodi più lunghi di quanto preveda questo modello.` : `Each path draws random monthly returns with ${pct((Math.exp(mcParams.mu) - 1) * 100, lang, false)} mean and ${pct(mcParams.sigma * 100, lang, false)} annual volatility (log-normal). Limits: real markets have sharper crashes and longer slumps than this model assumes.`}</p>
          </section>
        </div>
      )}

      {tab === "history" && stats && picked && (
        <section className="panel">
          <PanelHead kicker={it ? "Crolli storici" : "Historical crashes"} title={it ? "Se succedesse di nuovo, al tuo portafoglio" : "If it happened again, to your portfolio"} meta={bars.meta} />
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{it ? "Episodio" : "Episode"}</th><th className="r">S&amp;P 500</th><th className="r">{it ? "Stima per te (beta " : "Estimate for you (beta "}{num(stats.pBeta, lang, 2)})</th><th className="r">{it ? "In dollari" : "In dollars"}</th><th className="r">{it ? "Osservato con i pesi di oggi" : "Observed with today's weights"}</th><th className="r">{it ? "Mesi per recuperare (mercato)" : "Months to recover (market)"}</th></tr></thead>
              <tbody>{HISTORY.map(h => {
                const est = Math.max(-95, h.dd * stats.pBeta);
                const i0 = stats.dates.findIndex(d => d >= h.from), i1 = stats.dates.findIndex(d => d > h.to);
                const observed = i0 > 0 && i1 > i0 ? maxDrawdown(stats.port.slice(i0 - 1, i1)).mdd * 100 : null;
                return (
                  <tr key={h.id}>
                    <td><span className="display" style={{ fontSize: "1.1rem" }}>{h.title[lang]}</span></td>
                    <td className="r num down">{pct(h.dd, lang)}</td>
                    <td className="r num down">{pct(est, lang)}</td>
                    <td className="r num down">{usd((est / 100) * picked.value, lang, 0)}</td>
                    <td className="r num">{observed != null ? <span className="down">{pct(observed, lang)}</span> : <span className="muted">{it ? "dati non disponibili" : "no data"}</span>}</td>
                    <td className="r num">{h.recoverMonths}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
          <p className="small" style={{ marginTop: "1rem" }}>{it ? "La lezione dei crolli: arrivano senza preavviso, possono dimezzare il valore, ma finora il mercato americano nel suo insieme si è sempre ripreso, a volte in mesi, a volte in anni. Chi ha venduto nel panico ha spesso fissato la perdita." : "The lesson of crashes: they come without warning and can halve values, but so far the US market as a whole has always recovered, sometimes in months, sometimes in years. Those who sold in panic often locked in the loss."}</p>
          <p className="tiny muted">{it ? "Cali dell'S&P 500 (indice prezzi, dal massimo al minimo) approssimativi da dati storici pubblici. La stima per te = calo del mercato × beta del portafoglio. «Osservato» usa i dati Alpaca disponibili (dal 2016 circa) con i pesi di oggi: chi sceglie oggi i titoli sa già chi è sopravvissuto, quindi il passato può sembrare migliore del reale." : "S&P 500 declines (price index, peak to trough) approximate, from public historical data. Your estimate = market decline × portfolio beta. “Observed” uses Alpaca data available (from about 2016) with today's weights: choosing stocks today already knows who survived, so the past can look better than it was."}</p>
        </section>
      )}

      {tab === "shock" && shock && picked && (
        <div className="grid">
          <section className="panel span-4">
            <PanelHead kicker={it ? "Scenari" : "Scenarios"} title={it ? "Scegli uno shock" : "Choose a shock"} />
            <div className="rows">
              {SCENARIOS.map(s => (
                <button key={s.id} onClick={() => setScId(s.id)} style={{ background: s.id === scId ? "var(--surface-2)" : "none", border: 0, borderLeft: s.id === scId ? "3px solid var(--accent)" : "3px solid transparent", textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit", padding: ".6rem .7rem" }}>
                  {s.title[lang]}
                </button>
              ))}
            </div>
          </section>
          <section className="panel span-8 vrule">
            <PanelHead kicker={it ? "Scenario ipotetico" : "Hypothetical scenario"} title={sc.title[lang]} />
            <p className="lede" style={{ fontStyle: "normal", fontSize: "1.1rem" }}>{sc.story[lang]}</p>
            <div className="stats">
              <div className="stat"><div className="label">{it ? "Effetto stimato (centrale)" : "Estimated effect (central)"}</div><div className={`figure-sm ${shock.central >= 0 ? "up" : "down"}`}>{pct(shock.central, lang)}</div><div className="tiny muted">{usd((shock.central / 100) * picked.value, lang, 0)}</div></div>
              <div className="stat"><div className="label">{it ? "Intervallo plausibile" : "Plausible range"}</div><div className="figure-sm">{pct(shock.lo, lang)} … {pct(shock.hi, lang)}</div></div>
              <div className="stat"><div className="label">{it ? "Valore in euro (per chi vive in Italia)" : "Euro value (living in Italy)"}</div><div className={`figure-sm ${shock.eur >= 0 ? "up" : "down"}`}>{pct(shock.eur, lang)}</div><div className="tiny muted">{shock.fx ? (it ? `include ${pct(shock.fx, lang)} di effetto cambio` : `includes ${pct(shock.fx, lang)} currency effect`) : (it ? "nessun effetto cambio ipotizzato" : "no currency effect assumed")}</div></div>
            </div>
            <div style={{ marginTop: "1.2rem" }}>
              <div className="kicker" style={{ marginBottom: ".4rem" }}>{it ? "Titolo per titolo" : "Holding by holding"}</div>
              <BarList signed items={[...shock.per].sort((x, y) => x.imp - y.imp).map(x => ({ label: `${x.s} (${pct(x.w * 100, lang, false)})`, value: x.imp }))} />
            </div>
            <div className="notice" style={{ marginTop: "1.2rem" }}>
              <b>{it ? "Attenzione: " : "Note: "}</b>{it ? "le reazioni per settore sono ipotesi illustrative e arrotondate, basate su comportamenti tipici del passato, non previsioni. Lo scenario «crollo» usa invece il beta misurato di ogni titolo. L'intervallo va da metà a 1,6 volte la stima centrale." : "sector reactions are round, illustrative assumptions based on typical past behaviour, not forecasts. The “crash” scenario instead uses each holding's measured beta. The range spans half to 1.6× the central estimate."}
            </div>
          </section>
        </div>
      )}

      {tab === "backtest" && stats && picked && (() => {
        const growth = (r: number[]) => r.reduce<number[]>((acc, x) => [...acc, acc[acc.length - 1] * (1 + x)], [10000]);
        // buy-and-hold: each holding grows on its own from the start weights
        const bh = stats.prices[0].map((_, k) => stats.usable.reduce((t, _s, i) => t + 10000 * stats.w[i] * stats.prices[i][k] / stats.prices[i][0], 0));
        const spy = growth(stats.mkt);
        const yrs = (stats.dates.length - 1) / 52;
        const cagr = (v: number[]) => Math.pow(v[v.length - 1] / v[0], 1 / yrs) - 1;
        const bhRets = bh.slice(1).map((v, i) => v / bh[i] - 1);
        const lbl = stats.dates.map(d => d.slice(0, 7));
        return (
          <section className="panel">
            <PanelHead kicker="Backtest" title={it ? `10.000 $ investiti il ${stats.dates[0]}` : `$10,000 invested on ${stats.dates[0]}`} meta={bars.meta} />
            <div className="stats">
              <div className="stat"><div className="label">{it ? "Portafoglio oggi" : "Portfolio today"}</div><div className="figure-sm">{usd(bh[bh.length - 1], lang, 0)}</div><div className="tiny muted">{it ? "annuo" : "per year"} {pct(cagr(bh) * 100, lang)}</div></div>
              <div className="stat"><div className="label">S&amp;P 500 (SPY)</div><div className="figure-sm">{usd(spy[spy.length - 1], lang, 0)}</div><div className="tiny muted">{it ? "annuo" : "per year"} {pct(cagr(spy) * 100, lang)}</div></div>
              <div className="stat"><div className="label">{it ? "Calo massimo portafoglio" : "Portfolio max drawdown"}</div><div className="figure-sm down">{pct(maxDrawdown(bhRets).mdd * 100, lang)}</div></div>
              <div className="stat"><div className="label">{it ? "Calo massimo S&P 500" : "S&P 500 max drawdown"}</div><div className="figure-sm down">{pct(maxDrawdown(stats.mkt).mdd * 100, lang)}</div></div>
            </div>
            <LinesChart xLabels={lbl} series={[
              { label: it ? "Il portafoglio (compra e tieni)" : "Portfolio (buy & hold)", values: bh, color: "var(--forest)" },
              { label: "S&P 500 (SPY)", values: spy, color: "var(--accent)" },
            ]} />
            <div className="notice warn" style={{ marginTop: "1rem" }}>
              {it ? "Attenzione alle illusioni del backtest: (1) scegli i titoli sapendo già come sono andati («senno di poi»); (2) le aziende fallite non compaiono più tra quelle che conosci («sopravvivenza»); (3) esclude dividendi e tasse. Un ottimo passato non garantisce nulla." : "Beware of backtest illusions: (1) you pick stocks already knowing how they did (hindsight); (2) companies that failed no longer appear among those you know (survivorship); (3) it excludes dividends and taxes. A great past guarantees nothing."}
            </div>
            <p className="tiny muted">{it ? `Prezzi settimanali IEX dal primo giorno in cui tutti i titoli hanno dati (${stats.dates[0]}), senza ribilanciamento.` : `Weekly IEX prices from the first day all holdings have data (${stats.dates[0]}), no rebalancing.`}</p>
          </section>
        );
      })()}
    </div>
  );
}
