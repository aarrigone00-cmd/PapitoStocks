"use client";
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { usePrefs } from "@/components/prefs";
import { PanelHead, Skeleton, ErrorNote } from "@/components/ui";
import { PortfolioPicker, type Picked } from "@/components/portfolio-picker";
import { BarList, CorrMatrix } from "@/components/svgcharts";
import { alignedReturns, concentration, corrMatrix, riskReport } from "@/lib/analytics";
import { INFL_SENS, RATE_SENS, REGION_LABEL, SECTOR_LABEL, regionOf, sectorOf, type SectorKey } from "@/lib/classify";
import { pct, usd, num } from "@/lib/format";
import type { Bar } from "@/lib/types";

type Finding = { sev: 3 | 2 | 1; title: string; why: string; who: string; assume: string };

export default function RiskRadar() {
  const { lang } = usePrefs();
  const it = lang === "it";
  const [picked, setPicked] = useState<Picked | null>(null);
  const [rf, setRf] = useState(3.5);
  const onPick = useCallback((p: Picked | null) => setPicked(p), []);
  const symbols = picked ? [...new Set([...picked.symbols, "SPY"])] : [];
  const bars = useApi<Record<string, Bar[]>>(symbols.length ? `/api/data/multibars?range=1Y&symbols=${symbols.join(",")}` : null);

  const a = useMemo(() => {
    if (!picked || !bars.data) return null;
    const usable = picked.symbols.filter(s => (bars.data![s]?.length ?? 0) > 30);
    const missing = picked.symbols.filter(s => !usable.includes(s));
    if (!usable.length) return { kind: "empty", missing } as const;
    const all = [...usable, "SPY"];
    const { rets, dates } = alignedReturns(bars.data, all);
    const w = usable.map(s => picked.weights[picked.symbols.indexOf(s)]);
    const wsum = w.reduce((x, y) => x + y, 0);
    const wn = w.map(x => x / wsum);
    const holdRets = rets.slice(0, usable.length), mkt = rets[usable.length];
    const rep = riskReport(wn, holdRets, mkt, 252, rf / 100);
    const betas = holdRets.map(r => riskReport([1], [r], mkt, 252, rf / 100).beta);
    const conc = concentration(wn);
    const corr = corrMatrix(holdRets);
    const sectors = new Map<SectorKey, number>(); const regions = new Map<string, number>();
    usable.forEach((s, i) => { sectors.set(sectorOf(s), (sectors.get(sectorOf(s)) ?? 0) + wn[i]); regions.set(regionOf(s), (regions.get(regionOf(s)) ?? 0) + wn[i]); });
    const rate = usable.reduce((t, s, i) => t + wn[i] * RATE_SENS[sectorOf(s)], 0);
    const infl = usable.reduce((t, s, i) => t + wn[i] * INFL_SENS[sectorOf(s)], 0);
    return { kind: "ok", usable, missing, wn, rep, betas, conc, corr, sectors, regions, rate, infl, days: dates.length } as const;
  }, [picked, bars.data, rf]);

  const findings: Finding[] = useMemo(() => {
    if (!a || a.kind !== "ok") return [];
    const f: Finding[] = [];
    const { usable, wn, rep, conc, corr, sectors, rate, infl } = a;
    const topIdx = wn.indexOf(Math.max(...wn));
    const SL = SECTOR_LABEL[lang];
    if (conc.top > 0.25) f.push({ sev: conc.top > 0.4 ? 3 : 2,
      title: it ? `${usable[topIdx]} pesa il ${pct(conc.top * 100, lang, false)} del portafoglio` : `${usable[topIdx]} is ${pct(conc.top * 100, lang, false)} of the portfolio`,
      why: it ? "Se quella sola azienda ha un problema (risultati deludenti, scandalo, regole nuove), ne risente gran parte del patrimonio." : "If that one company has a problem (weak results, scandal, new rules), a large part of the wealth is affected.",
      who: usable[topIdx], assume: it ? "Soglia d'attenzione usata: 25% in un solo titolo; 40% = alta." : "Threshold used: 25% in one stock; 40% = high." });
    if (conc.effectiveN < 5 && usable.length > 1) f.push({ sev: 2,
      title: it ? `Diversificazione equivalente a ${num(conc.effectiveN, lang, 1)} titoli` : `Diversification equal to ${num(conc.effectiveN, lang, 1)} stocks`,
      why: it ? "Contando quanto pesa ciascuno, il portafoglio si comporta come se avesse pochi titoli in parti uguali." : "Taking weights into account, the portfolio behaves as if it held only a few equal-sized stocks.",
      who: usable.join(", "), assume: it ? "Numero effettivo = 1 / somma dei pesi al quadrato (indice di Herfindahl)." : "Effective number = 1 / sum of squared weights (Herfindahl index)." });
    for (const [k, v] of sectors) if (v > 0.4 && k !== "broad") f.push({ sev: v > 0.6 ? 3 : 2,
      title: it ? `${SL[k]}: ${pct(v * 100, lang, false)} del portafoglio` : `${SL[k]}: ${pct(v * 100, lang, false)} of the portfolio`,
      why: it ? "Aziende dello stesso settore tendono a salire e scendere insieme, per le stesse notizie e gli stessi cicli." : "Companies in the same sector tend to rise and fall together, on the same news and cycles.",
      who: usable.filter(s => sectorOf(s) === k).join(", "), assume: it ? "Classificazione settoriale interna (vedi metodo)." : "Internal sector classification (see method)." });
    f.push({ sev: 2,
      title: it ? "100% in dollari americani" : "100% in US dollars",
      why: it ? "Per chi vive in Italia, se il dollaro si indebolisce contro l'euro il valore in euro scende anche quando le azioni stanno ferme (e viceversa)." : "For someone living in Italy, if the dollar weakens against the euro the euro value falls even when the stocks don't move (and vice versa).",
      who: it ? "Tutto il portafoglio" : "Whole portfolio", assume: it ? "Alpaca opera solo in dollari; anche le società europee (ADR) sono quotate in dollari." : "Alpaca trades only in dollars; European companies (ADRs) are also priced in dollars." });
    if (rep.vol > 0.18) f.push({ sev: rep.vol > 0.25 ? 3 : 2,
      title: it ? `Oscillazioni ampie: volatilità ${pct(rep.vol * 100, lang, false)} annua` : `Large swings: ${pct(rep.vol * 100, lang, false)} annual volatility`,
      why: it ? `Nell'ultimo anno il mercato americano nel complesso ha avuto oscillazioni minori. In un anno normale il valore potrebbe muoversi di circa ±${pct(rep.vol * 100, lang, false)}.` : `Over the last year the US market as a whole swung less. In a typical year the value could move roughly ±${pct(rep.vol * 100, lang, false)}.`,
      who: usable.join(", "), assume: it ? "Deviazione standard dei rendimenti giornalieri × √252, ultimo anno." : "Std. deviation of daily returns × √252, last year." });
    if (rep.beta > 1.25) f.push({ sev: 2,
      title: it ? `Beta ${num(rep.beta, lang, 2)}: amplifica i movimenti del mercato` : `Beta ${num(rep.beta, lang, 2)}: amplifies market moves`,
      why: it ? `Storicamente, quando l'S&P 500 scendeva dell'1%, questo portafoglio scendeva in media di circa l'${num(rep.beta, lang, 2)}%.` : `Historically, when the S&P 500 fell 1%, this portfolio fell about ${num(rep.beta, lang, 2)}% on average.`,
      who: usable.filter((_, i) => a.betas[i] > 1.2).join(", ") || "—", assume: it ? "Beta rispetto a SPY sui rendimenti giornalieri dell'ultimo anno." : "Beta vs SPY on last year's daily returns." });
    const pairs: string[] = [];
    for (let i = 0; i < usable.length; i++) for (let j = i + 1; j < usable.length; j++) if (corr[i][j] > 0.75) pairs.push(`${usable[i]}–${usable[j]} (${corr[i][j].toFixed(2)})`);
    if (pairs.length) f.push({ sev: 2,
      title: it ? "Rischio nascosto: titoli che si muovono quasi insieme" : "Hidden risk: holdings that move almost together",
      why: it ? "Anche se sono aziende diverse, nei fatti reagiscono agli stessi eventi (stessa catena di fornitura, stessi clienti, stessi fattori economici). Diversificano meno di quanto sembra." : "Even though they are different companies, they react to the same events (same supply chain, customers or economic drivers). They diversify less than it seems.",
      who: pairs.slice(0, 6).join(" · "), assume: it ? "Correlazione dei rendimenti giornalieri superiore a 0,75." : "Daily-return correlation above 0.75." });
    if (rate < -0.9) f.push({ sev: 1,
      title: it ? "Sensibile a un rialzo dei tassi" : "Sensitive to rising interest rates",
      why: it ? "Prevalgono settori che storicamente soffrono quando i tassi salgono (tecnologia, servizi pubblici, aziende in crescita): i profitti futuri valgono meno oggi." : "Sectors that historically suffer when rates rise dominate (tech, utilities, growth companies): future profits are worth less today.",
      who: usable.filter(s => RATE_SENS[sectorOf(s)] < 0).join(", "), assume: it ? "Regola generale per settore, non una misura statistica." : "Rule of thumb per sector, not a statistical estimate." });
    if (infl < -0.9) f.push({ sev: 1,
      title: it ? "Sensibile all'inflazione" : "Sensitive to inflation",
      why: it ? "Prevalgono settori che tendono a soffrire quando i prezzi salgono a lungo; energia e materie prime di solito compensano." : "Sectors that tend to suffer from persistent inflation dominate; energy and commodities usually offset it.",
      who: usable.filter(s => INFL_SENS[sectorOf(s)] < 0).join(", "), assume: it ? "Regola generale per settore." : "Rule of thumb per sector." });
    const unk = sectors.get("other") ?? 0;
    if (unk > 0.2) f.push({ sev: 1, title: it ? `${pct(unk * 100, lang, false)} non classificato` : `${pct(unk * 100, lang, false)} unclassified`,
      why: it ? "Per alcuni titoli non ho ancora settore e Paese: l'analisi dell'esposizione è incompleta (dati completi nella Fase 2)." : "Some holdings have no sector/country yet: exposure analysis is incomplete (full data in Phase 2).",
      who: usable.filter(s => sectorOf(s) === "other").join(", "), assume: "—" });
    return f.sort((x, y) => y.sev - x.sev);
  }, [a, lang, it]);

  const SEV = { 3: { c: "var(--down)", l: it ? "Alto" : "High" }, 2: { c: "var(--accent-ink)", l: it ? "Medio" : "Medium" }, 1: { c: "var(--muted)", l: it ? "Basso" : "Low" } };
  const value = picked?.value ?? 0;

  return (
    <div className="page">
      <header className="masthead">
        <div>
          <div className="kicker">{it ? "Radar dei rischi" : "Risk radar"}</div>
          <h1 className="h1">{it ? "Dove può fare male" : "Where it could hurt"}</h1>
          <p className="lede" style={{ margin: ".4rem 0 0" }}>{it ? "Concentrazione, settori, valuta, oscillazioni e legami nascosti, spiegati uno per uno." : "Concentration, sectors, currency, swings and hidden links, explained one by one."}</p>
        </div>
      </header>

      <PortfolioPicker onChange={onPick} />
      {bars.error && <ErrorNote error={bars.error} onRetry={bars.reload} />}
      {picked && !bars.data && !bars.error && <Skeleton lines={8} />}
      {a && a.missing.length > 0 && <div className="notice warn" style={{ marginBottom: "1.4rem" }}>{it ? "Storico insufficiente per: " : "Not enough history for: "}{a.missing.join(", ")}</div>}

      {a?.kind === "ok" && (
        <div className="grid">
          <section className="panel span-12">
            <PanelHead kicker={it ? "In sintesi" : "At a glance"} title={it ? "Gli indicatori principali" : "Key indicators"} meta={bars.meta} />
            <div className="stats">
              <div className="stat"><div className="label">{it ? "Volatilità annua" : "Annual volatility"}</div><div className="figure-sm">{pct(a.rep.vol * 100, lang, false)}</div><div className="tiny muted">S&amp;P 500 = {pct(riskReport([1], [alignedReturns(bars.data!, ["SPY"]).rets[0]], [], 252, 0).vol * 100, lang, false)}</div></div>
              <div className="stat"><div className="label">Beta</div><div className="figure-sm">{num(a.rep.beta, lang, 2)}</div><div className="tiny muted">{it ? "1 = come il mercato" : "1 = like the market"}</div></div>
              <div className="stat"><div className="label">{it ? "Perdita in 1 giorno (VaR 95%)" : "1-day loss (VaR 95%)"}</div><div className="figure-sm down">{usd(-a.rep.var95 * value, lang, 0)}</div><div className="tiny muted">{pct(-a.rep.var95 * 100, lang)} · {it ? "1 giorno su 20 peggio di così" : "1 day in 20 worse than this"}</div></div>
              <div className="stat"><div className="label">{it ? "Media dei giorni peggiori (ES)" : "Average bad day (ES)"}</div><div className="figure-sm down">{usd(-a.rep.es95 * value, lang, 0)}</div><div className="tiny muted">{pct(-a.rep.es95 * 100, lang)}</div></div>
              <div className="stat"><div className="label">{it ? "Calo massimo (1 anno)" : "Max drawdown (1 yr)"}</div><div className="figure-sm down">{pct(a.rep.mdd * 100, lang)}</div></div>
              <div className="stat"><div className="label">Sharpe · Sortino</div><div className="figure-sm">{num(a.rep.sharpe, lang, 2)} · {num(a.rep.sortino, lang, 2)}</div><div className="tiny muted">{it ? "rendimento per unità di rischio" : "return per unit of risk"}</div></div>
              <div className="stat"><div className="label">{it ? "Rendimento 1 anno vs S&P" : "1-yr return vs S&P"}</div><div className="figure-sm">{pct(a.rep.annRet * 100, lang)}</div><div className="tiny muted">S&amp;P 500 {pct(a.rep.mktAnn * 100, lang)} · alpha {pct(a.rep.alpha * 100, lang)}</div></div>
              <div className="stat"><div className="label">{it ? "Titoli effettivi" : "Effective holdings"}</div><div className="figure-sm">{num(a.conc.effectiveN, lang, 1)}</div><div className="tiny muted">{it ? "su" : "of"} {a.usable.length}</div></div>
            </div>
            <p className="tiny muted">{it ? `Basato su ${a.days} giorni di Borsa (ultimo anno), pesi attuali, prezzi IEX senza dividendi. Tasso privo di rischio ipotizzato: ` : `Based on ${a.days} trading days (last year), current weights, IEX prices excluding dividends. Assumed risk-free rate: `}
              <input aria-label="risk-free %" className="input num" style={{ width: "4rem", display: "inline-block", padding: ".15rem .3rem" }} value={rf} inputMode="decimal" onChange={e => setRf(Number(e.target.value.replace(",", ".")) || 0)} />%
            </p>
          </section>

          <section className="panel span-7">
            <PanelHead kicker={it ? "Cosa noto" : "What I notice"} title={it ? "Rischi da tenere d'occhio" : "Risks worth watching"} />
            {findings.map((f, i) => (
              <div className="finding" key={i}>
                <div className="sev" style={{ color: SEV[f.sev].c }} title={SEV[f.sev].l}>{f.sev === 3 ? "!" : f.sev === 2 ? "◆" : "·"}</div>
                <div>
                  <div className="kicker" style={{ color: SEV[f.sev].c }}>{SEV[f.sev].l}</div>
                  <h3 className="h3">{f.title}</h3>
                  <p style={{ margin: ".3rem 0" }}>{f.why}</p>
                  <div className="tiny muted"><b>{it ? "Riguarda" : "Affects"}:</b> {f.who} · <b>{it ? "Ipotesi" : "Assumption"}:</b> {f.assume}</div>
                </div>
              </div>
            ))}
            <p className="tiny muted">{it ? "Descrive il passato e regole generali: non prevede perdite future." : "Describes the past and general rules: it does not predict future losses."}</p>
          </section>

          <aside className="panel span-5 vrule">
            <PanelHead kicker={it ? "Esposizione" : "Exposure"} title={it ? "Per settore" : "By sector"} />
            <BarList items={[...a.sectors].sort((x, y) => y[1] - x[1]).map(([k, v]) => ({ label: SECTOR_LABEL[lang][k], value: v * 100 }))} max={100} />
            <div style={{ marginTop: "1.6rem" }}>
              <PanelHead kicker={it ? "Esposizione" : "Exposure"} title={it ? "Per area geografica" : "By region"} />
              <BarList items={[...a.regions].sort((x, y) => y[1] - x[1]).map(([k, v]) => ({ label: REGION_LABEL[lang][k as keyof (typeof REGION_LABEL)["it"]], value: v * 100 }))} max={100} />
              <p className="tiny muted">{it ? "Per sede o quotazione principale dell'azienda. Le multinazionali vendono in tutto il mondo: dati più precisi sui ricavi per Paese arrivano nella Fase 2." : "By company home or main listing. Multinationals sell worldwide: revenue-by-country data arrives in Phase 2."}</p>
            </div>
            <div style={{ marginTop: "1.6rem" }}>
              <PanelHead kicker={it ? "Sensibilità (regola generale)" : "Sensitivity (rule of thumb)"} title={it ? "Tassi e inflazione" : "Rates & inflation"} />
              <BarList signed max={2} items={[
                { label: it ? "Se i tassi salgono" : "If rates rise", value: a.rate },
                { label: it ? "Se l'inflazione resta alta" : "If inflation stays high", value: a.infl },
              ]} />
              <p className="tiny muted">{it ? "Scala da −2 (tende a soffrire) a +2 (tende a beneficiare), media pesata dei settori." : "Scale from −2 (tends to suffer) to +2 (tends to benefit), weighted average of sectors."}</p>
            </div>
          </aside>

          {a.usable.length > 1 && (
            <section className="panel span-12">
              <PanelHead kicker={it ? "Legami" : "Links"} title={it ? "Quanto si muovono insieme (correlazione)" : "How much they move together (correlation)"} />
              <CorrMatrix symbols={a.usable} m={a.corr} />
              <p className="tiny muted">{it ? "1 = si muovono sempre insieme, 0 = indipendenti, negativo = in direzioni opposte. Più rosso = meno diversificazione." : "1 = always move together, 0 = independent, negative = opposite directions. Redder = less diversification."}</p>
            </section>
          )}

          <section className="panel span-12">
            <PanelHead kicker={it ? "Metodo" : "Method"} title={it ? "Come sono calcolati e i loro limiti" : "How they're computed, and their limits"} />
            <dl className="method">
              <dt>{it ? "Volatilità" : "Volatility"}</dt><dd>{it ? "Deviazione standard dei rendimenti giornalieri del portafoglio (pesi attuali) × √252. Limite: il futuro può essere più o meno agitato del passato." : "Standard deviation of daily portfolio returns (current weights) × √252. Limit: the future can be calmer or wilder than the past."}</dd>
              <dt>Beta</dt><dd>{it ? "Covarianza con l'S&P 500 (SPY) divisa per la varianza dell'S&P 500. Limite: cambia nel tempo e nelle crisi le correlazioni salgono." : "Covariance with the S&P 500 (SPY) divided by the S&P 500's variance. Limit: changes over time; correlations rise in crises."}</dd>
              <dt>VaR 95% · Expected Shortfall</dt><dd>{it ? "Metodo storico: il 5° percentile peggiore dei rendimenti giornalieri dell'ultimo anno, e la media di quel 5% peggiore. Limite: non vede eventi peggiori di quelli accaduti nell'ultimo anno." : "Historical method: the worst 5th percentile of last year's daily returns, and the average of that worst 5%. Limit: blind to events worse than last year's."}</dd>
              <dt>Sharpe · Sortino · Alpha</dt><dd>{it ? "Rendimento annuo meno il tasso privo di rischio ipotizzato, diviso per la volatilità (Sharpe) o solo per la volatilità negativa (Sortino). Alpha di Jensen = rendimento oltre quanto spiegato dal beta. Un solo anno di dati è poco: prendili come indicazioni." : "Annual return minus the assumed risk-free rate, divided by volatility (Sharpe) or downside volatility only (Sortino). Jensen's alpha = return beyond what beta explains. One year is little data: treat them as indications."}</dd>
              <dt>{it ? "Concentrazione" : "Concentration"}</dt><dd>{it ? "Indice di Herfindahl (somma dei pesi al quadrato); 1/HHI = numero effettivo di titoli." : "Herfindahl index (sum of squared weights); 1/HHI = effective number of holdings."}</dd>
              <dt>{it ? "Settori, aree, sensibilità" : "Sectors, regions, sensitivities"}</dt><dd>{it ? "Classificazione interna delle aziende monitorate; sensibilità a tassi e inflazione = regole generali per settore, non stime statistiche." : "Internal classification of tracked companies; rate and inflation sensitivity = sector rules of thumb, not statistical estimates."} <Link href="/academy">{it ? "Glossario →" : "Glossary →"}</Link></dd>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
