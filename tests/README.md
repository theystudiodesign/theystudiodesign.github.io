# Tests d'intégration — Cloud Sync (Sprint 12)

Suite de bout en bout : l'app réelle tourne dans Chromium (Playwright) avec le **vrai
client supabase-js**, connecté à un **mock Supabase local** (`mock-supabase.js`) qui émule
Auth (GoTrue) + REST (PostgREST) + l'isolation RLS par utilisateur — zéro dépendance réseau.

## Lancer

```bash
cd tests
npm install
npm run build:vendor   # bundle ESM local de supabase-js (remplace le CDN pendant les tests)
npm test
```

Si Chromium Playwright n'est pas au chemin par défaut : `CHROME_PATH=/chemin/vers/chrome npm test`.

## Captures d'écran (Sprint 18)

```bash
node screenshots.js diff  /tmp/avant    # 14 PNG déterministes (hash-comparables) — non-régression visuelle
node screenshots.js audit ../docs/design-audit   # 65 JPEG — set complet (3 viewports × 2 thèmes + overlays)
```

Rendu déterministe : horloge figée (13/07/2026, Casablanca), polices bloquées, animations désactivées,
fixtures stables. Workflow de non-régression : `diff` avant → modification → `diff` après → comparer les sha256.

## Scénarios couverts (98 assertions)

1. Régression — config vide = 100 % local, indicateur ☁ caché, seed intact
2. Inscription + premier push local → cloud (user_id/RLS posé)
3. Login refusé → message d'erreur traduit, gate conservé
4. Deuxième appareil — persistance des données entre appareils, LocalStorage = cache
5. Sync automatique (debounce save → push → pull autre appareil)
6. Offline-first — dirty persistant, resync auto sur event `online`
7. Conflits — last-write-wins par ligne, convergence des deux appareils
8. Suppressions sûres — tombstones baseIds, jamais d'effacement des lignes des autres
9. Round-trip complet des champs (taches.projet_id / details)
10. Isolation par utilisateur (RLS)
11. Compteurs facture/BL fusionnés par max()
12. Reprise de session au reload
13. « Continuer sans cloud » — l'app n'est jamais bloquée
14. Diagnostic — schema.sql non exécuté détecté avec fix exact
15. Diagnostic — config vide / URL invalide expliquées
16. Seed anti-réinjection — la démo ne revient jamais après un reset
17. Restore — ne rend jamais la démo (snapshots réels uniquement, purge, backup vide/corrompu)
18. Restore cloud — démo locale intacte jamais fusionnée ni poussée
19. Timezone (Sprint 17) — dates locales via `isoLocal()` : grille mois/semaine, pastille today,
    événements sur la bonne case, chart revenus, isOverdue, KPI "Aujourd'hui" — testés avec
    `timezoneId` Africa/Casablanca (UTC+1, midi + 00h30 locale) et garde de régression UTC
20. Intégrité référentielle (fix critique) — cascade delete complète (events inclus), events
    personnels préservés, orphelins hérités purgés au boot (+ filet they_rescue_orphans),
    import/restore assainis, propagation cloud de la cascade, non-adoption des orphelins du cloud
