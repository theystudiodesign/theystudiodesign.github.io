# Sprint 12 — Cloud Sync v2 (Supabase) · Explainer

## Background

### Pour les débutants (à sauter si vous connaissez déjà l'app)

**THE'Y Gestion** est une application de gestion (CRM + projets + paiements + calendrier) construite comme une SPA *offline-first* dans un seul fichier `gestion/index.html`, hébergée sur GitHub Pages. Toutes les données vivent dans le navigateur, dans **LocalStorage**, sous une clé unique (`crm_gestion_clients_v1`) contenant un objet `DB = {clients, projets, taches, paiements, events, compteurs}`.

Deux fonctions sont le seul point de contact avec le stockage : `load()` au démarrage et `save()` après chaque modification (le Sprint 10 a formalisé cela via la façade `DataLayer`). C'est ce qui rend une migration cloud possible sans toucher l'UI.

**Supabase** fournit trois briques : une base PostgreSQL exposée en REST (PostgREST), une authentification par email/mot de passe (GoTrue), et la *Row Level Security* (RLS) — des règles SQL qui garantissent que chaque utilisateur ne voit que ses propres lignes (`user_id = auth.uid()`).

### Contexte direct du changement

Le Sprint 11 avait livré un **pilote** : schéma SQL complet + un mode cloud rudimentaire, activé seulement si `gestion/supabase-config.js` est rempli. Ce pilote avait trois problèmes sérieux :

> ⚠️ **Bug de perte de données multi-appareils** : à chaque push, le pilote supprimait du cloud *toutes les lignes absentes en local* (`delete where id not in (...)`). Si l'appareil B poussait avec un état périmé, il effaçait les lignes créées entre-temps par l'appareil A.

- **Aucune gestion de conflit** : si deux appareils modifiaient la même ligne, le dernier push écrasait tout, sans notion de « plus récent ».
- **Champs perdus en route** : le schéma SQL n'avait pas les colonnes `projet_id` et `details` de la table `taches` — un aller-retour cloud les faisait disparaître silencieusement.

## Intuition

L'idée centrale du Sprint 12 tient en trois principes :

> 💡 **1. Chaque ligne porte sa date de modification.** À chaque `save()`, on compare chaque ligne à sa « signature » précédente (son JSON, hors horodatage). Si elle a changé, on lui stampe `updatedAt = maintenant`. C'est le fondement du **last-write-wins (LWW)** : en cas de conflit, la version la plus récente gagne — ligne par ligne, pas table par table.

**Exemple jouet** : le client « Atlas SARL » existe sur les appareils A et B. Hors ligne, A change ses notes à 14h00, B les change à 14h05. Quand les deux se resynchronisent, tout le monde converge vers la version de B (14h05 > 14h00) — sans perdre les autres clients modifiés par A.

> 💡 **2. On se souvient de ce que le cloud connaissait.** L'état `baseIds` (persisté en LocalStorage) mémorise les ids présents au cloud lors du dernier sync. Une suppression locale = « id dans baseIds mais plus en local » → on ne supprime au cloud **que** ces ids-là. Une ligne inconnue de baseIds qui apparaît au cloud = création d'un autre appareil → on l'adopte. C'est un système de *tombstones* implicites qui corrige le bug d'effacement du Sprint 11.

**Exemple jouet** : baseIds = {X, Y}. A supprime Y hors ligne et crée Z (local = {X, Z}). Pendant ce temps B crée W au cloud (cloud = {X, Y, W}). Au retour de A : pull-merge → Y est dans baseIds et absent localement → suppression en attente ; W est inconnu de baseIds → adopté. Push → upsert {X, Z, W}, delete {Y}. Résultat : {X, Z, W} partout. Rien de B n'a été perdu.

> 💡 **3. Un échec n'est jamais une perte.** Le flag `dirty` est persisté : tant qu'un push n'a pas réussi, il reste levé, et le push est rejoué automatiquement au retour du réseau (event `online`), au retour sur l'onglet (`visibilitychange`) et au prochain démarrage. LocalStorage reste toujours la source de démarrage — le cloud n'est qu'un miroir.

