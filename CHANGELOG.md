# CHANGELOG — THE'Y STUDIO DESIGN · Gestion

## 2026-07-13 (22) — WLOG: instrumentation runtime (diagnostic production, zéro logique)
- **Journal PERSISTANT des écritures** (`they_wlog`, ring-buffer 80 entrées, lisible depuis n'importe quel onglet même après refresh: console → `__WLOG()`): pour chaque écriture — horodatage, onglet, build, visibilité, **pile d'appel (QUI écrit)**, clients AVANT (disque) / APRÈS; + PULL-REMOTE (cloud avant merge), PULL-DONE, PUSH-OK (payload), PUSH-ERR, BOOT.
- **Détecteur d'écrivain fantôme**: chaque écriture instrumentée bumpe une empreinte (`they_wnonce`); une écriture de la base SANS bump = **instance NON instrumentée (ancien build encore ouvert — fenêtre PWA)** → entrée `ÉCRIT-PAR-AUTRE-INSTANCE` + warn console. Zéro changement de logique. SW v34.

## 2026-07-14 (24) — FIX PRODUCTION: persistance stable (critères d'acceptation 3×3 ✓)
- **Root cause (prouvée par traces)** : `DB` est une copie mémoire PAR INSTANCE; toute instance encore ouverte (2e onglet, fenêtre PWA, fenêtre restaurée par le navigateur) écrase storage + cloud avec sa photo périmée au premier `save()` → suppressions ressuscitées, créations effacées (localement ET dans Supabase via upsert + diff `baseIds − mémoire`).
- **Fix (persistance uniquement, zéro redesign)** :
  1. **Relire-avant-d'écrire** — `mergeFromDisk()` (LWW par ligne + tombstones locaux `DISK_KNOWN`) dans `save()` et `cloudPull()`;
  2. **Sync storage active** — l'écriture d'une autre instance équipée est adoptée immédiatement;
  3. **Défense anti-ZOMBIE** — jeton de génération `they_gen` bumpé à chaque écriture équipée; une écriture SANS bump = instance d'un ancien build → mode réparation (mémoire autoritaire, réécriture immédiate + re-push: la corruption disque ET cloud est annulée);
  4. **`online`: pull → push** (nécessité démontrée par test) + garde de réentrance `cloudPull`;
  5. **SW v36 purge les zombies** — à l'activation d'une nouvelle version, TOUTES les fenêtres ouvertes rechargent sur le nouveau build.
- **Préservé** : LWW, baseIds, tombstones, cloud sync, offline-first — suite existante inchangée.
- **Tests** : suite 112 ✓ + `tests/acceptance.js` (critères production EXACTS: create→refresh→existe, delete→refresh→supprimé, ×3 consécutifs) dans 3 environnements — local, cloud, et HOSTILE (fenêtre zombie du build de production actuel exécutant un save() périmé après chaque étape): **18 ✓ / 0 ✗**. SW v36.

## 2026-07-13 (20) — Sprint 19: Accents sémantiques + THE'Y Icons (Phase 2)
- **Accents sémantiques** (décision actée) : 4 tokens `--danger/--success/--warning/--info` (+ variantes dark) sur base monochrome. Appliqués aux ÉTATS uniquement : retards en rouge (badge « En retard », chips calendrier, pastille notifications, « fat le délai »), attente en orange (dots), « Livré » en vert (dot), sync cloud (OK/attente/erreur), priorités (dots rouge/orange/vert), hints (filet info). Aliases hérités (`--rouge`…) re-pointés vers les accents. Fix I-1: `--muted` inexistant → `--mut` (20 sites).
- **THE'Y Icons** : famille SVG unique (25 symboles, stroke 1.7, currentColor, sprite inline) remplaçant ~100 emojis/glyphes/symboles unicode — navigation, actions de ligne, topbar, boutons, états vides, fermetures, chevrons, thème, diagnostic cloud. **Zéro emoji dans l'UI.** Les valeurs STOCKÉES héritées (priorité « 🔴 Urgent », statut « Salit ✅ ») restent intactes (rétro-compat + sync) — affichage mappé via `prioHTML/prioLabel/statutLabel`; les `<option>` gardent les anciennes valeurs en `value`.
- **Catalogue** `docs/design-system.html` v1.1 (accents + grille des 25 icônes), DESIGN_SYSTEM.md et UI_INVENTORY.md mis à jour (I-1/I-2/I-3 résolus; I-11 documenté: grille calendrier inégale, pré-existant). Captures d'audit régénérées.
- Comportement inchangé : 98 tests verts. SW v33.

## 2026-07-13 (19) — Sprint 18: Design System Foundation (Phase 2 UI/UX)
- **THE'Y DESIGN SYSTEM v1** : tokens officiels définis dans `:root` (`gestion/index.html`) — couleurs sémantiques, échelle typographique (--fs-*), espacement base 4px (--sp-*), rayons (--r-*), ombres/élévation (--sh-1..5), motion (--t-*), z-index (--z-*). **Purement additif : zéro changement visuel**, prouvé par diff pixel (14/14 captures identiques avant/après). Aliases hérités (--nuit/--bleu/--rouge…) figés et marqués dépréciés.
- **Catalogue vivant** : `docs/design-system.html` — tous les composants (boutons, badges, chips, formulaires, cards/KPI, table, toast, empty, calendrier, notifications, recherche, iconographie) avec toggle light/dark.
- **Audit UI complet** : `docs/design-audit/` — 65 captures (7 écrans × desktop/tablet/mobile × light/dark + 11 overlays × 2 thèmes + lock screen). Outil réutilisable `tests/screenshots.js` (mode `diff` déterministe pour la non-régression visuelle, mode `audit` complet) — horloge figée, fuseau Casablanca, animations neutralisées.
- **Docs** : `docs/DESIGN_SYSTEM.md` (règles, états, gouvernance), `docs/UI_INVENTORY.md` (inventaire écrans/composants + 10 incohérences documentées pour la phase redesign, dont --muted inexistant et « rouge »=noir), `docs/DASHBOARD_REDESIGN_ROADMAP.md` (D1→D4).
- Aucun changement de comportement; backend gelé respecté. SW v32.

## 2026-07-13 (18) — Fix critique: intégrité référentielle (orphelins / cascade delete)
- **Bug corrigé** : après suppression de clients, des lignes dépendantes survivaient et gonflaient les KPIs (cas réel: clients=0 mais 1 projet + 3 tâches + 4 paiements = « 3 100 DH » fantômes). Deux causes: (1) `delClient` ne supprimait pas les **events** du client; (2) surtout, les lignes dont le `clientId` référence un client **déjà disparu** (orphelins hérités des fusions v21/v22, imports, snapshots) n'étaient visées par AUCUN chemin de suppression — et aucun code (load, normalize, pull, dashboard) ne vérifiait l'intégrité référentielle. Ces orphelins font aussi échouer le push Supabase (violation FK) → sync bloquée en « en attente ».
- **Fix — garantie unique `sweepOrphans()`** : retire toute ligne au `clientId` non vide et inconnu (les lignes SANS client, ex. events personnels, restent valides) + nettoie les `projetId` pendants. Appelée par: `save()` (aucun orphelin ne peut plus être persisté ni poussé — couvre delete/import/restore/toute mutation), `load()` (migration au boot, avec **filet de sécurité** `they_rescue_orphans` conservant les lignes purgées), `cloudPull()` (un orphelin présent au cloud n'est jamais adopté; le push suivant purge le cloud via baseIds − local → auto-guérison). En plus: cascade `delClient` complétée (events) + `delProjet` nettoie le `projetId` des tâches.
- **Cloud sync préservé** : suppressions propagées par le mécanisme existant (tombstones baseIds); LWW inchangé; 3 tests multi-appareils dédiés.
- **Tests** : scénario [20] — 13 assertions (cascade complète, events personnels préservés, état réel du bug reproduit puis purgé au boot avec KPI à 0, rescue, import, restore, propagation cloud, non-adoption d'orphelins du cloud). Bug reproduit AVANT le fix: 10 échecs. 98 au total. SW v31.

## 2026-07-13 (17) — Sprint 17: Fix timezone (calendrier / dashboard)
- **Bug corrigé** : les dates calendaires étaient construites en heure locale (`new Date(y,m,d)` = minuit local) puis sérialisées en UTC (`toISOString()`). Dans les fuseaux positifs (Maroc UTC+1 : minuit local = veille 23h UTC), toutes les clés date reculaient d'un jour → grille du mois décalée (pastille "aujourd'hui" et événements sur la mauvaise case), chart revenus agrégé sous le mauvais mois, et près de minuit : KPI "Aujourd'hui" à 0, retards non détectés, snapshots datés de la veille.
- **Fix** : helper unique `isoLocal(d)` (YYYY-MM-DD en heure LOCALE) remplaçant chaque `toISOString().slice(0,10|7|4)` à intention calendaire : `CAL_TODAY`, `monthCells`, `weekCells`, `isOverdue`, KPIs dashboard (jour/mois), `monthlyRevenue`, tâches (today), date par défaut paiement, notifications (soon/past), `reportRange`, année facture/BL, nom du fichier export. Les timestamps `updatedAt` du sync restent en UTC (requis pour le LWW inter-appareils) — non touchés.
- **Rétro-compatible** : format stocké `YYYY-MM-DD` inchangé; en UTC le comportement est strictement identique (garde de régression).
- **Tests** : scénario [19] — 15 assertions Playwright avec `timezoneId` Africa/Casablanca (midi + 00h30 locale) et UTC, horloge figée : grille mois/semaine, pastille today, événement sur la bonne case, chart revenus, isOverdue, KPI "Aujourd'hui" (85 au total). Bug reproduit AVANT le fix : 8 échecs Casablanca / 0 UTC. SW v30.

## 2026-07-13 (16) — Fix Restore: démo DUPLIQUÉE
- **Source exacte des "4 clients" identifiée** : snapshot hérité (`they_snap_1/2`) contenant la démo **dupliquée** (2 seeds fusionnés par le sync de l'ère v21/v22 = 4 clients). L'empreinte de purge exigeait exactement 2 clients → les doublons passaient au travers et Restore les rendait.
- **Empreinte généralisée** : détecte la démo à toute multiplicité (uniquement des noms de démo + volumes bornés par le facteur de duplication). La purge au boot (migration automatique) et le refus dans restoreSnapshot utilisent la nouvelle détection.
- TRACE-BOOT affiche désormais les noms des clients contenus dans chaque snapshot. 2 tests ajoutés (70 au total). SW v26.

## 2026-07-13 (15) — Fix critique Restore
- **Restore ne rend plus jamais la démo**. Cause racine: au premier lancement, le snapshot quotidien était pris au boot juste après le seed → il capturait la démo, et comme un seul snapshot est pris par jour, les données réelles du même jour n'étaient jamais capturées → Restore rendait "Mouhamed K."/"Client Exemple". Corrections en 4 couches:
  1. Drapeau `they_demo_v1` "démo intacte" (posé après le seed, retiré à la première vraie sauvegarde) → la démo intacte n'est **jamais snapshotée**.
  2. **Purge au boot** des snapshots pollués par l'ancien bug (empreinte de la base de démo).
  3. **Ceinture dans restoreSnapshot** : un snapshot de démo est refusé et supprimé.
  4. **Cloud** : au login sur un compte existant, une démo locale intacte est **jetée** (jamais fusionnée ni poussée vers le cloud).
- **Bonus** : une base vide n'est plus snapshotée (un reset ne détruit plus les backups réels par rotation).
- 13 tests d'intégration ajoutés (68 au total) : snapshot réel → restore réel uniquement, backup vide → base vide, restore après reset sans seed, backup corrompu → données intactes, login cloud → zéro démo poussée. SW v24.

## 2026-07-13 (14) — Fix critique seed
- **Anti-réinjection des données de démonstration** : marqueur persistant `they_seeded_v1` — le seed ("Mouhamed K.", "Client Exemple") ne s'exécute qu'une seule fois par navigateur. Après un reset volontaire (suppression de toutes les données), l'app repart VIDE, la démo n'est jamais recréée. Bonus: des données corrompues ne sont plus écrasées par la démo. 6 tests d'intégration ajoutés (55 au total). SW v23.

## 2026-07-13 (13) — Sprint 12
- **Cloud Sync v2 (Supabase)** : moteur de synchronisation complet, testé de bout en bout.
  - **Conflits (LWW par ligne)** : chaque ligne est horodatée (updatedAt) à la modification; au pull, fusion ligne par ligne — la version la plus récente gagne, sur tous les appareils. Trigger SQL adapté pour respecter l'horodatage client. Limite documentée: suppression locale > édition distante.
  - **Suppressions sûres** : diff contre les ids connus du cloud au dernier sync (baseIds) — corrige le bug Sprint 11 où un push effaçait les lignes créées par un autre appareil.
  - **Offline-first renforcé** : flag "dirty" persistant — un push raté est rejoué automatiquement au retour du réseau (event online), au retour sur l'onglet (visibilitychange) et au boot. LocalStorage reste le cache; l'app démarre toujours en local d'abord.
  - **Auth v2** : inscription + connexion + reprise de session, messages d'erreur traduits, bouton "Continuer sans cloud" (l'app n'est jamais bloquée), déconnexion propre.
  - **Diagnostic automatique** : indicateur ☁ dans la topbar (sync ✓ / en attente / erreur) → panneau qui détecte et explique exactement quoi corriger: config vide, URL invalide, mauvaise clé (ou service_role), projet en pause/injoignable, schema.sql non exécuté.
  - **Schéma corrigé** : colonnes taches.projet_id + taches.details ajoutées (étaient perdues au round-trip cloud), compteurs facture/BL fusionnés par max().
  - **Suite d'intégration (tests/)** : 49 assertions — vrai client supabase-js contre un mock Supabase local (auth GoTrue + REST PostgREST + isolation RLS), piloté par Playwright: inscription, login, sync auto 2 appareils, offline→resync, conflits LWW, suppressions croisées, round-trip des champs, isolation par compte, régression mode local. `cd tests && npm install && npm run build:vendor && npm test`. SW v22.

## 2026-07-13 (12) — Sprint 11
- **Préparation Supabase** : schéma PostgreSQL complet (supabase/schema.sql — 6 tables, relations, index, RLS par utilisateur, bucket storage privé, triggers updated_at, validé par parseur PostgreSQL). Pilote cloud dans l'app : mapping camelCase↔snake_case testé, pull au boot + push débouncé à chaque save, LocalStorage conservé comme cache offline, écran d'authentification (email+mot de passe) affiché uniquement si configuré. supabase-config.js vide = application 100 % locale, zéro changement. Guide: SUPABASE_SETUP.md.

## 2026-07-13 (11) — Devise DH/MAD
- **Devise centralisée** : config unique CURRENCY={code:'MAD',symbol:'DH'} + normDevise. Tout € affiché devient DH (Dashboard, charts, tables, fiches, rapports, notifications, factures) — valeurs et données stockées inchangées (mapping à l'affichage via payDevise/money, réversible). Format: 0 DH / 1 500 DH / 12 500 DH. Nouveaux clients/paiements en DH par défaut, option € retirée des sélecteurs ($ conservé). Changer de devise à l'avenir = modifier une seule constante.

## 2026-07-13 (10) — Sprint 10
- **Data Layer** : façade DataLayer (read / write / normalize) — unique point de contact avec LocalStorage. load()/save() sont désormais des orchestrateurs. Migration Supabase = réécrire ces 3 méthodes uniquement (contrat documenté dans ARCHITECTURE.md). Suite d'intégration: données réelles préservées, seed premier lancement seulement, JSON corrompu sans crash, roundtrip, échec quota.

## 2026-07-13 (9) — HOTFIX CRITIQUE
- **Bug critique corrigé** : depuis Sprint 04, un else mal rattaché dans load() faisait exécuter seed() (données de démonstration) au 2e chargement, ÉCRASANT les données réelles. Corrigé + tests d'intégration ajoutés (données existantes préservées, seed uniquement au premier lancement). Si des données ont été perdues : restaurer via Import JSON du dernier export, ou via Restore (snapshots).

## 2026-07-13 (8) — Sprint 09
- **Auto Backup & Restore** : snapshot local quotidien avec rotation (2 max, best-effort protégé quota), backup fichier hebdomadaire automatique au chargement (toast), bouton Restore sidebar → liste des snapshots avec contenu résumé + restauration avec confirmation. Bannière backup conservée en fallback.

## 2026-07-13 (7) — Sprint 08
- **Performance** : rendering ciblé — seul l'onglet visible est re-rendu (map RENDERERS + currentTab), au lieu des 6 pages à chaque modification. Le changement d'onglet rend la page fraîche via go(). LocalStorage inchangé (déjà 1 lecture au boot / 1 écriture par save).

## 2026-07-13 (6) — Sprint 07
- **CRM avancé** : champs Société / Website / Adresse sur la fiche client (rétro-compatibles, inclus dans la recherche). Bouton 👁 → fiche client complète en panneau latéral : profil, totaux encaissé/en attente par devise, historique cliquable (projets, 8 derniers paiements, tâches ouvertes, événements), accès direct à la modification.

## 2026-07-13 (5) — Sprint 06
- **Rapports** : bouton sidebar → modal période (mois / mois précédent / année / tout) + type. Exports CSV (paiements avec n° facture/BL, clients avec total payé, projets avec payé vs prix) — utilitaires réutilisables toCSV (RFC4180 + BOM Excel) et downloadFile. Rapport revenus PDF (par client + totaux par devise) via l'overlay d'impression existant.

## 2026-07-13 (4) — Sprint 05
- **Notification Center** : cloche topbar avec badge, panneau des alertes (retards en ●, échéances ≤3 jours en ○, rappel backup), clic ouvre l'élément concerné, toast au chargement si nouvelles alertes. Dérivé du data provider calendrier (zéro duplication).

## 2026-07-13 (3) — Sprint 04
- **Smart Calendar** : vues Mois/Semaine (grille CSS native, semaine commençant lundi), navigation ‹ › / Aujourd'hui / saut mois+année, panneau latéral du jour (bottom sheet sur mobile, dots au lieu de chips sur petits écrans), événements en retard en rouge.
- **Nouvelle entité `DB.events`** (réunions, livraisons, rappels, personnel) : CRUD complet, init auto rétro-compatible, incluse dans Import/Export et dans la recherche globale.
- **Data Provider `getCalendarEvents(from,to)`** : seule couche lisant DB (projets+tâches+paiements+events), cache avec clé de plage — prêt pour Supabase.
- **`invalidateCaches()`** : invalidation générique (Search + Calendar), remplace searchInvalidate (alias rétro-compat conservé).
- Filtres : catégories (chips), statut, client.

## 2026-07-13 (2)
- **Global Search (Ctrl+K / Cmd+K)** : recherche instantanée sur clients, projets, tâches, paiements (y compris notes, ICE, n° facture/BL, montants). Index en mémoire invalidé via hook `save()` (zéro lecture LocalStorage supplémentaire). Navigation clavier (↑↓/Entrée/Échap), surlignage des correspondances, recherches récentes (8 max), catégories, états vide/sans-résultat, bouton 🔍 topbar (mobile), accent-folding ("cafe" trouve "café"). Zéro dépendance.
- Fix pré-release : câblage paresseux des listeners (l'overlay est après le script dans le DOM).

## 2026-07-13
- **Dashboard 2.0** : 4 nouveaux KPIs (Aujourd'hui, Cette année, En retard, Valeur moy./projet) + compteur projets terminés.
- **Revenue Chart** : graphique 12 mois en SVG natif (zéro dépendance), multi-devises (2 max, légende auto), compatible dark mode, tooltips natifs.

## 2026-07-12
- **Facture officielle Auto-Entrepreneur** : taxe AE 1%, Total TTC, montant en lettres (FR), RIB/IF/ICE/Taxe pro, 3 slots images (logo AE, logo THE'Y, cachet), numéro éditable (clic).
- **Bon de livraison** : numérotation BL séparée, colonne Qté/Observation, cadre signature client.
- **Champ ICE** ajouté à la fiche client.
- **Corrections** : impression page vide hors facture, slots vides masqués en print, format A4, "et XX centimes", touche Échap, protection données corrompues / dates invalides / quota localStorage.
- **Service Worker v8+** : network-first pour le HTML — les mises à jour arrivent sans vider le cache.
- **PIN fixe** (hash SHA-256) remplaçant le premier-code-devient-PIN.
- **Rappel backup** : bannière si aucun export depuis 7 jours.
