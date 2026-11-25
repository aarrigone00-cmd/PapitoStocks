-- ═══════════════════════════════════════════════════════════════════
-- Papitostocks — database schema (Supabase / PostgreSQL)
-- Phase 1b. Apply in Supabase → SQL Editor → New query → Run.
-- Every user-owned table has Row Level Security: a signed-in user can
-- only ever read or write their own rows.
-- Brokerage credentials are NEVER stored here (they live in Vercel env vars).
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- Profile & preferences ------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  language      text not null default 'it' check (language in ('it','en')),
  timezone      text not null default 'Europe/Rome',
  theme         text not null default 'light' check (theme in ('light','dark')),
  text_scale    text not null default 'md' check (text_scale in ('md','lg','xl')),
  explanation_level text not null default 'simple' check (explanation_level in ('simple','intermediate','advanced')),
  dashboard_layout jsonb not null default '{}'::jsonb,
  trading_mode  text not null default 'paper' check (trading_mode in ('research','paper','live')),
  live_trading_authorized_at timestamptz,          -- Phase 7: explicit opt-in
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Investment journal -----------------------------------------------------
create table public.journal_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  symbol        text not null,
  kind          text not null check (kind in ('purchase','sale','review','note')),
  thesis        text,
  expected_risks text,
  goals         text,
  valuation_assumptions jsonb,
  exit_reason   text,
  lessons       text,
  linked_order_id text,                             -- Alpaca order id, if any
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on public.journal_entries (user_id, symbol);

-- Research library -------------------------------------------------------
create table public.library_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  kind          text not null check (kind in ('article','report','filing','ai_analysis','thesis','valuation','note')),
  title         text not null,
  url           text,
  source        text,
  symbols       text[] not null default '{}',
  tags          text[] not null default '{}',
  body          text,
  storage_path  text,                               -- Supabase Storage object
  created_at    timestamptz not null default now()
);
create index on public.library_items using gin (symbols);

-- Alerts -----------------------------------------------------------------
create table public.alerts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  kind          text not null check (kind in ('price','move','news','earnings','dividend','macro','central_bank','concentration','fundamentals','watchlist','thesis')),
  symbol        text,
  params        jsonb not null default '{}'::jsonb, -- e.g. {"above": 450}
  importance    smallint not null default 2 check (importance between 1 and 3),
  channels      text[] not null default '{in_app}',
  active        boolean not null default true,
  cooldown_minutes int not null default 240,        -- prevents duplicate alerts
  last_fired_at timestamptz,
  created_at    timestamptz not null default now()
);
create table public.alert_events (
  id            uuid primary key default gen_random_uuid(),
  alert_id      uuid not null references public.alerts(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  message       text not null,
  dedupe_key    text not null,
  read_at       timestamptz,
  created_at    timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

-- Briefings (daily newspaper) -------------------------------------------
create table public.briefings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  slot          text not null check (slot in ('overnight','premarket','midday','close')),
  for_date      date not null,
  content       jsonb not null,                     -- sections with cited sources
  model         text,
  audio_path    text,
  created_at    timestamptz not null default now(),
  unique (user_id, slot, for_date)
);

-- Shared caches (not user-owned; written only by the server) -------------
create table public.news_articles (
  id            text primary key,                   -- provider:id
  provider      text not null,                      -- alpaca | gdelt | ...
  headline      text not null,
  summary       text,
  url           text not null,
  source        text not null,
  published_at  timestamptz not null,
  updated_at    timestamptz,
  symbols       text[] not null default '{}',
  countries     text[] not null default '{}',
  topics        text[] not null default '{}',
  dedupe_hash   text not null,
  fetched_at    timestamptz not null default now()
);
create index on public.news_articles (published_at desc);
create index on public.news_articles (dedupe_hash);

create table public.news_analyses (
  article_id    text primary key references public.news_articles(id) on delete cascade,
  model         text not null,
  analysis      jsonb not null,                     -- the 12 questions, sector impacts, uncertainty
  created_at    timestamptz not null default now()
);

create table public.data_source_status (
  source        text primary key,
  last_success_at timestamptz,
  last_error    text,
  updated_at    timestamptz not null default now()
);

-- Audit log (orders, logins, settings changes) ---------------------------
create table public.audit_log (
  id            bigint generated always as identity primary key,
  user_id       uuid references auth.users(id) on delete set null,
  action        text not null,
  detail        jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- Row Level Security ------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.journal_entries enable row level security;
alter table public.library_items   enable row level security;
alter table public.alerts          enable row level security;
alter table public.alert_events    enable row level security;
alter table public.briefings       enable row level security;
alter table public.news_articles   enable row level security;
alter table public.news_analyses   enable row level security;
alter table public.data_source_status enable row level security;
alter table public.audit_log       enable row level security;

create policy "own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own journal" on public.journal_entries for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own library" on public.library_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own alerts" on public.alerts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own alert events" on public.alert_events for select using (user_id = auth.uid());
create policy "own briefings" on public.briefings for select using (user_id = auth.uid());
create policy "own audit" on public.audit_log for select using (user_id = auth.uid());
-- Shared caches: signed-in users may read; only the service role (server) writes.
create policy "read news" on public.news_articles for select to authenticated using (true);
create policy "read analyses" on public.news_analyses for select to authenticated using (true);
create policy "read source status" on public.data_source_status for select to authenticated using (true);