## Code

Tout le moteur vit dans la section `CLOUD SYNC v2` de `gestion/index.html` (~250 lignes). Parcours par groupe :

### 1. Horodatage des lignes

```js
function rowSig(o){const c={...o};delete c.updatedAt;return JSON.stringify(c)}
function cloudStamp(){ // hook save(): stamp updatedAt sur les lignes modifiées
  const now=new Date().toISOString();
  for(const ent of Object.keys(CLOUD_TABLES)){
    const prev=Cloud.sig[ent]||{},next={};
    (DB[ent]||[]).forEach(r=>{const s=rowSig(r);if(prev[r.id]!==s)r.updatedAt=now;next[r.id]=s});
    Cloud.sig[ent]=next;
  }
}
```

`save()` appelle désormais `cloudStamp()` **avant** l'écriture LocalStorage, puis `cloudOnSave()` (dirty + push débouncé). Actif même en mode local : les données se préparent à la migration sans cloud.

### 2. Pull-merge LWW (`cloudPull`)

Pour chaque table, les lignes du cloud et du local sont fusionnées :

```js
remote[ent].forEach(r=>{
  const l=localMap.get(r.id);
  if(!l){
    if(base.has(r.id)){pending=true;return} // supprimé localement → sera supprimé au push
    merged.push(r);return                    // nouveau depuis un autre appareil
  }
  localMap.delete(r.id);
  if((l.updatedAt||'')>(r.updatedAt||'')){merged.push(l);pending=true} // local plus récent
  else merged.push(r);                                                 // cloud gagne (LWW)
});
```

Les compteurs facture/BL sont fusionnés par `max()` (un compteur ne recule jamais).

### 3. Push sûr (`cloudPush`)

```js
const localIds=new Set(rows.map(r=>r.id));
const dead=(s.baseIds[ent]||[]).filter(id=>!localIds.has(id));
if(dead.length){await Cloud.client.from(ent).delete().in('id',dead)}
s.baseIds[ent]=[...localIds];
```

Suppression **uniquement** du diff `baseIds − local`. Le dangereux `delete not.in(...)` du Sprint 11 a disparu. `dirty=false` seulement après un push complet réussi.

### 4. Resync automatique

```js
window.addEventListener('online',()=>{
  if(Cloud.client&&Cloud.user&&syncState().dirty)cloudPush(true);
});
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden&&Cloud.client&&Cloud.user)cloudPull().catch(()=>cloudStatus('pending'));
});
```

### 5. Auth v2 + diagnostic

- Écran THE'Y CLOUD : connexion, création de compte, **« Continuer sans cloud »** (l'app n'est jamais bloquée), messages d'erreur traduits (`authErrMsg`).
- Indicateur **☁** dans la topbar : `sync ✓` / `en attente…` / `erreur` — clic = panneau de diagnostic.
- `cloudDiagChecks()` détecte, avec le fix exact pour chaque cas : config vide, URL invalide, clé anon incorrecte (ou clé `service_role` — interdite côté navigateur), projet en pause/injoignable, `schema.sql` non exécuté.

### 6. Schéma SQL (`supabase/schema.sql`)

- Colonnes ajoutées : `taches.projet_id`, `taches.details` (+ `alter table ... add column if not exists` pour les projets déjà créés).
- Trigger `touch_updated_at` adapté au LWW : il respecte l'`updated_at` fourni par le client, et n'horodate automatiquement que les éditions directes dans le dashboard :

```sql
if new.updated_at is not distinct from old.updated_at then
  new.updated_at = now();
end if;
```

### 7. Suite d'intégration (`tests/`)

- `mock-supabase.js` : mock GoTrue + PostgREST + isolation RLS par utilisateur, en node natif, zéro dépendance.
- `run.js` : Playwright pilote l'app réelle dans Chromium avec le **vrai bundle supabase-js** (injecté à la place du CDN), simule deux appareils (deux contextes navigateur), le mode hors ligne (`setOffline`), etc.

