"use client";
import { useState } from "react";
import { usePrefs } from "@/components/prefs";

export default function Login() {
  const { t, lang, set } = usePrefs();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passcode: code }) });
    setBusy(false);
    if (r.ok) window.location.href = "/";
    else setErr(r.status === 429 ? t.locked : t.wrongCode);
  };
  return (
    <div className="login">
      <div className="login-art">
        <svg viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice" aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => <circle key={i} cx="460" cy="140" r={40 + i * 34} fill="none" stroke="#B99A5E" strokeWidth=".6" opacity={1 - i / 16} />)}
          {Array.from({ length: 9 }).map((_, i) => <line key={i} x1="0" x2="600" y1={330 + i * 30} y2={300 + i * 30 - i * 9} stroke="#89968A" strokeWidth=".5" opacity=".5" />)}
        </svg>
        <div style={{ position: "relative" }}>
          <span className="monogram">P</span>
        </div>
        <div style={{ position: "relative" }}>
          <div className="brand-sub" style={{ marginBottom: ".8rem" }}>{t.subtitle}</div>
          <div className="display" style={{ fontSize: "clamp(2.6rem, 6vw, 4.4rem)", color: "#F5F2E9" }}>Papitostocks</div>
          <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.35rem", color: "#D9D2BF", margin: ".6rem 0 0" }}>{t.tagline}</p>
        </div>
      </div>
      <div className="login-form">
        <form onSubmit={submit} style={{ width: "100%", maxWidth: 360, display: "grid", gap: "1rem" }}>
          <div className="kicker">{lang === "it" ? "Accesso riservato" : "Private access"}</div>
          <div className="field">
            <label htmlFor="code">{t.enterPasscode}</label>
            <input id="code" className="input" type="password" autoComplete="current-password" value={code} onChange={e => setCode(e.target.value)} autoFocus style={{ fontSize: "1.2rem" }} />
          </div>
          {err && <div className="notice warn small">{err}</div>}
          <button className="btn" disabled={busy || !code}>{t.enter}</button>
          <div className="seg" style={{ justifySelf: "start" }}>
            <button type="button" aria-pressed={lang === "it"} onClick={() => set({ lang: "it" })}>IT</button>
            <button type="button" aria-pressed={lang === "en"} onClick={() => set({ lang: "en" })}>EN</button>
          </div>
        </form>
      </div>
    </div>
  );
}
