# Client Portal — Data Model

*Draft DDL is documentation of intent — reviewed, then executed in the implementation sprint (never before approval).*

## 1. Entity-relationship diagram

```mermaid
erDiagram
    AUTH_USERS ||--o{ PORTAL_MEMBERS : "is"
    CLIENTS ||--o{ PORTAL_MEMBERS : "has members"
    CLIENTS ||--o{ PORTAL_PROJECTS : "owns"
    CLIENTS ||--o{ INVOICES : "billed"
    CLIENTS ||--o{ BOOKINGS : "books"
    PROJETS |o--o{ PORTAL_PROJECTS : "projected as (soft ref)"
    PAIEMENTS |o--o{ INVOICES : "linked (soft ref)"
    PORTAL_PROJECTS ||--o{ MILESTONES : "timeline"
    PORTAL_PROJECTS ||--o{ NOTES : "notes"
    PORTAL_PROJECTS ||--o{ ASSETS : "deliverables + files"
    ASSETS ||--o{ APPROVALS : "decided by (kind=deliverable)"
    AVAILABILITY_RULES ||..o{ BOOKINGS : "constrains (computed slots)"
    AVAILABILITY_OVERRIDES ||..o{ BOOKINGS : "constrains"
    AUTH_USERS ||--o{ NOTIFICATIONS : "receives"
    AUTH_USERS ||--o{ AUDIT_LOG : "acts"
```

`CLIENTS`, `PROJETS`, `PAIEMENTS` are the existing Gestion tables — **untouched**, studio-only RLS. All `PORTAL_*` tables are new. Soft references (nullable FK, `on delete set null`) so Gestion's lifecycle never breaks the portal.

## 2. Tables (draft DDL)

```sql
-- membership: the authorization pivot
create table portal_members (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  client_id   uuid not null references public.clients(id) on delete cascade,
  role        text not null check (role in ('studio','client_owner','client_member')),
  status      text not null default 'invited' check (status in ('invited','active','revoked')),
  invited_by  uuid references auth.users(id),
  notification_prefs jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  unique (user_id, client_id)
);

-- published projection of a Gestion project
create table portal_projects (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  projet_id   uuid references public.projets(id) on delete set null,   -- soft link to Gestion
  name        text not null,
  summary     text,
  status      text not null default 'active' check (status in ('active','paused','done')),
  progress    int  not null default 0 check (progress between 0 and 100), -- set at publish time
  starts_at   date, due_at date,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table milestones (
  id          uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null references portal_projects(id) on delete cascade,
  title       text not null,
  due_at      date,
  status      text not null default 'todo' check (status in ('todo','doing','done')),
  sort        int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table notes (                              -- the "Notes" module (studio → client)
  id          uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null references portal_projects(id) on delete cascade,
  title       text not null,
  body_md     text not null,
  author_id   uuid not null references auth.users(id),
  published_at timestamptz,                       -- null = draft, invisible to clients
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table assets (                             -- Deliverables (approval flow) + Files (simple share)
  id          uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null references portal_projects(id) on delete cascade,
  kind        text not null default 'deliverable' check (kind in ('deliverable','file')),
  title       text not null,
  version     text not null default 'v1',
  file_path   text not null,                      -- storage: assets/{client_id}/{id}/{filename}
  preview_path text,
  size_bytes  bigint,
  mime        text,
  status      text not null default 'draft'
              check (status in ('draft','shared','approved','changes_requested')),
  shared_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  check (kind = 'deliverable' or status in ('draft','shared'))  -- files never enter approval states
);

-- append-only decision trail (kind='deliverable' only, enforced by policy + trigger)
create table approvals (
  id          uuid primary key default gen_random_uuid(),
  asset_id    uuid not null references assets(id) on delete cascade,
  decided_by  uuid not null references auth.users(id),
  decision    text not null check (decision in ('approved','changes_requested')),
  note        text,
  decided_at  timestamptz not null default now()
);

create table invoices (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  paiement_id uuid references public.paiements(id) on delete set null,  -- soft link to Gestion
  number      text not null unique,               -- e.g. THEY-2026-014
  issued_at   date not null,
  due_at      date,
  amount_cents bigint not null,
  currency    text not null default 'MAD',
  status      text not null default 'sent' check (status in ('draft','sent','paid','overdue','void')),
  pdf_path    text,                               -- storage: invoices/{client_id}/{number}.pdf
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- NATIVE booking (provider-agnostic; DECIDED: no Calendly dependency)
create table availability_rules (                 -- studio-owned recurring windows
  id          uuid primary key default gen_random_uuid(),
  weekday     int  not null check (weekday between 0 and 6),   -- 0 = Monday
  start_min   int  not null check (start_min between 0 and 1439),
  end_min     int  not null check (end_min > start_min and end_min <= 1440),
  slot_minutes int not null default 30,
  timezone    text not null default 'Africa/Casablanca',
  active      boolean not null default true
);

create table availability_overrides (             -- holidays / exceptional windows
  id          uuid primary key default gen_random_uuid(),
  on_date     date not null,
  kind        text not null check (kind in ('closed','extra')),
  start_min   int, end_min int,                   -- required when kind='extra'
  note        text
);

create table bookings (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  booked_by   uuid references auth.users(id),
  title       text not null default 'Project check-in',
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  status      text not null default 'confirmed' check (status in ('confirmed','canceled','completed')),
  provider    text not null default 'native',     -- future adapters: 'calendly', …
  provider_ref text,                              -- external id when provider ≠ native
  created_at  timestamptz not null default now(),
  constraint bookings_no_overlap exclude using gist
    (tstzrange(starts_at, ends_at) with &&) where (status = 'confirmed')
);
-- double-booking is impossible by CONSTRAINT (btree_gist), not by UI or race-prone checks

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,                      -- update_published | deliverable_shared | ...
  payload     jsonb not null default '{}',        -- {project_id, title, url…}
  created_at  timestamptz not null default now(),
  read_at     timestamptz,
  emailed_at  timestamptz
);

create table audit_log (
  id          bigint generated always as identity primary key,
  actor       uuid references auth.users(id),
  action      text not null,                      -- publish_project | share_deliverable | approve | ...
  entity      text not null, entity_id uuid,
  meta        jsonb not null default '{}',
  at          timestamptz not null default now()
);
```

