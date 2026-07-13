# Sprint 17 — Fix timezone (calendrier / dashboard) · Explainer

## Background

### Pour les débutants (à sauter si vous connaissez déjà l'app)

**THE'Y Gestion** est une SPA *offline-first* dans un seul fichier `gestion/index.html`. Toutes les données vivent dans LocalStorage sous `crm_gestion_clients_v1`. Les dates métier (deadlines, dates de paiement, événements) sont stockées comme des **chaînes `YYYY-MM-DD`** — exactement ce que produit un `<input type="date">` : une *date calendaire*, sans heure ni fuseau.

En JavaScript, un objet `Date` est un **instant absolu** (millisecondes depuis 1970 UTC), affiché différemment selon le fuseau. Deux familles de méthodes coexistent :

- `getFullYear()/getMonth()/getDate()` et `new Date(y,m,d)` → raisonnent en **heure locale** ;
- `toISOString()` → sérialise en **UTC**.

> ⚠️ **Le piège classique** : `new Date(2026,6,13)` crée « le 13 juillet à minuit, *heure locale* ». Au Maroc (UTC+1), cet instant est `2026-07-12T23:00:00Z` en UTC. Donc `new Date(2026,6,13).toISOString().slice(0,10)` renvoie… `"2026-07-12"`. La date a reculé d'un jour.

### Contexte direct du changement

Le calendrier (Sprint 04), le dashboard (Dashboard 2.0), les notifications (Sprint 05) et les rapports (Sprint 06) dérivaient tous leurs clés date en mélangeant les deux familles : construction **locale**, sérialisation **UTC**. En UTC pur (fuseau des environnements de test), tout paraissait correct. Au Maroc — le fuseau réel de l'utilisatrice — le bug était permanent pour la grille du calendrier et le chart, et actif entre minuit et 1h du matin pour « aujourd'hui »/« en retard ».

## Intuition

> 💡 **Une date calendaire n'est pas un instant.** « Le 13 juillet » n'a pas de fuseau — c'est une étiquette. Dès qu'on la fait transiter par un instant UTC (`toISOString`), on la corrompt pour tous les fuseaux ≠ UTC. La règle unique du fix : **une date calendaire se formate en local, un timestamp de sync se formate en UTC.**

**Exemple jouet (Maroc, UTC+1)** : la grille de juillet 2026 est générée par `new Date(2026,6,1-start+i)` pour 42 cases. La case *affichée* « 13 » (via `getDate()`, local) recevait la *clé* `"2026-07-12"` (via `toISOString()`, UTC). Un événement stocké `"2026-07-13"` était donc rangé dans la case dont la clé est `"2026-07-13"`… c'est-à-dire la case affichée **« 14 »**. Même mécanique pour la pastille « aujourd'hui » (décalée sur demain) et pour le chart de revenus, dont le bucket « juillet » avait la clé `"2026-06"` — tous les paiements de juillet comptés dans juin.

**Fenêtre de minuit** : entre 00h00 et 01h00 locale, `new Date().toISOString().slice(0,10)` renvoie *hier*. Conséquences : KPI « Aujourd'hui » à 0 DH, un paiement dû hier pas encore « en retard », snapshot quotidien daté de la veille.

## Code

### 1. Le helper unique (`gestion/index.html`, section HELPERS)

```js
/* Date calendaire LOCALE au format YYYY-MM-DD (Sprint 17).
   JAMAIS toISOString() pour une date de calendrier: il convertit en UTC et
   décale d'un jour dans les fuseaux positifs (Maroc UTC+1: minuit local = veille 23h UTC).
   toISOString() reste correct — et requis — pour les timestamps updatedAt du sync (LWW). */
function isoLocal(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
```

### 2. Les 14 sites remplacés (aucune logique modifiée, seule la dérivation de clé)

| Site | Avant | Impact du bug |
|---|---|---|
| `CAL_TODAY()` | `toISOString().slice(0,10)` | « aujourd'hui » = hier entre 00h et 01h |
| `monthCells()` | idem | **toute la grille du mois décalée d'un jour** |
| `weekCells()` | idem | vue semaine décalée |
| `isOverdue()` | idem | retards non détectés près de minuit |
| `renderDash` (`jour`, `mois`) | idem / `slice(0,7)` | KPIs « Aujourd'hui » / « Had chher » faux |
| `monthlyRevenue()` | `slice(0,7)` | **chart : chaque mois agrégé sous le mois précédent** |
| `dashTaches` / `renderTaches` (`today`) | `slice(0,10)` | marquage « fat le délai! » décalé |
| `openPayModal` (date par défaut) | idem | paiement pré-daté de la veille |
| `getNotifications` (`soon`/`past`) | idem | fenêtres d'alerte décalées |
| `reportRange` (`mois`/`moisprec`) | `slice(0,7)` | rapports du mauvais mois |
| `factureNum`/`blNum` (année fallback) | `slice(0,4)` | numéro AE-2025-xxx le 1er janvier à 00h30 |
| `exportData` (nom de fichier) | `slice(0,10)` | cosmétique |

