-- ============================================================
-- Migration 004: private Storage buckets + object RLS.
-- Path convention: {bucket}/{client_id}/... — first folder = client scope.
-- Clients read via short-lived signed URLs (createSignedUrl), which the
-- Storage API authorizes against these SELECT policies.
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('assets','assets',false), ('invoices','invoices',false), ('previews','previews',false)
on conflict (id) do nothing;

drop policy if exists storage_assets_read on storage.objects;
create policy storage_assets_read on storage.objects for select
  using (bucket_id in ('assets','previews') and is_member(((storage.foldername(name))[1])::uuid));
drop policy if exists storage_invoices_read on storage.objects;
create policy storage_invoices_read on storage.objects for select
  using (bucket_id = 'invoices' and is_member(((storage.foldername(name))[1])::uuid));
drop policy if exists storage_studio_all on storage.objects;
create policy storage_studio_all on storage.objects for all
  using (is_studio()) with check (is_studio());
-- no INSERT/UPDATE/DELETE policies for client roles → clients can never write
