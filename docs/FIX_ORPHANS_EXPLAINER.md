# Fix critique — Intégrité référentielle (orphelins / cascade delete) · Explainer

## Background

Le modèle de données est relationnel *par convention* : `projets/taches/paiements/events` portent
un `clientId` (et parfois un `projetId`) qui pointe vers `DB.clients`. LocalStorage n'a ni clés
étrangères ni contraintes — l'intégrité repose entièrement sur la discipline du code. Côté cloud,
en revanche, PostgreSQL **a** des FK (`client_id references clients(id)`) : un orphelin poussé au
cloud est *rejeté* (violation FK) et bloque le push en « ☁ en attente… ».

Historique pertinent : l'ère v21/v22 a fusionné deux seeds de démo (2 navigateurs → 4 clients),
puis divers fixes (v23–v26) ont purgé clients de démo et snapshots pollués — mais **jamais les
lignes dépendantes** dont le parent avait disparu entre-temps.

## Intuition

> 💡 **Un orphelin est invisible mais pas inoffensif.** Aucune page ne l'affiche avec son client
> (le nom devient « — »), mais les agrégats (`sumByDevise`, KPIs, chart) parcourent `DB.paiements`
> **sans jamais vérifier que le client existe**. D'où l'état observé : clients=0 et pourtant
> « 3 100 DH » au dashboard — exactement 300+800+2 000, les paiements d'un seed dont les clients
> ont disparu il y a plusieurs versions.

Pourquoi `delClient` ne les enlevait pas ? Son filtre est `clientId === id-du-client-supprimé`.
Les orphelins référencent des ids qui n'existent **déjà plus** — aucun clic sur 🗑️ ne peut les
atteindre. Et aucun autre chemin (boot, normalize, pull, import, restore) ne validait quoi que ce soit.

La solution la plus sûre n'est pas d'ajouter un filtre de plus à chaque endroit, mais **une
garantie unique** : à chaque écriture, l'état persisté est référentielement intègre.

## Code

### 1. La garantie : `sweepOrphans(db)`

```js
function sweepOrphans(db){
  const cids=new Set((db.clients||[]).map(c=>c.id));
  const removed={projets:[],taches:[],paiements:[],events:[],total:0};
  ['projets','taches','paiements','events'].forEach(k=>{
    const keep=[];
    (db[k]||[]).forEach(r=>{(!r.clientId||cids.has(r.clientId))?keep.push(r):removed[k].push(r)});
    db[k]=keep;
  });
  const pids=new Set((db.projets||[]).map(p=>p.id));
  ['taches','paiements'].forEach(k=>(db[k]||[]).forEach(r=>{if(r.projetId&&!pids.has(r.projetId))r.projetId=''}));
  ...
}
```

Règle conservatrice : seul un `clientId` **non vide et inconnu** condamne la ligne. `clientId`
vide = « sans client » (les events personnels sont légitimes). Un `projetId` pendant ne supprime
pas la ligne (le paiement d'un client existant reste de l'argent réel) — il est vidé, aligné sur
le comportement historique de `delProjet`.

### 2. Les trois points d'appel

| Site | Rôle |
|---|---|
| `save()` | **Invariant** : aucun orphelin ne peut plus être persisté ni poussé — couvre delClient, delProjet, import, restore, et toute mutation future |
| `load()` | **Migration** : purge les orphelins hérités au boot ; les lignes retirées sont conservées dans `they_rescue_orphans` (filet de sécurité, une écriture unique) |
| `cloudPull()` | **Frontière** : un orphelin présent au cloud n'est jamais adopté ; `pending=true` → le push suivant le supprime du cloud (diff `baseIds − local`) = auto-guérison du cloud, et plus de violation FK |

### 3. Chemins de suppression complétés

