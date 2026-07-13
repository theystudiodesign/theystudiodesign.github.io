# Sprint 19 — Accents sémantiques & THE'Y Icons · Explainer

## Background

Le Design System v1 (Sprint 18) avait documenté deux dettes visuelles majeures : (I-2) « rouge = noir » —
tous les états d'alerte étaient rendus en `#111110`, quasi invisibles en dark mode ; (I-3) une
iconographie hybride — glyphes texte pour la navigation (▦ ◉ ▤ ◈), emojis pour les actions
(✏️ 🗑️ 👁 🔔…), au rendu dépendant de l'OS et sans contrôle de couleur. S'y ajoutait (I-1) :
~25 règles CSS référençant `var(--muted)` **qui n'existait pas** (le token s'appelle `--mut`).

Deux décisions produit ont été actées : base monochrome + **4 accents d'état** (rouge/vert/
orange/bleu), et **une seule famille d'icônes SVG** — zéro emoji, zéro symbole unicode.

## Intuition

> 💡 **La couleur est un langage d'état, pas une décoration.** Le monochrome reste l'identité ;
> les accents n'apparaissent que lorsqu'ils *disent quelque chose* : rouge = ça brûle (retard),
> orange = ça attend, vert = c'est fait, bleu = information. Un dashboard entier reste noir et
> blanc — sauf le paiement en retard, qui saute aux yeux.

> 💡 **Les données ne changent jamais, seul l'affichage est mappé.** Les priorités stockées
> (`"🔴 Urgent"`) et statuts (`"Salit ✅"`) sont des *valeurs de données* utilisées par les filtres,
> la recherche et le sync multi-appareils. Les modifier = migration risquée interdite. On mappe
> donc à l'affichage : `prioHTML('🔴 Urgent')` → pastille rouge + « Urgent » ; les `<option>`
> gardent l'ancienne valeur en `value` mais affichent le libellé propre.

## Code

1. **Tokens** (`:root` + `body.dark`) : `--danger #B04A3E/#D98A7E`, `--success #3E7C4F/#7FB08D`,
   `--warning #B08834/#D4B36A`, `--info #3E6B8F/#8FB3D4`. Les aliases hérités (`--rouge`, `--vert`…)
   re-pointés vers eux — les usages existants (chips calendrier en retard, pastille notifications)
   héritent automatiquement du bon rouge, dark compris.
2. **Fix I-1** : `var(--muted[,fallback])` → `var(--mut)` (20 sites, regex).
3. **THE'Y Icons** : sprite SVG inline de 25 `<symbol>` (24×24, stroke 1.7, `currentColor`) +
   helper `icon(name)` + CSS `.i`. ~100 remplacements : navigation, topbar (cloche, recherche,
   indicateur cloud), actions de ligne (œil/crayon/corbeille/facture/BL/check), boutons « + »,
   fermetures ✕, chevrons ‹ ›, thème ☀️/🌙, états vides, diagnostic cloud (✓/✗ → icônes colorées),
   toasts et messages nettoyés de leurs emojis.
4. **Sémantique appliquée aux états** : `.bg-retard` (bordure+texte danger), `.bg-attente` (dot
   warning), `.bg-livre` (dot success), pastilles notifications (points géométriques CSS au lieu
   de ●/○ unicode), priorités (dots), indicateur cloud (tokens), `.hint` (filet info).
   Contrastes dark gérés : texte sombre sur `--danger` clair (`.cal-ev.late`, `#notifBadge`).

## Verification

- Suite d'intégration complète : **98 ✓ / 0 ✗** (aucun comportement modifié — filtres, recherche,
  sync et données utilisent toujours les valeurs stockées d'origine).
- `node --check` OK · revue visuelle des captures light/dark (dashboard, tâches, calendrier) —
  le paiement en retard apparaît en rouge sur la bonne case (Sprint 17 + 19 combinés).
- Grep final : zéro emoji/glyphe dans l'UI (restent uniquement les *valeurs stockées* dans les
  constantes de mapping et les logs TRACE, hors périmètre).
- Audit `docs/design-audit/` régénéré (65 captures) ; catalogue v1.1 vérifié light/dark.
- Constat documenté (pas une régression) : colonnes du calendrier inégales — pré-existant,
  consigné comme I-11 pour le redesign calendrier.

**QA manuelle** : ouvrir l'app → nav et actions en icônes cohérentes ; Tâches → pastilles de
priorité colorées, libellés sans emoji ; Calendrier → chip du paiement en retard en rouge ;
mode sombre → tous les états lisibles ; sélecteur priorité → libellés propres, données intactes
(vérifier qu'une tâche existante garde sa priorité).

## Alternatives

**Migrer les valeurs stockées** (`"Urgent"` au lieu de `"🔴 Urgent"`) : plus propre à long terme,
mais exige une migration des données locales + cloud + rétro-compat multi-appareils (un appareil
non mis à jour ré-écrirait les anciennes valeurs) — reporté à une éventuelle v2 du schéma.
**Police d'icônes ou librairie (Lucide/Feather)** : viole le zéro-dépendance ; le sprite custom
pèse ~3 Ko et reste aligné sur la géométrie du logo.

## Suggested people to talk to

Mono-propriétaire (THE'Y STUDIO : CSS d'origine et badges ; ELFASSI Karima : sprints récents).
Un regard design externe sur les 4 teintes d'accent (harmonie avec le noir `#111110`) serait utile.

## Quiz

<details><summary>1. Pourquoi les `<option>` de priorité gardent-elles `value="🔴 Urgent"` ?</summary>
Parce que la valeur stockée est la donnée elle-même : les tâches existantes, les filtres et le
sync comparent ces chaînes. Changer la value casserait la pré-sélection des tâches existantes et
créerait des divergences multi-appareils. Le libellé affiché, lui, est propre (« Urgent »).
</details>
<details><summary>2. Comment le rouge « retard » est-il resté lisible en dark mode ?</summary>
Deux mécanismes : `--danger` a une variante dark plus claire (`#D98A7E`), et les surfaces pleines
(`.cal-ev.late`, `#notifBadge`) passent leur texte en sombre (`#141413`) en dark.
</details>
<details><summary>3. Pourquoi re-pointer les aliases plutôt que remplacer leurs usages ?</summary>
Les usages (`var(--rouge)`) héritent instantanément du bon accent light/dark en un seul point de
vérité, sans toucher ~10 sites. Les aliases restent dépréciés pour le nouveau code.
</details>
<details><summary>4. Que serait-il arrivé avec `${icon('x')}` dans une chaîne à quotes simples ?</summary>
Rien d'interpolé — et ici une SyntaxError (quotes imbriquées), attrapée par `node --check` :
les états vides en chaînes simples utilisent la concaténation `'+icon('x')+'`.
</details>
<details><summary>5. Pourquoi les pastilles ●/○ des notifications sont-elles devenues des ::before géométriques ?</summary>
« Zéro symbole unicode » : le rendu de ●/○ dépend de la police/OS. Un cercle CSS (7px,
border-radius 50%, plein = retard / cerclé = bientôt) est identique partout et suit les tokens.
</details>
