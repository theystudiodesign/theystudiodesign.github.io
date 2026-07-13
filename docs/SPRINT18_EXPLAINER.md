# Sprint 18 — Design System Foundation · Explainer

## Background

L'app est une SPA monofichier au style « Swiss monochrome » construit sprint après sprint : les
variables CSS de `:root` (`--ink`, `--mut`, `--line`…) servaient déjà de mini-système, complétées
par des aliases historiques (`--nuit`, `--bleu`, `--rouge`… tous pointant vers le même noir) et
beaucoup de valeurs en dur (tailles 10.5/11.5/12.5px, radius 5–14px, ombres ad hoc). Le projet
entre en Phase 2 (UI/UX) avec un backend gelé : avant tout redesign, il faut une **fondation**
commune — sinon chaque écran redessiné divergera.

## Intuition

> 💡 Un design system n'est pas un document : c'est un **contrat exécutable**. Sprint 18 livre les
> trois formes de ce contrat : (1) les tokens dans le code (`:root`), (2) le catalogue vivant qui
> les rend visibles (`design-system.html`), (3) l'outil qui prouve qu'on ne casse rien
> (`screenshots.js` + diff pixel).

La contrainte clé : **zéro changement visuel**. Les tokens sont donc *additifs* — ils encodent les
valeurs actuelles observées dans l'audit, sans réécrire les règles existantes. La migration
rule-par-rule se fera écran par écran en phase redesign, chaque fois avec preuve pixel.

Exemple : l'audit a montré 5 ombres distinctes dans le fichier. Elles deviennent l'échelle
d'élévation `--sh-1..5` (cards → bouton → toast → modal → palette). Aucun composant ne change ;
mais le prochain composant, lui, n'aura plus le droit d'inventer une 6ᵉ ombre.

## Code

1. **`gestion/index.html`** — le bloc `:root` passe de 9 variables + 7 aliases à un système
   documenté : couleurs sémantiques, `--fs-*` (9 tailles), `--sp-*` (échelle 4px), `--r-*`,
   `--sh-1..5`, `--t-*`, `--z-*`, et les aliases hérités **figés à leurs valeurs littérales**
   avec mention DÉPRÉCIÉ. Pourquoi figés et non re-pointés vers `var(--ink)` ? Parce que
   `body.dark` redéfinit `--ink` : re-pointer aurait changé le rendu dark des marqueurs
   « retard » — interdit ce sprint (c'est la décision `--danger` de la phase redesign).
2. **`tests/screenshots.js`** (nouveau) — deux modes : `diff` (14 PNG déterministes :
   6 onglets + vue semaine × light/dark, hash-comparables) et `audit` (65 JPEG : 3 viewports ×
   2 thèmes + 11 overlays + lock screen). Déterminisme : `page.clock.setFixedTime`, timezone
   Casablanca, fonts bloquées, `transition/animation:none`, toast/notifs neutralisés, fixtures.
3. **`docs/`** — `DESIGN_SYSTEM.md` (règles + gouvernance), `design-system.html` (catalogue,
   snapshot CSS fidèle de l'app), `UI_INVENTORY.md` (7 écrans, 12 overlays, ~40 composants,
   **10 incohérences documentées** dont `--muted` inexistant référencé ~25 fois et
   « rouge = noir »), `DASHBOARD_REDESIGN_ROADMAP.md` (D1 hiérarchie KPI → D2 chart v2 →
   D3 liste de travail → D4 polish), `design-audit/` (65 captures).
4. **SW v31** + `window.__BUILD='v31'` (procédure de release, le HTML a changé).

## Verification

- **Preuve pixel** : `diff` avant (2 runs → 14/14 hashes identiques = méthode déterministe),
  puis tokens ajoutés, puis `diff` après → **14/14 captures strictement identiques**.
- **Suite d'intégration complète : 85 ✓ / 0 ✗** (aucun comportement touché).
- `node --check` sur le JS inline, `sw.js`, `run.js`, `screenshots.js`.
- Catalogue vérifié visuellement en light **et** dark (captures jointes à la PR).

**QA manuelle** : ouvrir `docs/design-system.html` → parcourir les 14 sections, basculer
Light/Dark ; ouvrir l'app → strictement identique à avant.

## Alternatives

**Extraire le CSS dans un fichier partagé** (app + catalogue) : pro — une seule source ; contre —
casse le principe monofichier/offline de l'app (2ᵉ requête, cache SW à gérer), risque runtime
pour un bénéfice documentaire. Rejeté pour ce sprint ; réévaluable si le fichier dépasse ~2 500 lignes.

**Tokens JSON + build step (style-dictionary)** : pro — multi-plateforme ; contre — introduit
une chaîne de build dans un projet zéro-dépendance servi statiquement. Rejeté.

## Suggested people to talk to

Historique mono-auteur (THE'Y STUDIO — Sprints 01–12, tout le CSS d'origine ; ELFASSI Karima —
fixes récents). Le regard le plus utile ici est celui du **design** : valider la décision
`--danger` et la direction iconographie avant D4.

## Quiz

<details><summary>1. Pourquoi les aliases <code>--rouge/--nuit…</code> n'ont-ils PAS été re-pointés vers <code>var(--ink)</code> ?</summary>

Parce que `body.dark` redéfinit `--ink` : les aliases seraient devenus clairs en dark mode et
auraient changé le rendu des marqueurs « retard » (fond clair + texte blanc illisible). Les figer
en littéral garantit le pixel-identique ; leur remplacement sémantique est une décision de
redesign (`--danger`), pas de fondation.
</details>

<details><summary>2. Comment prouve-t-on « zéro changement visuel » de façon fiable ?</summary>

Captures PNG déterministes (horloge figée, fonts bloquées, animations off, fixtures stables),
validées par un double-run identique **avant** modification, puis comparaison sha256 avant/après :
14/14 identiques. Un simple « ça a l'air pareil » ne détecte pas un décalage d'1px.
</details>

<details><summary>3. Que doit faire un nouveau composant vis-à-vis des tokens ?</summary>

Consommer exclusivement `--fs-*/--sp-*/--r-*/--sh-*/--t-*` et les couleurs sémantiques — aucune
nouvelle valeur en dur, aucun alias déprécié. Et apparaître dans `design-system.html` dans le
même commit (gouvernance §11).
</details>

<details><summary>4. Pourquoi le mode <code>audit</code> produit du JPEG et le mode <code>diff</code> du PNG ?</summary>

`diff` doit être **byte-stable** pour la comparaison par hash → PNG sans perte. `audit` vise la
revue humaine de 65 vues → JPEG qualité 60 (3,1 Mo au lieu de dizaines de Mo dans le repo).
</details>

<details><summary>5. Quelle incohérence de l'inventaire explique des gris différents entre calendrier et tables ?</summary>

I-1 : ~25 règles référencent `var(--muted)` qui **n'existe pas** (le token s'appelle `--mut`).
La propriété est invalide → couleur héritée, ou fallback inline quand présent. Correction
planifiée en phase redesign (pas en passant), car définir `--muted` changerait le rendu actuel.
</details>
