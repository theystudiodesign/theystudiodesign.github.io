-- ============================================================
-- THE'Y Gestion · SyncEngine v2 — migration tombstones
-- À exécuter UNE FOIS: Supabase Dashboard → SQL Editor → Run
-- Ajoute le soft-delete (deleted_at), la version et l'origine (device_id).
-- AUCUNE donnée n'est modifiée. Le moteur v2 n'émet plus JAMAIS de DELETE physique.
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['clients','projets','taches','paiements','events'] loop
    execute format('alter table public.%I add column if not exists deleted_at timestamptz', t);
    execute format('alter table public.%I add column if not exists version int not null default 0', t);
    execute format('alter table public.%I add column if not exists device_id text', t);
  end loop;
end $$;

-- index utiles pour le pull (lignes par utilisateur, tombstones inclus)
create index if not exists idx_clients_user_del   on public.clients(user_id, deleted_at);
create index if not exists idx_paiements_user_del on public.paiements(user_id, deleted_at);
