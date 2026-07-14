# Tests — SyncEngine v2 (IndexedDB + queue + tombstones)

Suite de bout en bout : l'app réelle tourne dans Chromium (Playwright) avec le **vrai
client supabase-js**, connecté à un **mock Supabase local** (`mock-supabase.js`) — zéro dépendance réseau.

## Lancer

```bash
cd tests
npm install
npm run build:vendor      # bundle ESM local de supabase-js (remplace le CDN pendant les tests)
npm test                  # sync-v2 + app-regression
npm run test:sync         # SyncEngine v2 (cloud) — 38 assertions
npm run test:regression   # régressions applicatives non-cloud — 17 assertions
npm run test:acceptance   # critères production create/refresh/delete/refresh ×3 (4 environnements)
```

`CHROME_PATH=/chemin/vers/chrome` si Chromium Playwright n'est pas au chemin par défaut.

## Captures d'écran (non-régression visuelle)
```bash
node screenshots.js diff  /tmp/avant     # 14 PNG déterministes (hash-comparables)
node screenshots.js audit ../docs/design-audit   # set complet
```

## Scénarios — `sync-v2.js` (38 assertions)
1. Config vide = 100 % local (IndexedDB), zéro réseau
2. Inscription → le local est POUSSÉ (jamais écrasé), colonnes version/deviceId
3. Login sur compte existant → merge (pas d'écrasement)
4. 2 appareils — création propagée (write→queue→sync→pull)
5. **Soft delete** → tombstone → l'autre appareil ne ressuscite jamais
6. Offline-first — création hors ligne, queue persistée, resync online sans perte
7. Conflit `updatedAt` — la modification la plus récente gagne (LWW)
8. Conflit delete vs edit — `deletedAt` (plus récent) gagne
9. Anti-résurrection — adoption d'une ligne d'un autre appareil ; création locale jamais perdue
10. Reprise de session au reload
11. « Continuer sans cloud » — jamais bloqué
12. **Purge permanente des tombstones** — uniquement après confirmation serveur + TTL
13. **Résilience** — erreur serveur : op conservée + retry backoff ; réparation → file vidée

## Scénarios — `app-regression.js` (17 assertions, non-cloud)
- R1 Timezone (`isoLocal`, Casablanca + garde UTC)
- R2 Intégrité référentielle (`sweepOrphans` : cascade + purge au boot)
- R3 Seed anti-réinjection (reset = base vide)
- R4 Snapshots & Restore (données réelles, persistées en IDB)
- R5 Multi-onglets (BroadcastChannel : convergence, zéro écrasement)

## Migration Supabase
Avant la première utilisation cloud du moteur v2 : exécuter `supabase/schema.sql` puis
`supabase/migration-tombstones.sql` (colonnes `deleted_at` / `version` / `device_id`).
Le diagnostic ☁ détecte et explique si la migration manque.
