-- ============================================================
-- THE'Y STUDIO DESIGN — Gestion · Schéma PostgreSQL (Supabase)
-- Sprint 11 — à exécuter dans: Supabase Dashboard > SQL Editor
-- ============================================================

-- ===== TABLES =====

create table if not exists public.clients (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  type text, statut text, devise text default 'DH',
  salaire numeric default 0,
  email text, phone text, ice text,
  societe text, website text, adresse text,
  khedma text, notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.projets (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id text references public.clients(id) on delete set null,
  name text not null,
  type text, statut text,
  prix numeric default 0,
  deadline date, notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.taches (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id text references public.clients(id) on delete set null,
  label text not null,
  statut text, priorite text, deadline date,
  updated_at timestamptz not null default now()
);

create table if not exists public.paiements (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id text references public.clients(id) on delete set null,
  projet_id text references public.projets(id) on delete set null,
  label text not null,
  type text, montant numeric default 0, devise text,
  statut text, date date, methode text, notes text,
  facture_num text, bl_num text,
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id text references public.clients(id) on delete set null,
  title text not null,
  type text, date date, notes text,
  updated_at timestamptz not null default now()
);

-- compteurs facture/BL + petites metadonnees (1 ligne par user)
create table if not exists public.meta (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  facture_counter int default 0,
  bl_counter int default 0,
  updated_at timestamptz not null default now()
);

-- ===== INDEX =====
create index if not exists idx_clients_user on public.clients(user_id);
create index if not exists idx_projets_user on public.projets(user_id);
create index if not exists idx_taches_user on public.taches(user_id);
create index if not exists idx_paiements_user on public.paiements(user_id);
create index if not exists idx_paiements_date on public.paiements(user_id, date);
create index if not exists idx_events_user_date on public.events(user_id, date);

-- ===== ROW LEVEL SECURITY =====
alter table public.clients   enable row level security;
alter table public.projets   enable row level security;
alter table public.taches    enable row level security;
alter table public.paiements enable row level security;
alter table public.events    enable row level security;
alter table public.meta      enable row level security;

do $$
declare t text;
begin
  foreach t in array array['clients','projets','taches','paiements','events','meta'] loop
    execute format('drop policy if exists "own_rows_select" on public.%I', t);
    execute format('create policy "own_rows_select" on public.%I for select using (user_id = auth.uid())', t);
    execute format('drop policy if exists "own_rows_insert" on public.%I', t);
    execute format('create policy "own_rows_insert" on public.%I for insert with check (user_id = auth.uid())', t);
    execute format('drop policy if exists "own_rows_update" on public.%I', t);
    execute format('create policy "own_rows_update" on public.%I for update using (user_id = auth.uid())', t);
    execute format('drop policy if exists "own_rows_delete" on public.%I', t);
    execute format('create policy "own_rows_delete" on public.%I for delete using (user_id = auth.uid())', t);
  end loop;
end $$;

-- ===== STORAGE (logos facture, cachet, futurs fichiers) =====
insert into storage.buckets (id, name, public)
values ('they-assets', 'they-assets', false)
on conflict (id) do nothing;

drop policy if exists "own_assets_all" on storage.objects;
create policy "own_assets_all" on storage.objects
  for all using (bucket_id = 'they-assets' and owner = auth.uid())
  with check (bucket_id = 'they-assets' and owner = auth.uid());

-- ===== updated_at automatique =====
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['clients','projets','taches','paiements','events','meta'] loop
    execute format('drop trigger if exists trg_touch on public.%I', t);
    execute format('create trigger trg_touch before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;
