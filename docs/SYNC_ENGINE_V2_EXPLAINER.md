# SyncEngine v2 — Explainer (réécriture de la couche persistance/sync)

## Background

L'app était offline-first mais sa persistance reposait sur **un seul blob localStorage**
(`crm_gestion_clients_v1`) réécrit en entier à chaque `save()`, plus un moteur cloud
(`cloudPull/cloudPush/baseIds`) qui, après login, pouvait **écraser le local par du cloud
périmé** : créations qui disparaissent, suppressions qui reviennent. La cause profonde était
structurelle — le cloud était traité, de fait, comme une source d'autorité concurrente.

## Intuition

> 💡 **Une seule source de vérité : la base LOCALE.** Le cloud devient un miroir asynchrone,
> jamais un maître. L'UI écrit dans IndexedDB et rend immédiatement ; une file d'opérations
> part vers Supabase en arrière-plan ; au retour, on *fusionne* (jamais on n'écrase).

Deux idées rendent ça sûr :
1. **Chaque ligne se décrit elle-même** : `updatedAt`, `version`, `deviceId`, et surtout
   `deletedAt` (soft delete). Une suppression n'est plus une absence — c'est un fait daté.
2. **La fusion ne perd jamais rien** : on compare des *temps effectifs* (`max(updatedAt,
   deletedAt)`). Le plus récent gagne ; à égalité le tombstone gagne ; une ligne locale
   inconnue du cloud est **ré-enfilée** (auto-guérison), jamais supprimée.

**Exemple** : appareil A crée « Atlas » (queue→push). B le supprime plus tard (tombstone
daté). Au sync, tout le monde voit le tombstone (deletedAt plus récent) → Atlas reste supprimé
partout, sans jamais ressusciter. Si A avait édité Atlas *après* la suppression de B, l'édition
(updatedAt plus récent) gagnerait — rien ne disparaît en silence.

## Code (5 modules, `gestion/`)

```
UI → IndexedDB (THEY_STUDIO_DB) → Render → Queue → Background Sync → Supabase
                    ▲ source de vérité                                  ▼ miroir
                    └───────────────── merge (jamais overwrite) ────────┘
```

- **`idb.js`** — wrapper Promise minimal ; 8 stores (`clients/projets/taches/paiements/events/
  queue/settings/sync_state`).
- **`storage.js`** — `loadDB()` ne renvoie que les lignes **vivantes** (l'UI ne voit jamais un
  tombstone). `persist(DB)` fait un **diff** contre l'instantané de l'onglet : stamp
  `updatedAt/version/deviceId`, transforme les suppressions en tombstones, enfile les ops,
  diffuse par `BroadcastChannel`. Migration one-shot localStorage→IDB (idempotente, gardée par
  `they_idb_migrated`). `purgeTombstone()` supprime physiquement — appelé seulement par le moteur.
- **`queue.js`** — CREATE/UPDATE/DELETE persistés en IDB, **coalescing** par `(entity,id)`
  (CREATE+DELETE d'une ligne jamais partie = rien ; UPDATE+DELETE = DELETE ; etc.).
- **`sync-engine.js`** — `sync()` single-flight : **pull** (tombstones inclus) → **merge**
  (temps effectif, jamais d'overwrite ; ré-enfilage des créations locales manquantes) →
  **persist + `reloadFromStorage()` + render** → **push** (upsert de l'état courant de chaque
  op ; jamais de DELETE physique). Retry **backoff borné** (2→60 s). Purge des tombstones
  **uniquement** après confirmation serveur + TTL 30 j.
- **`auth-sync.js`** — login/logout ; **ne touche jamais aux données** : un login réussi ne
  fait que `SyncEngine.start()`.

Côté SQL : `supabase/migration-tombstones.sql` ajoute `deleted_at / version / device_id`. Le
moteur n'émet **plus jamais** de `DELETE` physique.

Dans `index.html` : `DataLayer.write` délègue à `Storage.persist` (fire-and-forget) puis
programme un sync ; `load()` est async (init + migration + loadDB) ; `save()` est inchangé côté
appelants. **~28 000 caractères de moteur legacy supprimés** (cloudPull/Push, baseIds,
mergeFromDisk, storage events, WLOG, TRACE).

## Verification

- **`sync-v2.js` : 38 ✓** — local, login sans écrasement, 2 appareils, soft-delete sans
  résurrection, offline→online, conflits (updatedAt & delete-vs-edit), anti-perte, purge des
  tombstones (après confirmation serveur), résilience (erreur serveur → op conservée + retry).
- **`app-regression.js` : 17 ✓** — timezone, intégrité référentielle, seed, restore,
  multi-onglets (re-branchés sur le nouveau moteur).
- **`acceptance.js` : 3 runs consécutifs 25 ✓** — create/refresh/delete/refresh ×3 en
  local / cloud / hostile (2ᵉ instance) / quota saturé.
- **UI pixel-identique 14/14** — l'application visible n'a pas changé.
- Migration localStorage→IndexedDB validée ; `node --check` sur les 5 modules + inline.

**QA manuelle** : (1) exécuter les 2 fichiers SQL ; (2) ouvrir l'app → les données migrent ;
(3) créer/supprimer, rafraîchir ×3 ; (4) deuxième appareil : cohérence ; (5) couper le réseau,
travailler, revenir : rien ne se perd.

## Alternatives

**Realtime Supabase (WebSocket)** : propagation instantanée, mais ne remplace pas le moteur de
merge/tombstones et consomme des connexions — ajoutable *par-dessus* plus tard.
**CRDT (Yjs/Automerge)** : convergence formelle, mais surdimensionné (une seule utilisatrice,
2–3 appareils) et contraire au zéro-dépendance.

## Quiz

<details><summary>1. Pourquoi une suppression est-elle un <code>deletedAt</code> et non une absence ?</summary>
Une absence est ambiguë (« supprimé ? jamais synchronisé ? »). Un tombstone daté permet à la
fusion de trancher (delete vs edit par le temps) et empêche toute résurrection au pull.
</details>
<details><summary>2. Que fait le merge d'une ligne locale absente du cloud ?</summary>
Il la GARDE et la ré-enfile (auto-guérison) — jamais de suppression par absence. C'est
l'inverse de l'ancien `baseIds − local` qui effaçait les créations d'autres appareils.
</details>
<details><summary>3. Quand un tombstone est-il purgé physiquement en local ?</summary>
Seulement si le serveur le confirme (même suppression visible au pull) ET qu'il dépasse le TTL
(30 j). Le serveur, lui, garde l'historique pour les appareils encore désynchronisés.
</details>
<details><summary>4. En quoi le login ne peut-il plus perdre de données ?</summary>
`auth-sync.js` ne fait que démarrer le moteur ; le premier `sync()` fusionne (pull→merge) sans
jamais écraser le local, puis pousse la file. Aucune étape « remplacer le local par le cloud ».
</details>
<details><summary>5. Pourquoi l'UI ne voit-elle jamais un tombstone ?</summary>
`Storage.loadDB()` filtre `deletedAt` : la mémoire `DB` ne contient que des lignes vivantes.
Les tombstones vivent en IndexedDB et sur le cloud, invisibles pour le rendu et les calculs.
</details>
