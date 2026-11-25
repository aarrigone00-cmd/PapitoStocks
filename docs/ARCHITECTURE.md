# Papitostocks — Private Wealth & Global Intelligence

*Understand the world. Understand the markets.*

This document is the technical plan: architecture, stack, schema, keys, costs, roadmap, folder structure, design system and setup steps.

---

## 1. System architecture

```
 Browser (phone · tablet · PC)
   │  Next.js pages (React, client components)
   │  — never sees an API key —
   ▼
 Vercel  ── proxy.ts ─────────── session check (signed cookie) on every page and API call
   │
   ├─ /api/data/[resource]   read-only data gateway (account, positions, quotes, bars, news, movers…)
   ├─ /api/trade             paper orders: validation → limits → buying power → Alpaca → audit log
   ├─ /api/watchlist         add / remove symbols
   ├─ /api/auth              passcode login / logout
   │
   └─ lib/server/*           provider adapters (one file per provider)
         ├─ alpaca.ts        paper-api.alpaca.markets + data.alpaca.markets  ← Phase 1 (live)
         ├─ demo.ts          labelled demonstration data when keys are absent
         ├─ fmp.ts           Phase 2 · financial statements, valuation, screener
         ├─ finnhub.ts       Phase 3 · earnings & economic calendar
         ├─ gdelt.ts         Phase 3 · global/geopolitical news
         ├─ fred.ts          Phase 3 · macro series
         └─ claude.ts        Phase 4 · analysis, briefings, Q&A (server-side only)

 Supabase (Phase 1b)     Postgres + Auth + Storage, Row Level Security on every user table
 Scheduled jobs (Ph. 3)  Supabase pg_cron + Edge Functions → collect news every 5–15 min,
                         de-duplicate, analyse, write caches, send alerts, build briefings
```

**Principles**

- **Adapters, not lock-in.** Each data provider sits behind one server module with typed outputs (`lib/types.ts`). Replacing a provider means rewriting one file.
- **Provenance on everything.** Every API response carries `meta: { source, freshness, asOf, note }`. The UI labels data as *Real-time*, *Delayed*, *Historical*, *Demo* or *Unavailable*, with the time it was fetched.
- **No fabrication.** With missing keys the app shows a red **DEMO** badge and labelled sample data, or an explicit "not connected yet" panel. It never presents invented numbers as real.
- **AI never trades.** AI modules (Phase 4) will have no access to the trade route. Orders require a human confirmation dialog.

## 2. Technology stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router), React 19, TypeScript | Server routes keep keys secret; one deploy on Vercel |
| Styling | Tailwind CSS 4 + a custom design-token stylesheet | Distinctive editorial look, light/dark, text scaling |
| Charts | **TradingView Lightweight Charts** (prices), **d3-hierarchy** (heatmap) | Fast, beautiful, free |
| Maps (Ph. 3) | MapLibre GL + free vector tiles, or D3-geo | No paid map key needed |
| Animation | CSS transitions (Framer Motion only where it earns its weight) | Small bundle, respects "reduce motion" |
| Data & trading | **Alpaca** (paper) | Free account, positions, orders, history, news, screeners |
| Database/Auth | **Supabase** (Phase 1b) | Postgres + Auth (incl. MFA) + Storage + RLS + cron |
| AI | **Claude API** (Anthropic), Grok optional | Reasoning, analysis, citations |
| Hosting | **Vercel** | Auto-deploys from GitHub |

## 3. Database schema

See [`supabase/schema.sql`](../supabase/schema.sql): profiles & preferences, investment journal, research library, alerts + alert events (with dedupe keys and cooldowns), briefings, shared news/analysis caches, data-source status, audit log. Row Level Security is enabled on every table; user tables are restricted to `auth.uid()`.

Alpaca stays the source of truth for account, positions, orders and the watchlist. They are not duplicated in the database.

## 4. API keys

| Variable | Where to get it | Phase | Cost |
|---|---|---|---|
| `ALPACA_KEY_ID`, `ALPACA_SECRET_KEY` | app.alpaca.markets → **Paper** → API Keys | 1 | Free |
| `APP_PASSCODE` | You choose it | 1 | — |
| `SESSION_SECRET` | Any long random string (40+ characters) | 1 | — |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | supabase.com → project → Settings → API | 1b | Free tier |
| `FMP_API_KEY` | financialmodelingprep.com | 2 | Free tier / paid |
| `FINNHUB_API_KEY` | finnhub.io | 3 | Free tier |
| `FRED_API_KEY` | fred.stlouisfed.org → My Account → API Keys | 3 | Free |
| — (GDELT, SEC EDGAR, World Bank, IMF, ECB) | No key (SEC requires a contact User-Agent) | 3 | Free |
| `ANTHROPIC_API_KEY` | platform.claude.com → API Keys | 4 | Pay per use |
| `XAI_API_KEY` (optional) | console.x.ai | 4 | Pay per use |

Keys go **only** in Vercel → Settings → Environment Variables (and `.env.local` for local work). Never in code, never with a `NEXT_PUBLIC_` prefix unless it is a public value.

## 5. Estimated monthly cost

