# DASHBOARD REDESIGN — Roadmap (préparé au Sprint 18, à exécuter après approbation du Design System)

> Objectif : faire du Dashboard la vitrine « premium SaaS » de l'app — sans toucher au moteur
> (DataLayer, data providers, sync). Le redesign est **purement présentation**.

## État actuel (voir `design-audit/desktop-*-dash.jpg`)

8 stat-cards identiques en grille auto-fit + 1 chart + 4 cards listes empilées.
Constats (UI_INVENTORY I-8) : pas de hiérarchie de lecture, KPIs primaires et secondaires
au même niveau, `font-size` inline conditionnel pour les montants longs, chart sans axe Y,
actions inline (« Salit ✓ », « Tkhelless ✓ ») visuellement identiques partout.

## Étapes proposées (chaque étape = un sprint court, avec diff visuel avant/après)

### D1 — Hiérarchie des KPIs
- 2 niveaux : **héros** (Total encaissé, En attente — grands, avec tendance vs mois précédent)
  et **secondaires** (Aujourd'hui, Année, Retard, Moy./projet — compacts sur une ligne).
- Suppression du `font-size` inline : composant KPI avec taille fluide (`clamp()`).
- Tendances calculées depuis les données existantes (aucun nouveau champ).

### D2 — Chart revenus v2
- Même SVG natif (zéro dépendance) : + axe Y discret, + valeur au survol (tooltip HTML,
  pas `<title>`), + moyenne mobile 3 mois en trait fin, + état « mois en cours » hachuré.
- Interaction : clic sur une barre → Paiements filtrés sur le mois (réutilise `go()` + filtres).

### D3 — Bloc « Aujourd'hui » actionnable
- Fusion « Ach khassek tkhdem daba » + retards en une **liste de travail unique** priorisée
  (retards ● puis échéances du jour puis semaine), dérivée du data provider existant
  (`getCalendarEvents` — zéro nouvelle lecture de DB).
- Actions rapides au survol uniquement (réduction du bruit).

### D4 — Polish premium
- Micro-transitions d'entrée (stagger 30ms, `--t-base`), skeletons pour l'état « chargement cloud »,
  nombres en `font-variant-numeric: tabular-nums`, icônes SVG unifiées (dépend de la décision
  iconographie du Design System), correction I-1/I-2 (`--muted`, `--danger`) **à ce moment-là**.

## Contraintes (invariantes)

1. `renderDash()` reste le seul point d'entrée ; les données viennent des mêmes helpers
   (`sumByDevise`, `monthlyRevenue`, `dominantDevises`, `isOverdue`).
2. Zéro dépendance externe. Dark mode et mobile au même niveau que light desktop.
3. Chaque sprint : captures avant/après (`tests/screenshots.js`) + suite d'intégration verte.
4. La grille responsive existante (900px / 640px) est conservée jusqu'au sprint Responsive dédié.

## Ordre recommandé

Design System approuvé → **D1** → **D2** → **D3** → **D4** → puis Responsive audit (Roadmap #9)
et Landing premium en parallèle possible (surfaces indépendantes).
