create extension if not exists pgcrypto;

create table if not exists public.wm_investment_products (
  id text primary key,
  name text not null,
  category text not null check (category in ('bond', 'unit_trust', 'insurance', 'equity')),
  return_min numeric not null,
  return_max numeric not null,
  return_display text not null,
  min_investment_ugx bigint not null,
  risk_level text not null check (risk_level in ('low', 'low_medium', 'medium', 'high')),
  horizon_min_years integer,
  horizon_max_years integer,
  description text not null,
  projection_note text,
  last_updated timestamptz default now(),
  stale_after_days integer not null default 30,
  source_url text,
  expert_note text,
  is_featured boolean default false,
  is_active boolean default true
);

create table if not exists public.wm_macro_indicators (
  key text primary key,
  label text not null,
  value numeric not null,
  period text not null,
  trend text check (trend in ('rising', 'stable', 'falling')),
  last_updated timestamptz default now(),
  stale_after_days integer not null
);

create table if not exists public.wm_company_intelligence (
  id uuid primary key default gen_random_uuid(),
  product_id text references public.wm_investment_products(id),
  company_name text not null,
  verdict text check (verdict in ('strong', 'moderate', 'caution', 'avoid')),
  verdict_label text,
  score_financial numeric check (score_financial >= 0 and score_financial <= 10),
  score_leadership numeric check (score_leadership >= 0 and score_leadership <= 10),
  score_culture numeric check (score_culture >= 0 and score_culture <= 10),
  score_market numeric check (score_market >= 0 and score_market <= 10),
  overall_confidence numeric check (overall_confidence >= 0 and overall_confidence <= 1),
  claude_read text not null,
  signals jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  raw_sources_scraped jsonb,
  generated_at timestamptz default now(),
  next_refresh timestamptz
);

create table if not exists public.wm_user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  total_target_ugx bigint not null,
  timeframe_years integer not null,
  passive_income_pct integer not null default 30,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.wm_business_canvases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  sector text,
  idea text,
  capital_range text,
  background text,
  concern text,
  revenue_goal_range text,
  canvas_json jsonb not null,
  generated_at timestamptz default now()
);

alter table public.wm_user_goals enable row level security;
alter table public.wm_business_canvases enable row level security;
alter table public.wm_investment_products enable row level security;
alter table public.wm_macro_indicators enable row level security;
alter table public.wm_company_intelligence enable row level security;

drop policy if exists "user_goals_select_own" on public.wm_user_goals;
create policy "user_goals_select_own" on public.wm_user_goals
for select using (auth.uid() = user_id);

drop policy if exists "user_goals_insert_own" on public.wm_user_goals;
create policy "user_goals_insert_own" on public.wm_user_goals
for insert with check (auth.uid() = user_id);

drop policy if exists "user_goals_update_own" on public.wm_user_goals;
create policy "user_goals_update_own" on public.wm_user_goals
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_goals_delete_own" on public.wm_user_goals;
create policy "user_goals_delete_own" on public.wm_user_goals
for delete using (auth.uid() = user_id);

drop policy if exists "business_canvases_select_own" on public.wm_business_canvases;
create policy "business_canvases_select_own" on public.wm_business_canvases
for select using (auth.uid() = user_id);

drop policy if exists "business_canvases_insert_own" on public.wm_business_canvases;
create policy "business_canvases_insert_own" on public.wm_business_canvases
for insert with check (auth.uid() = user_id);

drop policy if exists "business_canvases_update_own" on public.wm_business_canvases;
create policy "business_canvases_update_own" on public.wm_business_canvases
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "business_canvases_delete_own" on public.wm_business_canvases;
create policy "business_canvases_delete_own" on public.wm_business_canvases
for delete using (auth.uid() = user_id);

drop policy if exists "investment_products_public_read" on public.wm_investment_products;
create policy "investment_products_public_read" on public.wm_investment_products
for select using (true);

drop policy if exists "macro_indicators_public_read" on public.wm_macro_indicators;
create policy "macro_indicators_public_read" on public.wm_macro_indicators
for select using (true);

drop policy if exists "company_intelligence_public_read" on public.wm_company_intelligence;
create policy "company_intelligence_public_read" on public.wm_company_intelligence
for select using (true);
