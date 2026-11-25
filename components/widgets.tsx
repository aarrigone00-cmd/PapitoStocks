"use client";
import { useEffect, useState } from "react";
import { usePrefs } from "./prefs";
import type { Clock } from "@/lib/types";

export function Countdown({ clock }: { clock: Clock }) {
  const { t, lang } = usePrefs();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const target = new Date(clock.isOpen ? clock.nextClose : clock.nextOpen).getTime();
  let s = Math.max(0, Math.floor((target - now) / 1000));
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  const local = new Date(target).toLocaleTimeString(lang === "it" ? "it-IT" : "en-US", { weekday: d > 0 ? "short" : undefined, hour: "2-digit", minute: "2-digit" });
  return (
    <div>
      <div className="kicker" style={{ color: clock.isOpen ? "var(--up)" : "var(--down)" }}>
        ● {clock.isOpen ? t.marketOpen : t.marketClosed}
      </div>
      <div className="figure-sm num" style={{ marginTop: ".35rem" }}>
        {clock.isOpen ? t.closesIn : t.opensIn} {d > 0 ? `${d}g ` : ""}{pad(h)}:{pad(m)}:{pad(s)}
      </div>
      <div className="tiny muted">{local} · {lang === "it" ? "ora locale" : "local time"}</div>
    </div>
  );
}

/** A dashboard widget that can be hidden from the "Customize" panel. */
export function Widget({ id, span, children, editing, className = "" }: { id: string; span: string; children: React.ReactNode; editing: boolean; className?: string }) {
  const { hidden, toggleWidget, t } = usePrefs();
  const isHidden = hidden.includes(id);
  if (isHidden && !editing) return null;
  return (
    <section className={`panel ${span} ${className}`} style={editing ? { outline: "1px dashed var(--accent)", outlineOffset: 8, opacity: isHidden ? .4 : 1 } : undefined}>
      {editing && (
        <button className="icon-btn" style={{ float: "right", marginBottom: ".4rem" }} onClick={() => toggleWidget(id)}>
          {isHidden ? t.show : t.hide}
        </button>
      )}
      {children}
    </section>
  );
}
