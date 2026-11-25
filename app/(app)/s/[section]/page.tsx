"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePrefs } from "@/components/prefs";
import { sectionBySlug } from "@/lib/sections";

export default function ComingSection() {
  const { t, lang } = usePrefs();
  const { section } = useParams<{ section: string }>();
  const s = sectionBySlug(section);
  if (!s) return <div className="page"><h1 className="h1">404</h1><Link href="/">←</Link></div>;
  return (
    <div className="page">
      <header className="masthead"><div><div className="kicker">{t.phase} {s.phase} · {t.comingTitle}</div><h1 className="h1">{s.title[lang]}</h1></div></header>
      <div className="soon-hero">
        <div className="kicker">{t.whatItWillDo}</div>
        <p className="lede" style={{ maxWidth: 760, fontStyle: "normal" }}>{s.blurb[lang]}</p>
        {s.needs && s.needs.length > 0 && (
          <>
            <div className="kicker" style={{ marginTop: "1.6rem" }}>{t.requires}</div>
            <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginTop: ".5rem" }}>{s.needs.map(n => <span key={n} className="tag">{n}</span>)}</div>
          </>
        )}
        <p className="small muted" style={{ marginTop: "1.6rem", maxWidth: 680 }}>
          {lang === "it"
            ? "Questa sezione non mostra ancora dati: preferiamo una pagina vuota a numeri inventati. Verrà costruita nella fase indicata, dopo aver collegato i servizi necessari."
            : "This section shows no data yet: an empty page is better than invented numbers. It will be built in the phase shown, once the required services are connected."}
        </p>
      </div>
    </div>
  );
}