```js
// exemple — monthCells, la ligne au cœur du bug visible :
cells.push({iso:isoLocal(d),day:d.getDate(),out:d.getMonth()!==m});  // avant: d.toISOString().slice(0,10)
```

### 3. Ce qui n'a PAS été touché — volontairement

- **Timestamps du sync** (`updatedAt`, `updated_at`, `lastSync`) : restent en `toISOString()`. Le LWW compare des instants entre appareils potentiellement dans des fuseaux différents — l'UTC y est indispensable.
- L'instrumentation TRACE (dette d'un autre sprint), `fdate()`/`fdateFR()` (déjà locaux via `new Date(d+'T00:00')`), le moteur cloud, DataLayer, le format de stockage.
- `gestion/sw.js` : uniquement bump `they-gestion-v30` (+ `window.__BUILD='v30'`), procédure de release standard.

### 4. Tests (`tests/run.js`, scénario [19] — 15 assertions)

`newDevice()` accepte désormais `timezoneId` (contexte Playwright) et l'horloge est figée par `page.clock.setFixedTime(...)` :

- **Casablanca, midi local** : cellule « 13 » → iso `2026-07-13`, 1ʳᵉ cellule = lundi 29 juin, semaine commence lundi 13, pastille « today » sur la case 13 (DOM), événement du 13 rendu dans la case 13 (vues mois **et** semaine), bucket chart = `2026-07`.
- **Casablanca, 00h30 locale** (= `2026-07-12T23:30Z`, la fenêtre critique) : `CAL_TODAY` = 13, `isOverdue` d'un dû du 12 = vrai, KPI « Aujourd'hui » compte un paiement du 13 (assertion sur le DOM du dashboard).
- **Garde UTC** : les 4 mêmes invariants en UTC pur — le comportement historique correct est verrouillé.

## Verification

1. **Reproduction d'abord** (exigence du sprint) : les 15 assertions ont été exécutées **avant** le fix → `7 ✓ / 8 ✗` : les 8 échecs en Africa/Casablanca correspondaient exactement aux symptômes prédits (`2026-07-12` au lieu de `2026-07-13`, pastille sur « 14 », bucket `2026-06`, KPI `0 DH`), et 0 échec en UTC.
2. **Après le fix** : suite complète `cd tests && npm install && npm run build:vendor && npm test` → **85 ✓ / 0 ✗** (70 existants — cloud sync, seed, restore — + 15 nouveaux). Aucune régression.
3. `node --check` sur le JS inline extrait, `gestion/sw.js` et `tests/run.js` — OK.

**QA manuelle, pas à pas (au Maroc ou tout fuseau UTC+):**
1. Ouvrir l'app → Calendrier : la pastille sombre « aujourd'hui » doit être sur le numéro du jour réel (avant le fix : sur demain).
2. Créer un événement daté d'aujourd'hui → il doit apparaître dans la case d'aujourd'hui, en vue mois et semaine.
3. Dashboard : ajouter un paiement « Payé » daté d'aujourd'hui → la carte « Aujourd'hui » doit l'inclure, et le chart doit créditer le **mois courant**.
4. (Test de la fenêtre critique) Changer l'heure système à 00h30 → recharger : « Aujourd'hui » et les retards doivent suivre la date locale.

## Alternatives

### A. Stocker et calculer tout en UTC (convertir aussi les dates saisies)

