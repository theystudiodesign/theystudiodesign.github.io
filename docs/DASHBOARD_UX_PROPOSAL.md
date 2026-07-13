# Dashboard UX Proposal — Sprint 20 (avant implémentation)

> Wireframes interactifs : [`docs/dashboard-wireframe.html`](dashboard-wireframe.html) (3 artboards : desktop 1440 · tablet 834 · mobile 390).
> **Aucun code de production** — ce document + les wireframes attendent approbation avant l'implémentation.
> Références : Apple (espace, typographie, salutation), Stripe (clarté des chiffres, deltas), Linear (chrome silencieux, sections comptées, actions contextuelles), Vercel (metrics strip, monochrome discipliné).

## 1 · Hiérarchie des KPIs (3 niveaux — remplace les 8 cartes plates)

| Niveau | Contenu | Traitement |
|---|---|---|
| **Héros** (2 cartes) | **Encaissé — mois courant** (34px, delta % vs mois précédent, sparkline 6 mois) · **À encaisser** (34px, part en retard en `--danger`, ancienneté du plus vieux dû) | Les deux questions vitales d'un studio : *combien je gagne / qui me doit quoi*. Seul endroit avec des chiffres géants. |
| **Metrics strip** (1 bande) | Aujourd'hui · Ce mois · Cette année · Moy./projet · Projets livrés | 5 chiffres calmes 16.5px `tabular-nums`, séparés par filets verticaux (Vercel). Zéro carte, zéro bruit. |
| **Contextuel** | Compteurs déplacés dans les en-têtes de section : « Daba · 4 », « À encaisser · 2 », « Projets en cours · 1 » (Linear) | « Clients actifs » et « Projets en cours » ne méritent pas une carte KPI — ce sont des propriétés des sections. |

Supprimé : le `font-size` inline conditionnel (`length>14?'17px':'26px'`) → tailles fluides `clamp()` + `tabular-nums`.

## 2 · Architecture de l'information (ordre de lecture, haut → bas)

1. **Salutation + contexte** — « Salam, Yassine » + date + résumé une ligne (2 clients actifs · 1 projet en cours). Ton personnel (Apple), remplace le doublon « Dashboard / Vue d'ensemble ».
2. **Quick actions** — `+ Paiement` (ghost) et `+ Client` (primary) en haut à droite : les 2 créations les plus fréquentes.
3. **Héros** (argent) → 4. **Strip** (repères) → 5. **Chart revenus** → 6. **« Daba »** (file de travail) + **À encaisser** → 7. **Projets en cours**.

Logique : *combien* → *tendance* → *quoi faire maintenant* → *ce qui avance*. L'utilisateur répond à ses 3 questions du matin en < 5 secondes sans scroller (desktop : héros + strip + chart au-dessus de la ligne de flottaison).

## 3 · Placement des widgets

**Desktop 1440** (grille 12 col, gaps 16) : héros 6+6 · strip 12 · chart 12 · **Daba 7 + À encaisser 5** · projets 12.
**Tablet 834** (2 col) : héros 1+1 · strip pleine largeur en 2×2 clé-valeur · chart, Daba, À encaisser, projets empilés pleine largeur.
**Mobile 390** (pile unique) : header salutation + bouton `+` rond · **segmented control « Aperçu / Daba · 4 »** (2 jobs, 1 écran, zéro scroll infini) · héros fusionné en 1 carte (2 blocs séparés par filet) · strip en liste clé-valeur · chart réduit à **6 mois** (lisible sans scroll horizontal) · Daba (cibles 44px) · **tab bar système en bas** (5 onglets — le pouce, pas le haut de l'écran).

## 4 · Widgets — détail

- **« Daba »** (fusion de « Ach khassek tkhdem daba » + « Flous f l'attente/retard » côté tâches) : file unique triée **retards (dot danger) → aujourd'hui → semaine**, mélangeant tâches, paiements dus et événements — dérivée du data provider existant `getCalendarEvents` (zéro nouvelle lecture). Action contextuelle par ligne : *Salit* (tâche), *Relancer* (paiement), *Ouvrir* (événement).
- **« À encaisser »** : liste compacte des paiements non payés (montant `tabular-nums` à droite, pastille « en retard »/« dans X j »), **total attendu** en pied. C'est la vue « cash-flow » que le studio consulte avant toute relance.
- **Chart revenus v2** : mois courant en encre pleine, historique atténué (`--line2`), baseline unique, hover = tooltip HTML (mois + montant), **clic sur une barre = Paiements filtrés sur le mois**. Multi-devise conservé (2 max).
- **Projets en cours** : ligne compacte — nom, client, pastille statut (accent), progress 4px, encaissé/prix.

## 5 · Flux de navigation (tout est une porte d'entrée)

| Élément | Clic → |
|---|---|
| Héros « Encaissé » | Paiements, filtre Payé |
| Héros « À encaisser » / total | Paiements, filtre En attente + retard |
| Barre du chart | Paiements du mois cliqué |
| Ligne « Daba » | Ouvre l'entité (modal existante) ; bouton = action directe |
| En-têtes « Tâches → / Paiements → / Projets → » | Onglet correspondant |
| Compteur « 2 clients actifs » (sous-titre) | Clients |

Raccourcis existants inchangés (Ctrl+K, cloche, ☁). Aucun nouveau pattern de navigation à apprendre : le dashboard devient un *routeur*, les onglets restent la source de vérité.

## 6 · Rationale (pourquoi ça fait « premium »)

- **Apple** — un seul moment de grandeur (les 2 héros), généreux en blanc ; salutation personnelle ; le reste se tait.
- **Stripe** — les montants sont des données : `tabular-nums`, deltas signés avec fond teinté à 9 %, sparkline discrète ; jamais de couleur décorative.
- **Linear** — chrome minimal : sections = titre 13px + compteur gris + lien « → » ; actions révélées par ligne ; densité respirante (padding 18–24).
- **Vercel** — le metrics strip remplace 5 cartes par 1 bande : moins de bordures = plus de calme.
- **THE'Y** — monochrome + 4 accents d'état uniquement (danger/warning/success), darija conservée (« Daba », « Salit »), tokens du Design System partout, zéro dépendance.

## 7 · Contraintes d'implémentation (rappel — inchangées)

`renderDash()` seul point d'entrée · helpers de données existants (`sumByDevise`, `monthlyRevenue`, `dominantDevises`, `isOverdue`, `getCalendarEvents`) · calculs nouveaux limités au delta mois vs mois-1 (données existantes) · zéro dépendance · dark mode + 3 viewports livrés ensemble · captures avant/après + 98 tests verts · la tab bar mobile n'est PAS dans ce sprint (S24 Responsive) — mobile S20 = pile + segmented control dans la page existante.

## 8 · Découpage proposé (rappel roadmap)

- **S20 (D1)** : héros + strip + sections comptées + « À encaisser » (structure/CSS, données existantes)
- **S21 (D2)** : chart v2 (hover, clic → filtre, mois courant accentué)
- **S22 (D3)** : file « Daba » unifiée avec actions contextuelles
