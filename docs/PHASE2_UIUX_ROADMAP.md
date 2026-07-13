# PHASE 2 — THE'Y STUDIO DESIGN · UI/UX & DESIGN SYSTEM — Roadmap complète

> Préparée après le gel du backend (`v1.0-backend-stable`). Aucun développement backend
> sauf bug critique de production. Chaque sprint suit le protocole : Analyse → Risques →
> Architecture → Plan → Stratégie de test → Risques de régression → **approbation → implémentation**.
>
> Fondations déjà livrées (PR #14) : tokens `:root`, catalogue `design-system.html`,
> audit 65 captures, `UI_INVENTORY.md` (10 incohérences I-1…I-10), roadmap Dashboard D1–D4,
> outil de non-régression visuelle `tests/screenshots.js`.

## Vision

Faire de THE'Y Gestion une expérience « premium SaaS » — et du site theystudiodesign.com la
vitrine d'un studio de design — **sans jamais toucher** au moteur (DataLayer, sync, offline, PWA).
Identité : Swiss monochrome, dense mais respirant, darija assumée, zéro dépendance.

## Vue d'ensemble des sprints

| # | Sprint | Portée | Risque | Dépend de |
|---|---|---|---|---|
| S19 | **Décisions design** + migration tokens | `--danger` (oui/non), set d'icônes SVG, fix I-1 `--muted`, migration des valeurs hors échelle (I-6) | Faible (diff visuel contrôlé) | DS approuvé |
| S20 | **Dashboard D1** — hiérarchie KPI | KPIs héros vs secondaires, tendances, fin du font-size inline (I-8) | Moyen | S19 |
| S21 | **Dashboard D2** — chart v2 | Axe Y, tooltips HTML, moyenne mobile, clic → paiements filtrés | Moyen | S20 |
| S22 | **Dashboard D3** — liste de travail unique | Fusion tâches+retards+échéances (data provider existant) | Moyen | S20 |
| S23 | **Formulaires & modals** | Groupement du modal client (I-9), états disabled/loading (I-7), sémantique destructive (I-4) | Moyen | S19 |
| S24 | **Responsive audit** (Roadmap #9) | Tables → cartes empilées mobile (I-5), day-panel/bottom-sheets, cibles tactiles 44px | Élevé (toutes pages) | S19–S23 |
| S25 | **Landing premium** | Refonte `/index.html` : hero, services, portfolio, contact, SEO/OG, perf 100 | Faible (surface isolée) | S19 (tokens partagés) |
| S26 | **Polish final D4** | Micro-interactions, tabular-nums, skeletons cloud, accessibilité AA (I-10), audit contrastes | Moyen | tout |

Jalons : **M1** après S22 (dashboard premium) · **M2** après S24 (app premium partout) ·
**M3** après S25 (vitrine publique) · **M4** après S26 (expérience complète → tag `v2.0-premium-ui`).

## Détail par sprint

### S19 — Décisions design & migration des tokens
**Analyse** : 2 décisions bloquantes (posées dans DESIGN_SYSTEM §1 et §8) : (a) introduire `--danger`
ou rester 100 % monochrome ; (b) direction iconographie (SVG custom 1.5px vs glyphes texte unifiés).
Puis migration mécanique : `--muted`→`--mut` (I-1), valeurs hors échelle → tokens (I-6), aliases
dépréciés retirés du CSS (JS inline styles inclus).
**Risques** : changement visuel *voulu* mais contrôlé — chaque écart validé par capture avant/après.
**Tests** : `screenshots.js diff` + revue humaine des écarts attendus ; suite 98 ✓.
**Régression** : dark mode (les marqueurs « retard » deviennent enfin visibles — changement assumé).

### S20–S22 — Dashboard (détail dans DASHBOARD_REDESIGN_ROADMAP.md)
D1 hiérarchie · D2 chart v2 · D3 liste de travail. Contraintes : `renderDash()` seul point
d'entrée, helpers de données inchangés, zéro dépendance.

### S23 — Formulaires & modals
**Analyse** : modal client = 13 champs à plat (I-9) → groupes Identité / Contact / Facturation /
Notes ; états `disabled`/`loading` définis (I-7) ; boutons destructifs distincts (I-4) ;
focus management (retour au déclencheur à la fermeture).
**Architecture** : CSS + structure des modals uniquement ; les fonctions `save*/open*` inchangées.
**Tests** : parcours CRUD complets via la suite existante + captures des 5 modals × 2 thèmes.

### S24 — Responsive audit (Roadmap #9)
**Analyse** : mobile actuel = tables en scroll horizontal (I-5), 2 breakpoints seulement.
Pattern cible : cartes empilées < 640px (données identiques), filtres en chips scrollables,
cibles tactiles ≥ 44px, safe-areas iOS.
**Risques** : le plus large de la phase — touche toutes les pages. Mitigation : une page par PR,
captures 3 viewports systématiques.
**Tests** : set `audit` complet avant/après chaque page + tests d'intégration (le DOM des tables
change → adapter les sélecteurs des tests si besoin, comportement identique).

### S25 — Landing premium (theystudiodesign.com)
**Analyse** : la racine est un placeholder « Coming soon ». Cible : one-page vitrine — hero
(identité THE'Y), services (branding, identité visuelle, réseaux sociaux, print), portfolio
(grille, images optimisées), à-propos, contact (WhatsApp + email), footer légal.
**Architecture** : `/index.html` autonome (mêmes tokens, zéro dépendance, pas de SW nécessaire),
SEO complet (meta, OG, JSON-LD LocalBusiness), Lighthouse ≥ 95 partout.
**Tests** : Lighthouse CI manuel, captures 3 viewports, validation W3C.
**Régression** : aucune sur l'app (`/gestion/` intact) ; vérifier que le SW racine auto-destructeur
n'interfère pas.

### S26 — Polish final & accessibilité
Micro-transitions (stagger, `--t-*`), `font-variant-numeric:tabular-nums` sur tous les montants,
skeletons pour les états cloud, `aria-label` sur tous les icon-btns, contrastes AA vérifiés
(gris `--mut2` sur `--bg` à auditer), focus visible uniforme, `prefers-reduced-motion`.

## Règles de la phase (invariantes)

1. **Backend gelé** — aucun changement de logique de données/sync ; seuls `renderX()`, HTML des
   sections et CSS évoluent.
2. Chaque PR : captures avant/après (`screenshots.js`) + suite d'intégration verte + bump SW.
3. Tout nouveau style consomme les tokens (gouvernance DESIGN_SYSTEM §11).
4. Dark mode et mobile livrés en même temps que light desktop — jamais « plus tard ».
5. Offline/PWA/print facture intouchables.
6. La dette TRACE (v25–v29) sera nettoyée dans la fenêtre technique post-design (déjà auditée).
