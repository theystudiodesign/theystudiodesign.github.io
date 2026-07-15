-- ============================================================
-- Migration 002: RLS, views, RPCs, triggers (SECURITY_REVIEW.md matrix).
-- Every request server-authorized. No client-side trust.
-- ============================================================

-- ---------- membership helpers (security definer, stable) ----------
create or replace function is_member(p_client uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from portal_members m
    where m.user_id = auth.uid() and m.client_id = p_client and m.status = 'active') $$;

create or replace function is_owner(p_client uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from portal_members m
    where m.user_id = auth.uid() and m.client_id = p_client and m.status = 'active'
      and m.role in ('client_owner','studio')) $$;

create or replace function is_studio() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from portal_members m
    where m.user_id = auth.uid() and m.role = 'studio' and m.status = 'active') $$;

create or replace function project_client(p_project uuid) returns uuid
  language sql stable security definer set search_path = public as $$
  select client_id from portal_projects where id = p_project $$;

-- ---------- enable RLS ----------
do $$ declare t text;
begin foreach t in array array['portal_members','portal_projects','milestones','notes','assets',
  'approvals','invoices','availability_rules','availability_overrides','bookings','notifications','audit_log'] loop
  execute format('alter table %I enable row level security', t);
end loop; end $$;

-- members
drop policy if exists m_studio on portal_members;
create policy m_studio on portal_members for all using (is_studio()) with check (is_studio());
drop policy if exists m_self on portal_members;
create policy m_self on portal_members for select using (user_id = auth.uid());
drop policy if exists m_owner_manage on portal_members;
create policy m_owner_manage on portal_members for insert
  with check (is_owner(client_id) and role = 'client_member');

-- projects
drop policy if exists p_studio on portal_projects;
create policy p_studio on portal_projects for all using (is_studio()) with check (is_studio());
drop policy if exists p_read on portal_projects;
create policy p_read on portal_projects for select using (published and deleted_at is null and is_member(client_id));

-- milestones / notes / assets read via project membership
drop policy if exists ms_studio on milestones;
create policy ms_studio on milestones for all using (is_studio()) with check (is_studio());
drop policy if exists ms_read on milestones;
create policy ms_read on milestones for select using (deleted_at is null and is_member(project_client(portal_project_id)));

drop policy if exists nt_studio on notes;
create policy nt_studio on notes for all using (is_studio()) with check (is_studio());
drop policy if exists nt_read on notes;
create policy nt_read on notes for select using (published_at is not null and deleted_at is null and is_member(project_client(portal_project_id)));

drop policy if exists as_studio on assets;
create policy as_studio on assets for all using (is_studio()) with check (is_studio());
drop policy if exists as_read on assets;
create policy as_read on assets for select using (deleted_at is null and status <> 'draft' and is_member(project_client(portal_project_id)));

-- approvals: append-only; client_owner may insert for shared deliverables of their client
drop policy if exists ap_studio on approvals;
create policy ap_studio on approvals for all using (is_studio()) with check (is_studio());
drop policy if exists ap_read on approvals;
create policy ap_read on approvals for select using (
  exists (select 1 from assets a where a.id = asset_id and is_member(project_client(a.portal_project_id))));
drop policy if exists ap_insert on approvals;
create policy ap_insert on approvals for insert with check (
  decided_by = auth.uid()
  and exists (select 1 from assets a where a.id = asset_id
    and a.kind = 'deliverable' and a.status = 'shared'
    and is_owner(project_client(a.portal_project_id))));
-- no update/delete policies → approvals are immutable

-- invoices
drop policy if exists in_studio on invoices;
create policy in_studio on invoices for all using (is_studio()) with check (is_studio());
drop policy if exists in_read on invoices;
create policy in_read on invoices for select using (status <> 'draft' and deleted_at is null and is_member(client_id));

-- availability readable by any active member (needed to render picker); writable studio-only
drop policy if exists av_studio on availability_rules;
create policy av_studio on availability_rules for all using (is_studio()) with check (is_studio());
drop policy if exists av_read on availability_rules;
create policy av_read on availability_rules for select using (active and auth.uid() is not null);
drop policy if exists ao_studio on availability_overrides;
create policy ao_studio on availability_overrides for all using (is_studio()) with check (is_studio());
drop policy if exists ao_read on availability_overrides;
create policy ao_read on availability_overrides for select using (auth.uid() is not null);

-- bookings: read own client; INSERT denied (RPC only); cancel own via RPC
drop policy if exists bk_studio on bookings;
create policy bk_studio on bookings for all using (is_studio()) with check (is_studio());
drop policy if exists bk_read on bookings;
create policy bk_read on bookings for select using (is_member(client_id));

-- notifications: system writes; user reads/updates own
drop policy if exists nf_read on notifications;
create policy nf_read on notifications for select using (user_id = auth.uid());
drop policy if exists nf_update on notifications;
create policy nf_update on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- audit: studio read only
drop policy if exists al_studio on audit_log;
create policy al_studio on audit_log for select using (is_studio());

-- ---------- client-safe views (security_invoker → RLS applies) ----------
create or replace view v_client_projects with (security_invoker = true) as
  select id, client_id, name, summary, status, progress, starts_at, due_at, updated_at
  from portal_projects where published and deleted_at is null;

create or replace view v_client_notes with (security_invoker = true) as
  select id, portal_project_id, title, body_md, published_at
  from notes where published_at is not null and deleted_at is null;

create or replace view v_client_deliverables with (security_invoker = true) as
  select id, portal_project_id, title, version, status, file_path, preview_path, size_bytes, mime, shared_at, created_at
  from assets where kind = 'deliverable' and status <> 'draft' and deleted_at is null;

create or replace view v_client_files with (security_invoker = true) as
  select id, portal_project_id, title, version, file_path, size_bytes, mime, created_at
  from assets where kind = 'file' and status = 'shared' and deleted_at is null;

-- ---------- audit + status + notification triggers ----------
create or replace function log_audit(p_action text, p_entity text, p_id uuid, p_meta jsonb default '{}')
  returns void language sql security definer set search_path = public as $$
  insert into audit_log(actor, action, entity, entity_id, meta) values (auth.uid(), p_action, p_entity, p_id, p_meta) $$;

create or replace function notify(p_user uuid, p_type text, p_payload jsonb)
  returns void language sql security definer set search_path = public as $$
  insert into notifications(user_id, type, payload) values (p_user, p_type, p_payload) $$;

-- an approval decision updates the deliverable + notifies studio + audit (append-only trail preserved)
create or replace function on_approval() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update assets set status = new.decision where id = new.asset_id;
  perform log_audit('approval', 'asset', new.asset_id, jsonb_build_object('decision', new.decision));
  return new;
end $$;
drop trigger if exists trg_on_approval on approvals;
create trigger trg_on_approval after insert on approvals for each row execute function on_approval();

-- notify members when a note/deliverable becomes visible
create or replace function on_asset_shared() returns trigger language plpgsql security definer set search_path = public as $$
declare m record; cid uuid;
begin
  if new.status = 'shared' and (old.status is distinct from 'shared') then
    cid := project_client(new.portal_project_id);
    for m in select user_id from portal_members where client_id = cid and status = 'active' loop
      perform notify(m.user_id, 'deliverable_shared', jsonb_build_object('title', new.title, 'url', '/deliverables/'||new.id));
    end loop;
  end if;
  return new;
end $$;
drop trigger if exists trg_asset_shared on assets;
create trigger trg_asset_shared after update on assets for each row execute function on_asset_shared();
