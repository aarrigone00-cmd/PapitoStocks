"use client";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { usePrefs } from "@/components/prefs";
import { PanelHead, Delta, Chip, Skeleton, ErrorNote } from "@/components/ui";
import { Heatmap } from "@/components/charts";
import { usd, compact } from "@/lib/format";
import type { Active, Mover, Quote } from "@/lib/types";
import type { IndexDef } from "@/lib/universe";

type IndexRow = IndexDef & { quote: Quote | null };
type HeatRow = { symbol: string; name: string; sector: string; quote: Quote | null };

const SECTORS = {
  it: { tech: "Tecnologia", comm: "Comunicazioni", discretionary: "Consumi discrezionali", financials: "Finanza", health: "Salute", staples: "Beni primari", energy: "Energia", industrials: "Industria", utilities: "Servizi pubblici", europe: "Europa (ADR)" },
  en: { tech: "Technology", comm: "Communication", discretionary: "Consumer discretionary", financials: "Financials", health: "Health care", staples: "Consumer staples", energy: "Energy", industrials: "Industrials", utilities: "Utilities", europe: "Europe (ADRs)" },
};

export default function Markets() {
  const { t, lang } = usePrefs();
  const idx = useApi<IndexRow[]>("/api/data/indices", 60_000);
  const heat = useApi<HeatRow[]>("/api/data/heatmap", 60_000);
  const movers = useApi<{ gainers: Mover[]; losers: Mover[] }>("/api/data/movers", 300_000);
  const actives = useApi<{ items: Active[] }>("/api/data/actives", 300_000);

  return (
    <div className="page">
      <header className="masthead">
        <div>
          <div className="kicker">{lang === "it" ? "Mercati" : "Markets"}</div>
          <h1 className="h1">{lang === "it" ? "Il polso dei mercati" : "The pulse of the markets"}</h1>
        </div>
      </header>
      <div className="grid">
        <section className="panel span-12">
          <PanelHead kicker={t.indices} title={lang === "it" ? "Indici e loro repliche" : "Indices and their trackers"} meta={idx.meta} />
          {idx.error ? <ErrorNote error={idx.error} onRetry={idx.reload} /> : !idx.data ? <Skeleton lines={8} /> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>{lang === "it" ? "Indice" : "Index"}</th><th>{lang === "it" ? "Strumento" : "Instrument"}</th><th>{lang === "it" ? "Area" : "Region"}</th><th className="r">{t.price}</th><th className="r">{t.todayPct}</th><th className="r">{t.volume}</th></tr></thead>
                <tbody>
                  {idx.data.map(i => (
                    <tr key={i.symbol}>
                      <td><span className="display" style={{ fontSize: "1.15rem" }}>{i.index}</span>{i.proxy && <span className="muted"> *</span>}</td>
                      <td className="small"><Link href={`/research/${i.symbol}`} className="sym">{i.symbol}</Link> <span className="muted">{i.note}</span></td>
                      <td className="small">{i.region}</td>
                      <td className="r num">{usd(i.quote?.price, lang)}</td>
                      <td className="r"><Delta value={i.quote?.changePct} /></td>
                      <td className="r num muted">{compact(i.quote?.volume, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="tiny muted">* {t.proxyNote}</p>
        </section>

        <section className="panel span-12">
          <PanelHead kicker={t.heatmap} title={lang === "it" ? "Le grandi aziende, oggi" : "Large companies, today"} meta={heat.meta} />
          {heat.error ? <ErrorNote error={heat.error} onRetry={heat.reload} /> : !heat.data ? <div className="skel" style={{ height: 460 }} /> :
            <Heatmap items={heat.data} sectorLabels={SECTORS[lang]} />}
          <p className="tiny muted">{lang === "it" ? "Dimensione = controvalore scambiato oggi (IEX). Colore = variazione % rispetto alla chiusura di ieri. Clicca per la scheda." : "Size = value traded today (IEX). Colour = % change vs yesterday's close. Click for details."}</p>
        </section>

        <section className="panel span-8">
          <PanelHead kicker={t.unusual} title={lang === "it" ? "Variazioni più forti" : "Biggest moves"} meta={movers.meta} />
          {!movers.data ? <Skeleton lines={6} /> : (
            <div className="grid" style={{ rowGap: 0 }}>
              {([[t.winners, movers.data.gainers], [t.losers, movers.data.losers]] as [string, Mover[]][]).map(([l, list]) => (
                <div className="span-6" key={l}>
                  <div className="kicker">{l}</div>
                  <div className="rows">{list.map(m => <Link key={m.symbol} href={`/research/${m.symbol}`}><span className="name sym">{m.symbol}</span><span className="num">{usd(m.price, lang)} <Chip value={m.changePct} /></span></Link>)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="panel span-4 vrule">
          <PanelHead kicker={t.trending} title={lang === "it" ? "Più scambiati" : "Most active"} meta={actives.meta} />
          {!actives.data ? <Skeleton lines={6} /> : (
            <div className="rows">{actives.data.items.map(x => <Link key={x.symbol} href={`/research/${x.symbol}`}><span className="name sym">{x.symbol}</span><span className="num muted">{compact(x.volume, lang)}</span></Link>)}</div>
          )}
        </section>
      </div>
    </div>
  );
}