## Verification

**Automatique — 49 assertions, 15 scénarios, 2 exécutions consécutives à 49/49 :**

1. Régression : config vide = 100 % local, indicateur caché, seed intact, zéro appel réseau
2. Inscription → session + premier push local→cloud (user_id posé sur chaque ligne)
3. Mauvais mot de passe → message clair, gate conservé
4. Deuxième appareil : récupère toutes les données ; LocalStorage = cache du cloud
5. Sync auto : save → push débouncé → pull sur l'autre appareil
6. Offline-first : dirty persistant après push raté, resync auto sur event `online`
7. Conflits : LWW par ligne, convergence des deux appareils
8. Suppressions croisées : tombstones, la ligne créée par B survit au push de A
9. Round-trip des champs (`projetId`, `details`)
10. Isolation par compte (RLS)
11. Compteurs fusionnés par max()
12. Reprise de session au reload
13. « Continuer sans cloud »
14–15. Diagnostics (schéma manquant, config vide, URL invalide)

Plus : `node --check` sur tout le JS, parseur PostgreSQL (pglast) sur `schema.sql` (26 statements OK), captures d'écran de non-régression du dashboard en mode local.

**QA manuelle, pas à pas :**
1. `cd tests && npm install && npm run build:vendor && npm test` → attendu : `49 ✓ / 0 ✗`.
2. Ouvrir l'app avec config vide → rien ne change (pas d'écran cloud, pas d'indicateur ☁).
3. Créer un projet supabase.com, exécuter `supabase/schema.sql` (SQL Editor → Run), remplir `gestion/supabase-config.js`.
4. Ouvrir l'app → écran THE'Y CLOUD → « Créer le compte » → confirmer l'email → se connecter. Vérifier le toast « ☁️ Sync cloud activée » et l'indicateur « ☁ sync ✓ ».
5. Ouvrir l'app sur un deuxième appareil, se connecter → les données apparaissent.
6. Couper le réseau, ajouter un client → indicateur « ☁ en attente… » ; rétablir le réseau → « ☁ sync ✓ » et le client apparaît sur l'autre appareil.
7. Tester le diagnostic : mettre une mauvaise clé dans la config → clic sur ☁ → le panneau explique exactement quoi corriger.

## Alternatives

### A. Supabase Realtime (WebSocket) au lieu du pull périodique

| Pour | Contre |
|---|---|
| Propagation instantanée entre appareils | Complexité nettement supérieure (canaux, reconnexions, dédoublonnage des propres échos) |
| Pas besoin du pull sur visibilitychange | Ne résout ni les conflits ni les suppressions — il faudrait quand même tout le moteur LWW/tombstones |
| | Consommation de connexions persistantes (quota du plan gratuit) |

Le pull sur `online`/`visibilitychange`/boot couvre l'usage réel (un designer, 2–3 appareils) sans cette complexité. Realtime pourra s'ajouter par-dessus ce moteur plus tard.

### B. Tombstones explicites en base (colonne `deleted_at`) au lieu du diff baseIds

