# ARCHITECTURE

- **Type** : SPA offline-first, un seul fichier `gestion/index.html` (~1 200 lignes), zéro dépendance.
- **Données** : LocalStorage, clé unique `crm_gestion_clients_v1` → `DB = {clients, projets, taches, paiements, factureCounter, blCounter}`.
  Images facture (logos/cachet) : clés séparées `they_fact_ae`, `they_fact_logo`, `they_fact_stamp` (base64).
- **Couche données** : uniquement `load()` / `save()` — point d'entrée unique pour la future migration Supabase.
- **Data Providers** : `buildSearchIndex()` et `getCalendarEvents(from,to)` — seules fonctions lisant DB pour leurs modules ; caches invalidés par `invalidateCaches()` (hook dans `save()`).
- **Entités** : clients, projets, taches, paiements, **events** (réunions/livraisons/rappels/personnel), compteurs facture/BL.
- **Rendering** : `renderAll()` global (dette acceptée à cette échelle ; optimisation ciblée prévue en Phase 1 #8).
- **PWA** : `sw.js` — network-first pour HTML, cache-first pour assets. Bump de version obligatoire à chaque release.
- **Sécurité** : PIN client-side (SHA-256, dissuasif seulement — pas une vraie auth), `esc()` sur toute sortie, try/catch sur storage/JSON.
- **Hébergement** : GitHub Pages + domaine theystudiodesign.com (CNAME).

## Cloud Sync v2 (Sprint 12)
Actif uniquement si `gestion/supabase-config.js` est rempli — sinon 100 % local, zéro changement.
- **Boot** : toujours depuis LocalStorage (cache) → UI instantanée, puis `cloudInit()` en arrière-plan.
- **Horodatage** : `save()` → `cloudStamp()` compare chaque ligne à sa signature précédente et stampe `updatedAt` sur les lignes modifiées (actif même en mode local — prépare la migration).
- **Pull-merge (LWW)** : `cloudPull()` fusionne ligne par ligne — la plus récente (`updatedAt`) gagne. Une ligne présente au cloud mais absente localement: si elle était connue au dernier sync (`baseIds`) → suppression locale en attente (skip); sinon → nouvelle ligne d'un autre appareil (ajout).
- **Push** : upsert de toutes les lignes + suppression UNIQUEMENT des ids `baseIds − local` (tombstones implicites). Jamais de `not.in` global (bug Sprint 11 corrigé: effaçait les lignes des autres appareils).
- **État persistant** : clé `they_sync_v1` = `{dirty, lastSync, baseIds}`. `dirty=true` tant qu'un push n'a pas réussi → rejoué sur event `online`, `visibilitychange` et au boot.
- **Compteurs** : `meta.facture_counter/bl_counter` fusionnés par `max()`.
- **Trigger SQL** : `touch_updated_at` respecte l'`updated_at` fourni par le client (LWW), horodate seulement les éditions directes dashboard.
- **Limite documentée** : suppression locale > édition distante (pas d'horodatage des suppressions).
- **Diagnostic** : `cloudDiagChecks()` — config vide, URL invalide, clé anon incorrecte/service_role, projet en pause, schema.sql non exécuté — chaque échec avec le fix exact. Indicateur ☁ topbar (`cloudStatus`).
- **Tests** : `tests/` — mock Supabase (GoTrue+PostgREST+RLS, zéro dépendance) + Playwright avec le vrai bundle supabase-js. 49 assertions (15 scénarios). `cd tests && npm install && npm run build:vendor && npm test`.

## Migration Supabase (contrat — Sprint 10)
`DataLayer` est l'unique point de contact stockage. Pour migrer :
1. Tables : `clients`, `projets`, `taches`, `paiements`, `events` (+ table `meta` pour factureCounter/blCounter) — colonnes = champs actuels, `id` text (uid existants), `user_id` uuid + RLS par utilisateur.
2. Réécrire `DataLayer.read/write` en appels Supabase (peuvent devenir async ; load()/save() restent les seuls appelants).
3. `normalize()` inchangé (garanties de schéma).
4. Auth Supabase remplace le PIN ; Storage remplace les images base64.
L'UI, les data providers (recherche, calendrier, notifications) et les rapports ne changent pas.

## Limites structurelles (→ Phase 2 uniquement)
Auth réelle, multi-user, fichiers lourds (quota ~5MB), paiements Stripe : impossibles côté client. Ne jamais simuler.