| Pour | Contre |
|---|---|
| Une seule référence temporelle dans tout le code | Casse la sémantique des `<input type="date">` (l'utilisateur pense en date locale) |
| | **Migration des données existantes** (toutes les dates stockées) — risque élevé, interdit sans nécessité |
| | Le problème réapparaît à l'affichage (il faudrait reconvertir partout) |

### B. Bibliothèque de dates (Luxon / date-fns-tz)

| Pour | Contre |
|---|---|
| API robuste, DST géré explicitement | Viole le principe « zéro dépendance » du projet |
| | ~20–70 kB pour remplacer un helper de 1 ligne |
| | Surface d'attaque/maintenance supplémentaire (CDN ou vendoring) |

Le helper local d'une ligne résout 100 % des cas observés sans toucher au stockage ni à l'architecture.

## Suggested people to talk to

L'historique git ne contient que deux identités du même propriétaire — **THE'Y STUDIO** (Sprints 01–12 : calendrier `monthCells`/`weekCells` du Sprint 04, Dashboard 2.0, data provider) et **ELFASSI Karima** (fixes récents seed/restore et diagnostics TRACE). Les zones modifiées ici (calendrier + KPIs) ont été écrites dans les Sprints 04–06 par THE'Y STUDIO : c'est la personne ayant le plus de contexte sur l'intention du data provider `getCalendarEvents` et du chart.

## Quiz

<details>
<summary>1. Pourquoi la pastille « aujourd'hui » apparaissait-elle sur la case de <b>demain</b> au Maroc, alors que <code>CAL_TODAY()</code> renvoyait la bonne date à midi ?</summary>

**Parce que ce sont les clés des cellules qui étaient fausses, pas « today ».**

- ✅ Correct : à midi local (UTC+1), `new Date().toISOString()` donne encore la bonne date → `CAL_TODAY()` = 13. Mais chaque cellule recevait `iso = date locale − 1` (minuit local sérialisé en UTC). La cellule dont l'iso vaut « 13 » est celle affichée « 14 » → le marqueur `c.iso===today` tombait sur la case 14.
- ❌ « CAL_TODAY renvoyait demain » : faux à midi — il ne dérape qu'entre 00h et 01h locale.
- ❌ « Le rendu CSS était décalé » : faux — le HTML généré était déjà faux.
</details>

<details>
<summary>2. Pourquoi le chart de revenus créditait-il <b>juin</b> pour des paiements de <b>juillet</b> ?</summary>

**`new Date(2026,6,1)` = 1ᵉʳ juillet minuit local = 30 juin 23h UTC → `toISOString().slice(0,7)` = `"2026-06"`.**

- ✅ Correct : la clé du bucket « mois courant » devenait le mois précédent ; le filtre `p.date.startsWith(key)` n'attrapait donc que les paiements de juin. Chaque barre était décalée d'un mois.
- ❌ « Les paiements étaient stockés avec la mauvaise date » : faux — le stockage (`YYYY-MM-DD` saisi) a toujours été correct ; seule la clé d'agrégation était fausse.
</details>

<details>
<summary>3. Pourquoi ne pas avoir remplacé <b>tous</b> les <code>toISOString()</code> du fichier ?</summary>

**Parce que les timestamps du sync doivent rester en UTC.**

- ✅ Correct : `updatedAt`/`lastSync` sont des instants comparés entre appareils (LWW). Deux appareils dans des fuseaux différents doivent produire des horodatages comparables — l'UTC est la seule référence commune. Les convertir en local casserait la résolution de conflits.
- ❌ « Par manque de temps » : faux — c'est une frontière sémantique délibérée, documentée dans ARCHITECTURE.md : *date calendaire → `isoLocal`, timestamp → `toISOString`*.
</details>

<details>
<summary>4. Comment les tests simulent-ils le Maroc de façon déterministe ?</summary>

**Contexte Playwright `timezoneId:'Africa/Casablanca'` + horloge figée `page.clock.setFixedTime(...)`.**

- ✅ Correct : le fuseau du navigateur est émulé par le contexte (indépendant de la machine CI), et l'instant est figé (`2026-07-13T12:00+01:00` puis `00:30+01:00` pour la fenêtre critique). Les assertions portent sur les fonctions réelles **et** sur le DOM rendu (pastille, case de l'événement, carte KPI).
- ❌ « En changeant TZ de l'OS » : faux — fragile et global ; l'émulation par contexte permet Casablanca et UTC dans le même run.
</details>

<details>
<summary>5. Un utilisateur en UTC−5 (New York) était-il touché avant le fix ?</summary>

**Oui — dans l'autre sens et encore plus longtemps près de minuit.**

- ✅ Correct : en fuseau négatif, minuit local = 5h UTC du même jour → `monthCells` n'était pas décalé (la sérialisation UTC reste le même jour), MAIS la fenêtre du soir s'inverse : de 19h à minuit locale, `toISOString()` donne déjà *demain* → « aujourd'hui », retards et snapshots dérapaient 5 heures par jour. Le fix par `isoLocal` couvre les deux familles de fuseaux.
- ❌ « Seuls les fuseaux positifs étaient touchés » : faux — seule la *grille* ne l'était pas ; les calculs « now » l'étaient dans tous les fuseaux ≠ UTC.
</details>