| Service | Free option | Paid option | Notes |
|---|---|---|---|
| Vercel | **Hobby: $0** (personal, non-commercial) | Pro $20 | Hobby cron runs at most once a day, so frequent jobs go to Supabase cron |
| Supabase | **Free: $0** (pauses after ~1 week idle) | Pro $25 | Daily use keeps a free project awake |
| Alpaca | **$0**: paper trading + IEX real-time data | Full-market real-time data plan (~$99) | IEX ≈ a slice of US volume; prices are real but volume is partial |
| Claude API | — | **About $20–90/month** | Current rates per million tokens: Opus 5.5 $4 in / $20 out · Sonnet 5.5 $2 / $10 · Haiku 5.5 $0.10 / $0.50 |
| FMP | Free tier (limited calls) | ~$20–30 | Needed for statements/valuation |
| Finnhub, FRED, GDELT, SEC, World Bank, IMF | **$0** | — | |
| Reuters / Bloomberg / FT feeds | — | Enterprise licences (often thousands/month) | **Not recommended** for a private app; GDELT + Alpaca/Benzinga + official sources instead |
| Audio briefing | Browser text-to-speech: $0 | Premium voices ~$5–20 | |
| Email alerts | Resend free (3,000/month) | — | |

**Claude estimate (Opus 5.5):** 4 briefings a day (~20k tokens in, 3k out) ≈ $17/month, plus analysis of ~30 important stories a day ≈ $40/month, plus ~10 questions a day ≈ $27/month. That's **about $85/month at full use, and roughly $20–40 with light use**. Prompt caching and batch processing (50% cheaper for non-urgent jobs) bring this down. Using a cheaper model for some jobs is a choice you can make later.

**Realistic total:** about $0 with everything free and no AI; about $25–60/month with AI used moderately; more only if you buy full real-time data or premium plans. Prices other than Claude's should be checked on each provider's site when you sign up.

## 6. Development roadmap

| Phase | Content | Status |
|---|---|---|
| **1 Foundation** | Design system, navigation, passcode access, Alpaca paper integration, Overview, Portfolio, Markets (indices, heatmap, movers), Live News, Stock research (charts + price-based statistics), Trading Center, Settings, IT/EN, light/dark, text size | **Done (this release)** |
| 1b | Supabase: accounts with MFA, saved preferences, audit log in DB | Next |
| 2 Research | Financial statements, valuation multiples, peers, comparisons, screener (FMP + SEC EDGAR) | |
| 3 Global intelligence | **Done:** Global Intelligence (13 GDELT topic feeds + Alpaca news, de-duplication, source tiers, country/company detection, filters) and World Map (World Bank indicators, country ETFs, news layers, watch index, routes & chokepoints, country dossier). **Still to do:** macro dashboard (FRED), calendar (Finnhub), official RSS sources, scheduled background collection | Partly done |
| 4 AI | Claude analyst, news-impact analysis, daily newspaper (+ audio), Investment Committee, Ask the News, Connect the Dots | |
| 5 Analytics | **Done:** Risk Radar (concentration, sectors, regions, USD exposure, volatility, beta, VaR/ES, Sharpe/Sortino/alpha, correlations, rate/inflation sensitivity) and Simulation Lab (compound interest, Monte Carlo, historical crashes, 11 shock scenarios, backtest). **Still to do:** valuation lab (needs FMP), Opportunity Radar | Partly done |
| 6 Personal | **Done:** Financial Academy (10 lessons, 40-term glossary). **Still to do:** alerts, journal, library, clickable glossary terms everywhere | Partly done |
| 7 Live trading | Security review, separate live keys, explicit authorisation, limits, kill switch | Only with your explicit go-ahead |

## 7. Folder structure

```
app/
  (app)/                 pages inside the main shell (sidebar + top bar)
    page.tsx             Overview dashboard
    portfolio/ markets/ news/ research/ research/[symbol]/ trade/ settings/
    s/[section]/         "coming in phase N" pages for sections not built yet
  api/
    auth/                login / logout
    data/[resource]/     read-only data gateway
    trade/               paper orders (place / cancel)
    watchlist/           add / remove
  login/                 access page
  layout.tsx  globals.css (design system)
components/              shell, prefs (language/theme/size), ui primitives, charts, widgets, news
hooks/useApi.ts          fetch + polling hook
lib/
  server/                alpaca.ts, demo.ts, session.ts, guard.ts  (server-only)
  i18n.ts sections.ts universe.ts types.ts format.ts
proxy.ts                 access gate (Next.js 16 "proxy", formerly middleware)
supabase/schema.sql      database schema with Row Level Security
docs/ARCHITECTURE.md     this file
```

## 8. Design system

- **Palette:** forest green `#112A23` (sidebar, ink of authority), warm ivory `#F5F2E9` (paper), muted gold `#B99A5E` (hairlines, accents, focus), charcoal `#171C21` (text), sage `#89968A` (secondary). Gains `#2C6A4D`, losses an oxblood `#9C3A2C`: never neon. For contrast, gold and sage are darkened when used as small text.
- **Type:** *Cormorant Garamond* for headlines (editorial, Italian-book feel); *Inter* with tabular figures for every number.
- **Geometry:** square corners, 1-pixel rules and double rules (newspaper mastheads) instead of rounded cards and shadows; generous whitespace; 12-column editorial grid with vertical rules.
- **Signals:** every block carries a small source tag: a dot (green = real-time, gold = delayed, red = demo/unavailable), the provider and the time.
- **Motion:** gentle page rise, gold shimmer while loading, scrolling index ticker. All of it is disabled when the device asks for reduced motion.
- **Access:** 3 text sizes, light/dark, keyboard focus rings in gold, Italian and English.

## 9. Setup & integration steps

See the README for click-by-click instructions.
