-- ============================================================
-- THE'Y Client Portal — migration 001: schema
-- Additive only. Does NOT touch Gestion tables (clients, projets, taches,
-- paiements, events remain studio-only with their existing RLS).
-- Run once in Supabase SQL Editor. Requires: pgcrypto, btree_gist.
-- ============================================================
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ---------- membership (authorization pivot) ----------
create table if not exists portal_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  role text not null check (role in ('studio','client_owner','client_member')),
  status text not null default 'invited' check (status in ('invited','active','revoked')),
  invited_by uuid references auth.users(id),
  notification_prefs jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);

-- ---------- published projection of a Gestion project ----------
create table if not exists portal_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  projet_id uuid references public.projets(id) on delete set null,
  name text not null,
  summary text,
  status text not null default 'active' check (status in ('active','paused','done')),
  progress int not null default 0 check (progress between 0 and 100),
  starts_at date, due_at date,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null references portal_projects(id) on delete cascade,
  title text not null, due_at date,
  status text not null default 'todo' check (status in ('todo','doing','done')),
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null references portal_projects(id) on delete cascade,
  title text not null, body_md text not null,
  author_id uuid not null references auth.users(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null references portal_projects(id) on delete cascade,
  kind text not null default 'deliverable' check (kind in ('deliverable','file')),
  title text not null, version text not null default 'v1',
  file_path text not null, preview_path text, size_bytes bigint, mime text,
  status text not null default 'draft' check (status in ('draft','shared','approved','changes_requested')),
  shared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (kind = 'deliverable' or status in ('draft','shared'))
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  decided_by uuid not null references auth.users(id),
  decision text not null check (decision in ('approved','changes_requested')),
  note text,
  decided_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  paiement_id uuid references public.paiements(id) on delete set null,
  number text not null unique,
  issued_at date not null, due_at date,
  amount_cents bigint not null, currency text not null default 'MAD',
  status text not null default 'sent' check (status in ('draft','sent','paid','overdue','void')),
  pdf_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------- native booking (provider-agnostic) ----------
create table if not exists availability_rules (
  id uuid primary key default gen_random_uuid(),
  weekday int not null check (weekday between 0 and 6),
  start_min int not null check (start_min between 0 and 1439),
  end_min int not null check (end_min > start_min and end_min <= 1440),
  slot_minutes int not null default 30,
  timezone text not null default 'Africa/Casablanca',
  active boolean not null default true
);
create table if not exists availability_overrides (
  id uuid primary key default gen_random_uuid(),
  on_date date not null,
  kind text not null check (kind in ('closed','extra')),
  start_min int, end_min int, note text
);
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  booked_by uuid references auth.users(id),
  title text not null default 'Project check-in',
  starts_at timestamptz not null, ends_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed','canceled','completed')),
  provider text not null default 'native', provider_ref text,
  created_at timestamptz not null default now(),
  constraint bookings_no_overlap exclude using gist
    (tstzrange(starts_at, ends_at) with &&) where (status = 'confirmed')
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  read_at timestamptz, emailed_at timestamptz
);

create table if not exists audit_log (
  id bigint generated always as identity primary key,
  actor uuid references auth.users(id),
  action text not null, entity text not null, entity_id uuid,
  meta jsonb not null default '{}', at timestamptz not null default now()
);

-- ---------- indexes ----------
create index if not exists idx_members_user   on portal_members(user_id);
create index if not exists idx_members_client on portal_members(client_id);
create index if not exists idx_projects_client on portal_projects(client_id);
create index if not exists idx_milestones_proj on milestones(portal_project_id);
create index if not exists idx_notes_proj on notes(portal_project_id);
create index if not exists idx_assets_proj on assets(portal_project_id, kind, status);
create index if not exists idx_invoices_client on invoices(client_id, status);
create index if not exists idx_notifications_user on notifications(user_id, read_at);
create index if not exists idx_bookings_range on bookings using gist (tstzrange(starts_at, ends_at));

-- ---------- updated_at trigger ----------
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
do $$ declare t text;
begin foreach t in array array['portal_projects','milestones','assets','invoices'] loop
  execute format('drop trigger if exists trg_touch on %I', t);
  execute format('create trigger trg_touch before update on %I for each row execute function touch_updated_at()', t);
end loop; end $$;