| Pour | Contre |
|---|---|
| Résout la limite « delete vs edit » (on peut comparer date de suppression et date d'édition) | Schéma plus lourd : toutes les requêtes doivent filtrer `deleted_at is null` |
| Historique de suppressions auditable | Purge périodique nécessaire (les lignes ne disparaissent jamais vraiment) |
| | Migration plus risquée pour un gain marginal à cette échelle |

## Suggested people to talk to

L'historique git du dépôt ne contient qu'un seul auteur — **THE'Y STUDIO** (vous) — qui a écrit les Sprints 01 à 11, y compris le pilote cloud et le schéma SQL remplacés ici. Il n'y a donc pas d'autre personne ayant du contexte sur ce code. Si vous souhaitez une revue externe, les zones qui méritent le plus un deuxième regard sont le merge LWW de `cloudPull()` et la logique baseIds de `cloudPush()`.

## Quiz

<details>
<summary>1. Deux appareils modifient le même client hors ligne : A à 14h00, B à 14h05. A se reconnecte et pousse en premier. Quel est l'état final partout ?</summary>

**La version de B (14h05) gagne partout.**

- ✅ Correct : quand B se reconnecte, son pull-merge compare `updatedAt` ligne par ligne ; sa version locale (14h05) est plus récente que celle du cloud (14h00), donc il la garde et la pousse. A la récupère à son prochain pull. C'est le last-write-wins par ligne.
- ❌ « A gagne parce qu'il a poussé en premier » : faux — l'ordre d'arrivée ne compte pas, seul l'horodatage de la modification compte.
- ❌ « Les deux versions sont fusionnées champ par champ » : faux — la granularité est la ligne, pas le champ.
</details>

<details>
<summary>2. Pourquoi le push du Sprint 11 pouvait-il effacer des données, et comment le Sprint 12 l'empêche-t-il ?</summary>

**Sprint 11 supprimait toutes les lignes du cloud absentes en local (`not.in`) ; Sprint 12 ne supprime que le diff `baseIds − local`.**

- ✅ Correct : avec `not.in`, un appareil à l'état périmé effaçait les lignes créées entre-temps par un autre. Avec baseIds (les ids connus du cloud au dernier sync), une ligne inconnue apparue au cloud est adoptée, jamais supprimée ; seules les lignes que CET appareil connaissait et a lui-même supprimées sont retirées.
- ❌ « Sprint 12 interdit les suppressions distantes » : faux — les suppressions se propagent bien, mais uniquement les intentionnelles.
</details>

<details>
<summary>3. L'utilisateur ajoute un paiement dans le train, sans réseau. Que se passe-t-il exactement ?</summary>

**Sauvegarde locale immédiate, `dirty=true` persisté, push rejoué automatiquement au retour du réseau.**

- ✅ Correct : `save()` écrit dans LocalStorage (l'app fonctionne normalement), `cloudOnSave()` lève le flag `dirty` persistant, le push échoue silencieusement (statut « ☁ en attente… »). L'event `online` — ou le retour sur l'onglet, ou le prochain boot — rejoue le push.
- ❌ « Le paiement est perdu si l'onglet est fermé avant le retour du réseau » : faux — `dirty` est dans LocalStorage, le boot suivant resynchronise.
- ❌ « L'app bloque avec une erreur réseau » : faux — offline-first : le cloud n'est jamais sur le chemin critique.
</details>

<details>
<summary>4. Pourquoi avoir modifié le trigger SQL `touch_updated_at` ?</summary>

**Parce que l'ancien trigger écrasait l'horodatage client avec `now()`, cassant le LWW.**

- ✅ Correct : pour comparer « qui a modifié en dernier », le cloud doit conserver l'`updatedAt` posé par l'appareil au moment de la modification (potentiellement hors ligne, bien avant le push). Le nouveau trigger ne met `now()` que si le client n'a pas changé la valeur (édition directe dans le dashboard Supabase).
- ❌ « Pour des raisons de performance » : faux.
- ❌ « Le trigger a été supprimé » : faux — il reste utile pour les éditions manuelles en base.
</details>

<details>
<summary>5. Comment la suite de tests utilise-t-elle le « vrai » client Supabase sans réseau ?</summary>

**Le bundle ESM officiel de supabase-js est servi localement à la place du CDN, pointé vers un mock GoTrue+PostgREST en node.**

- ✅ Correct : Playwright intercepte la requête vers `cdn.jsdelivr.net/.../supabase-js` et sert un bundle esbuild local du vrai paquet npm ; `supabase-config.js` est intercepté pour pointer vers `mock-supabase.js`, qui parle les vrais protocoles (signup/token/upsert `merge-duplicates`/delete `in.(...)`) avec isolation par utilisateur. On teste donc le vrai code client de bout en bout.
- ❌ « Les appels Supabase sont stubbés en JS dans la page » : faux — le trafic HTTP réel du vrai client est exercé.
- ❌ « Les tests nécessitent un projet Supabase de staging » : faux — tout est local et hermétique.
</details>
