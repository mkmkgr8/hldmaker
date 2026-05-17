-- Run this in Supabase SQL editor or via supabase db push

create extension if not exists "pgcrypto";

-- ── Designs ────────────────────────────────────────────────────────────────
create table if not exists public.designs (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid references auth.users(id) on delete cascade not null,
  name            text not null default 'Untitled design',
  canvas          jsonb not null default '{"viewport":{"x":0,"y":0,"zoom":1},"nodes":[],"edges":[]}',
  evaluation      jsonb not null default '{"last_run_at":null,"results":[]}',
  last_editor_id  text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists designs_owner_id_idx on public.designs(owner_id);
create index if not exists designs_updated_at_idx on public.designs(updated_at desc);

-- ── Row-level security ──────────────────────────────────────────────────────
alter table public.designs enable row level security;

-- Owner can do everything
create policy "owner_all" on public.designs
  for all
  using  (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ── Auto-update updated_at ─────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger designs_set_updated_at
  before update on public.designs
  for each row execute function public.set_updated_at();

-- ── Enable realtime for this table ────────────────────────────────────────
-- Run in Supabase dashboard → Database → Replication → Add table: designs
-- Or via SQL:
alter publication supabase_realtime add table public.designs;
