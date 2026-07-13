# THE'Y DESIGN SYSTEM — v1 (Sprint 18)

> **Source de vérité** des règles visuelles de THE'Y STUDIO DESIGN (app Gestion + futur site).
> L'âme et les intentions derrière ces règles : [DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md) (à lire en premier).
> Catalogue vivant : [`docs/design-system.html`](design-system.html) · Captures d'audit : [`docs/design-audit/`](design-audit/) · Inventaire : [`docs/UI_INVENTORY.md`](UI_INVENTORY.md)
>
> **Statut Sprint 18** : fondation. Les tokens sont définis dans `gestion/index.html` (`:root`) avec les valeurs *actuelles* — zéro changement visuel. La migration des styles existants vers les tokens se fait écran par écran en phase redesign.

## Principes

1. **Swiss / monochrome** — le noir (`--ink`) est la seule couleur. La hiérarchie se fait par le contraste, la graisse et l'espace, jamais par la couleur.
2. **Densité maîtrisée** — outil de travail quotidien : compact (base 13.5px) mais respirant (échelle 4px).
3. **Zéro dépendance** — pas de framework CSS ni de librairie d'icônes ; tout est natif.
4. **Dark mode de première classe** — chaque composant définit ses deux thèmes via les tokens, jamais par valeurs en dur.
5. **Offline & print d'abord** — rien ne doit casser hors ligne ; la facture est un document imprimable A4.

## 1 · Couleurs

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--ink` | `#111110` | `#F1F1EE` | Texte principal, accent, fonds pleins (boutons/badges) |
| `--ink2` | `#2A2A28` | `#D9D9D5` | Texte secondaire fort, hover primary |
| `--mut` | `#6F6F6C` | `#9A9A96` | Texte atténué (labels, sous-titres) |
| `--mut2` | `#9A9A96` | `#6F6F6C` | Texte très atténué (placeholders, vides) |
| `--line` | `#E8E8E5` | `#2A2A28` | Bordures des surfaces |
| `--line2` | `#D9D9D5` | `#3A3A38` | Bordures des contrôles |
| `--bg` | `#F7F7F4` | `#141413` | Fond de page |
| `--card` | `#FFFFFF` | `#1C1C1B` | Surfaces (cards, modals, panneaux) |
| `--side` | `#0F0F0E` | `#0F0F0E` | Sidebar (fixe, ne change pas en dark) |

**Dépréciés** (valeurs figées, à ne plus utiliser) : `--nuit --bleu --cyan --orange --vert --rouge --jaune`.

> ⚠️ **Décision à prendre en phase redesign** : `--rouge` vaut `#111110` (noir) — les états « retard » n'ont pas de couleur d'alerte et deviennent quasi invisibles en dark mode (`.cal-ev.late`, `#notifBadge`). Proposition : introduire un token `--danger` (un seul écart chromatique autorisé, à valider).

## 2 · Typographie

**Famille** : Inter (Google Fonts), graisses 400 / 500 / 600 / 700 / 800. Fallback `sans-serif`.

| Token | Taille | Usage canonique |
|---|---|---|
| `--fs-3xl` | 30px/800 | Titre de document (facture) |
| `--fs-2xl` | 26px/700, ls −.03em | Valeur de KPI |
| `--fs-xl` | 22px/700, ls −.02em | Titre de page |
| `--fs-lg` | 16px/700 | Titre de modal |
| `--fs-md` | 15px/600 | Sous-titres |
| `--fs-base` | 13.5px/400 | Corps de texte, tables, boutons |
| `--fs-sm` | 12px/400 | Texte secondaire `.t-sub` |
| `--fs-xs` | 11px/600, caps, ls +.6px | Labels KPI, en-têtes de table |
| `--fs-2xs` | 10px/600, caps, ls +1.6px | Labels de navigation, catégories |

Règles : letterspacing **négatif** sur les grands corps, **positif** sur les petits uppercase. Chiffres importants toujours en 700+.

## 3 · Espacement

Échelle base 4 : `--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-5` 20 · `--sp-6` 24 · `--sp-8` 32 · `--sp-10` 40.

