-- WIMP Analytics: Supabase Schema
-- Run this in the Supabase SQL Editor (Database → SQL Editor → New Query)

-- 1. Create events table
create table if not exists public.wimp_events (
  id          bigserial primary key,
  event       text        not null,
  ts          timestamptz not null default now(),
  payload     jsonb,
  ip_hash     text,
  country     text,
  created_at  timestamptz not null default now()
);

-- 2. Index for fast aggregate queries
create index if not exists idx_wimp_events_event on public.wimp_events (event);
create index if not exists idx_wimp_events_ts    on public.wimp_events (ts desc);

-- 3. Allow anonymous INSERT (for event tracking from the app)
alter table public.wimp_events enable row level security;

-- RLS: anyone can INSERT
create policy "Allow anon insert"
  on public.wimp_events for insert
  to anon
  with check (true);

-- RLS: only service_role can SELECT (used by Worker /api/stats)
create policy "Service role can select"
  on public.wimp_events for select
  to service_role
  using (true);

-- RLS: only service_role can DELETE (used by Worker /api/reset)
create policy "Service role can delete"
  on public.wimp_events for delete
  to service_role
  using (true);

-- 4. Verify setup
select count(*) as event_count from public.wimp_events;
