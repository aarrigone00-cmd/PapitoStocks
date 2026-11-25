"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Meta } from "@/lib/types";

type State<T> = { data: T | null; meta: Meta | null; error: string | null; loading: boolean };

// Small fetch hook with polling. Keeps the last good data visible while refreshing.
export function useApi<T>(path: string | null, refreshMs = 0) {
  const [st, setSt] = useState<State<T>>({ data: null, meta: null, error: null, loading: Boolean(path) });
  const alive = useRef(true);

  const load = useCallback(async () => {
    if (!path) return;
    setSt(s => ({ ...s, loading: true }));
    try {
      const r = await fetch(path, { cache: "no-store" });
      if (r.status === 401) { window.location.href = "/login"; return; }
      const j = await r.json();
      if (!alive.current) return;
      if (!r.ok || "error" in j) setSt(s => ({ ...s, error: j.error ?? `HTTP ${r.status}`, meta: j.meta ?? s.meta, loading: false }));
      else setSt({ data: j.data as T, meta: j.meta as Meta, error: null, loading: false });
    } catch (e) {
      if (alive.current) setSt(s => ({ ...s, error: e instanceof Error ? e.message : "Network error", loading: false }));
    }
  }, [path]);

  useEffect(() => {
    alive.current = true;
    load();
    if (!refreshMs) return () => { alive.current = false; };
    const id = setInterval(() => { if (document.visibilityState === "visible") load(); }, refreshMs);
    return () => { alive.current = false; clearInterval(id); };
  }, [load, refreshMs]);

  return { ...st, reload: load };
}

export async function send<T>(path: string, method: "POST" | "DELETE", body?: unknown): Promise<T> {
  const r = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error ?? `HTTP ${r.status}`);
  return j.data as T;
}