Usages canoniques : gap grilles cards 14–16 · padding cards 18–22 · padding page 26–36 · gap contrôles 6–10.

## 4 · Rayons

`--r-sm` 8 (contrôles, inputs, chips) · `--r-md` 10 (toast) · `--r-lg` 12 = `--radius` (cards, défaut) · `--r-xl` 14 (modals, palette) · `--r-full` 999 (badges, progress, pill).

## 5 · Ombres (élévation)

| Token | Valeur | Élévation |
|---|---|---|
| `--sh-1` | `0 1px 2px rgba(17,17,16,.04)` | Cards posées |
| `--sh-2` | `0 1px 2px rgba(17,17,16,.18)` | Bouton primaire |
| `--sh-3` | `0 12px 32px rgba(17,17,16,.35)` | Toast |
| `--sh-4` | `0 20px 50px rgba(17,17,16,.25)` | Modals |
| `--sh-5` | `0 24px 64px rgba(0,0,0,.28)` | Palette Ctrl+K |

## 6 · Motion

`--t-fast` .13s (hover des contrôles) · `--t-base` .16s (pop des modals : translateY 8px + fade) · `--t-med` .22s (toast, transitions larges). **Jamais > 300ms.** Préférer `transform`/`opacity` (compositing).

## 7 · Z-index

Échelle documentée (tokens `--z-*`) : sidebar 20 · overlay/modals 50 · toast 99 · document (facture) 300 · day-panel 350 · notifications 360 · recherche 400 · auth cloud 500 · diagnostic 600 · lock screen 9999.

## 8 · Iconographie

**THE'Y Icons (Sprint 19 — livré)** : famille SVG unique — 25 symboles, stroke 1.7, coins arrondis, `currentColor`, viewBox 24×24, sprite inline (`<symbol id="i-*">`). Usage : `icon('nom')` en JS ou `<svg class="i"><use href="#i-nom"/></svg>`. **Zéro emoji, zéro symbole unicode** dans l'UI.
Exception : les *valeurs stockées* héritées (`priorite` « 🔴 Urgent », statut « Salit ✅ ») restent intactes (rétro-compat + sync) — seul l'affichage est mappé (`prioHTML/prioLabel/statutLabel`).

## 9 · États des composants

| État | Règle |
|---|---|
| Hover | Transition `--t-fast` ; contrôles : bordure → `--ink` ; primary : fond → `--ink2` ; lignes de table : fond `#FAFAF8` / `#222220` |
| Focus (champs) | Bordure `--ink` + halo `0 0 0 3px rgba(17,17,16,.07)` |
| Sélection | Inversion : fond `--ink`, texte `--bg` (chips `.on`, résultats `.sel`, nav `.active`) |
| Vide | `.empty` : glyphe 32px grisé + phrase en darija, jamais un écran blanc |
| Retard/alerte | `--danger` : badge bordure+texte, chips calendrier, pastille notifications, marqueurs « fat le délai » |
| Désactivé | **Non défini** — à spécifier en phase redesign |
| Chargement | **Non défini** (app locale instantanée) — nécessaire pour les états cloud |

## 10 · Composants (catalogue complet → design-system.html)

Boutons (primary/ghost/sm/icon) · Badges dot (13 statuts) · Chips de filtre · Champs (input/select/textarea + hint) · Cards & KPI · Tables (avatar, t-name/t-sub, row-acts) · Progress · Toast · États vides · Modals · Calendrier (cellules, chips événement, dots mobile) · Notifications · Palette de recherche · Facture/BL (print) · Sidebar/nav · Topbar · Lock screen.

## 11 · Gouvernance

- Tout **nouveau** style consomme les tokens. Aucune nouvelle valeur en dur.
- Toute modification de token = capture avant/après via `tests/screenshots.js` (diff pixel).
- Le catalogue `design-system.html` est mis à jour dans le même commit que tout nouveau composant.
- Les écarts constatés (voir UI_INVENTORY §Incohérences) se corrigent **uniquement** dans les sprints de redesign, jamais en passant.