Indexes: every `client_id`, `portal_project_id`, `user_id` FK; `notifications (user_id, read_at)`; `assets (portal_project_id, kind, status)`; `invoices (client_id, status)`; `bookings using gist (tstzrange(starts_at, ends_at))` (backs the exclusion constraint; requires `btree_gist` extension).

## 3. Storage layout (private buckets)

```
assets/{client_id}/{asset_id}/{filename}        (deliverables + files)
invoices/{client_id}/{number}.pdf
previews/{client_id}/{asset_id}.jpg
```
Access only via signed URLs minted by RPCs that re-check membership (see API contracts §3). Bucket-level policies deny all direct reads.

## 4. Derived views (client-safe surface)

```sql
-- the only project surface clients can select from
create view v_client_projects with (security_invoker = true) as
  select id, client_id, name, summary, status, progress, starts_at, due_at, updated_at
  from portal_projects
  where published and deleted_at is null;
```
Similar `v_client_deliverables` (`kind='deliverable' and status <> 'draft'`), `v_client_files` (`kind='file' and status='shared'`), `v_client_notes` (`published_at is not null`). RLS applies through `security_invoker`. `availability_rules/overrides` are readable by authenticated members (needed to render the picker) but only ever *written* by studio.

## 5. Migration & lifecycle notes

- All DDL ships as `supabase/migrations/00X_portal_*.sql` in the portal repo — idempotent, additive; **no changes to Gestion tables**.
- Soft-delete (`deleted_at`) everywhere clients read, matching SyncEngine conventions; hard deletes only via studio maintenance scripts.
- `updated_at` maintained by a single trigger function reused across tables.
- SaaS seam: a future `studio_id uuid` column on every table above, defaulting to the current studio — additive migration, RLS predicates widen from membership to (membership AND studio).