- `delClient` : + `DB.events` (manquait) ; message de confirmation honnête (projets, paiements, tâches, événements).
- `delProjet` : + nettoyage du `projetId` des **tâches** (seuls les paiements l'étaient).

### 4. Compatibilité cloud sync — pourquoi rien ne casse

Les suppressions du sweep passent par le mécanisme existant : lignes absentes du local mais
présentes dans `baseIds` → supprimées au push. Le LWW n'est pas touché. Le cas « B édite une tâche
pendant que A supprime le client » converge désormais proprement : au pull de B, le client absent
est supprimé (baseIds), puis le sweep retire la tâche → cohérent avec la limite documentée
« suppression > édition », et le push de B ne viole plus la FK.

## Verification

**Reproduction d'abord** (exigence) : scénario [20] écrit avant le fix → **10 échecs**, dont la
copie exacte de l'état signalé : storage `{clients:0, projets:1, taches:3, paiements:4}` → boot →
« Total encaissé : 3 100 DH ». Après le fix : **98 ✓ / 0 ✗** (85 existants + 13 nouveaux).

Couverture du scénario [20] : cascade complète (events inclus) · events personnels préservés ·
purge au boot + KPI à 0 DH + rescue rempli · import assaini · restore assaini · propagation cloud
de la cascade (2 appareils) · convergence de B · non-adoption d'un orphelin injecté au cloud.

**QA manuelle** : ouvrir l'app (les fantômes disparaissent au premier chargement — ils restent
récupérables dans `localStorage.they_rescue_orphans`) → dashboard à 0 si plus de clients →
supprimer un client avec événements → calendrier propre → vérifier ☁ sync ✓.

## Alternatives

**Tombstones explicites par entité (deleted_at)** : résout aussi « delete vs edit » mais schéma
plus lourd, purge périodique nécessaire, migration risquée — hors de proportion ici.
**Vérifier l'existence du client dans chaque agrégat** (KPIs, chart, recherche…) : masque le
symptôme sans nettoyer les données ; les orphelins continueraient de bloquer le push FK. Rejeté.

## Suggested people to talk to

Mono-propriétaire (THE'Y STUDIO : moteur sync Sprints 11–12 ; ELFASSI Karima : fixes v23–v26 dont
les purges de démo — contexte direct sur l'origine des orphelins).

## Quiz

<details><summary>1. Pourquoi `delClient` ne pouvait-il pas supprimer les 4 paiements fantômes ?</summary>
Son filtre vise `clientId === id` du client qu'on supprime. Les fantômes référencent des ids de
clients disparus depuis plusieurs versions — aucun client actuel ne les « possède », donc aucun
clic ne les atteint. C'est un problème d'*intégrité*, pas de cascade.
</details>
<details><summary>2. Pourquoi le sweep est-il dans `save()` plutôt que seulement dans `delClient` ?</summary>
Pour transformer une correction ponctuelle en **invariant** : quel que soit le chemin (delete,
import, restore, future feature), l'état persisté est intègre. `delClient` garde sa cascade
explicite par lisibilité, mais la garantie ne dépend plus de la discipline de chaque appelant.
</details>
<details><summary>3. Quel risque y aurait-il eu à supprimer aussi les lignes au `projetId` pendant ?</summary>
Perte de données réelles : un paiement dont le projet a été supprimé appartient toujours à un
client existant — c'est de l'argent encaissé. On vide la référence (comportement historique de
`delProjet`), on ne supprime pas la ligne.
</details>
<details><summary>4. Comment le cloud se « guérit-il » de ses propres orphelins ?</summary>
Au pull, l'orphelin distant n'est pas adopté mais son id entre dans `baseIds` ; comme il est
absent du local, le push suivant l'inclut dans le diff `baseIds − local` → DELETE au cloud.
</details>
<details><summary>5. Pourquoi un event avec `clientId:''` survit-il au sweep ?</summary>
Le modèle autorise les événements sans client (type « Personnel », sélecteur « — »). La règle du
sweep est conservatrice : seule une référence non vide ET inconnue est un orphelin.
</details>
