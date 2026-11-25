"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DICT, type Dict, type Lang } from "@/lib/i18n";

export type Theme = "light" | "dark";
export type Scale = "md" | "lg" | "xl";
type Prefs = { lang: Lang; theme: Theme; scale: Scale; hidden: string[] };
type Ctx = Prefs & { t: Dict; set: (p: Partial<Prefs>) => void; toggleWidget: (id: string) => void };

const KEY = "ps_prefs";
const DEFAULTS: Prefs = { lang: "it", theme: "light", scale: "md", hidden: [] };
const PrefsCtx = createContext<Ctx | null>(null);

function read(): Prefs {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return DEFAULTS; }
}

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  // Load saved preferences after hydration (localStorage is browser-only).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPrefs(read()); }, []);
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.theme = prefs.theme; el.dataset.scale = prefs.scale; el.lang = prefs.lang;
  }, [prefs]);
  const set = useCallback((p: Partial<Prefs>) => setPrefs(prev => {
    const next = { ...prev, ...p };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode */ }
    return next;
  }), []);
  const toggleWidget = useCallback((id: string) => setPrefs(prev => {
    const hidden = prev.hidden.includes(id) ? prev.hidden.filter(x => x !== id) : [...prev.hidden, id];
    const next = { ...prev, hidden };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
    return next;
  }), []);
  const value = useMemo(() => ({ ...prefs, t: DICT[prefs.lang], set, toggleWidget }), [prefs, set, toggleWidget]);
  return <PrefsCtx.Provider value={value}>{children}</PrefsCtx.Provider>;
}

export function usePrefs() {
  const c = useContext(PrefsCtx);
  if (!c) throw new Error("usePrefs outside provider");
  return c;
}

// Runs before paint to avoid a flash of the wrong theme / size.
export const prefsBootScript = `try{var p=JSON.parse(localStorage.getItem("${KEY}")||"{}");var d=document.documentElement;d.dataset.theme=p.theme||"light";d.dataset.scale=p.scale||"md";d.lang=p.lang||"it";}catch(e){}`;
