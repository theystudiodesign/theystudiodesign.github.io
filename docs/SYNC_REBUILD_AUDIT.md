# AUDIT PRÉ-REBUILD — couche synchronisation/persistance (avant SyncEngine v2)

> Périmètre du remplacement: UNIQUEMENT la persistance/sync. UI, pages, rendering, calculs: intouchés.

## A · Implémentation sync actuelle (À SUPPRIMER intégralement)
`gestion/index.html` — sections et fonctions:
| Bloc | Fonctions | Rôle |
|---|---|---|
| CLOUD SYNC v2 (L.785–1180) | `Cloud{}`, `toRow/fromRow`, `syncState/writeSyncState` (`they_sync_v1`/baseIds), `rowSig/cloudRebuildSigs/cloudBoot/cloudStamp/cloudOnSave`, `cloudStatus`, `cloudInit`, `cloudPull/cloudPullInner` (merge baseIds/LWW), `cloudPush` (upserts + DELETE par diff baseIds), listeners `online` (L.912) / `visibilitychange` (L.918) | moteur legacy |
| MULTI-INSTANCE | `DISK_KNOWN`, `snapshotKnown`, `mergeFromDisk`, listener `storage` (L.2412) | rustine multi-onglets |
| Diagnostics | WLOG (`they_wlog`, `they_wnonce`, détecteur L.2429/2438), TRACE-* (PULL/PUSH/SOURCES/BOOT/CLIENT, `trackStep`) | instrumentation |
| Auth | `showAuthGate/authGo/skipCloud/cloudLogout`, `AUTH_ERR_MAP`, callbacks: `onAuthStateChange` (L.899), `getSession` (L.900), `signInWithPassword/signUp` (L.1112), `signOut` (L.1175) | à re-brancher sur AuthSync |

## B · Lecteurs/écrivains localStorage
| Clé | Usage | Sort |
|---|---|---|
| `crm_gestion_clients_v1` (KEY) | LA base (DataLayer.read/write L.1094/1099, load/save) | **→ IndexedDB** (lecture unique pour migration, clé conservée en backup legacy) |
| `they_sync_v1` (baseIds/dirty) | état sync legacy | **supprimé** (remplacé par stores `queue`/`sync_state`) |
| `they_wlog`, `they_wnonce` | diagnostics | **supprimés** |
| `they_snap_1/2`, `they_last_backup`, `they_backup_snooze` | snapshots/backup (feature, pas sync) | conservés |
| `they_seeded_v1`, `they_demo_v1`, `they_rescue_orphans` | garde seed/démo/intégrité | conservés |
| `they_theme`, `they_logo`, `they_fact_*`, `they_search_recent`, `they_notif_seen` | préférences/assets/UI | conservés |
| PIN (`they_unlocked` session) | verrou | conservé |

## C · Callbacks de login
`cloudInit→getSession→showAuthGate` · `authGo(signup)→signUp/signInWithPassword→cloudPull` · `skipCloud` · `cloudLogout→signOut` · `onAuthStateChange(SIGNED_OUT)`.
→ Rebranchés sur `auth-sync.js` (UI du gate inchangée). **Le login ne déclenche plus jamais d'écrasement: uniquement `SyncEngine.sync()` (pull→merge→persist→render→push queue).**

## D · Nouvelle architecture (fichiers)
`gestion/idb.js` (wrapper IndexedDB) · `gestion/storage.js` (THEY_STUDIO_DB: stores `clients/projets/taches/paiements/events/queue/settings/sync_state`; diff+stamp `updatedAt/version/deviceId`; **soft delete** `deletedAt`; migration one-shot depuis localStorage; BroadcastChannel multi-onglets) · `gestion/queue.js` (CREATE/UPDATE/DELETE, coalescing, survit au refresh) · `gestion/sync-engine.js` (pull→merge (deletedAt gagne sur updates plus anciens; updatedAt le plus récent gagne; **jamais de suppression par absence**)→persist→render→push; déclencheurs online/visibility/débounce; single-flight) · `gestion/auth-sync.js`.
Entités: noms français conservés (`projets/taches/paiements`) — exigence « ne pas toucher la logique métier ».
Schéma Supabase: + `deleted_at timestamptz`, `version int`, `device_id text` sur les 5 tables (`supabase/migration-tombstones.sql`) — **plus aucun DELETE physique**.
