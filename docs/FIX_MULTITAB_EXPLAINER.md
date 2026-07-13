# Fix critique — Persistance multi-instance (onglets/PWA simultanés) · Explainer

## Background

L'app garde tout son état dans **une variable mémoire par onglet** (`DB`), synchronisée avec un
**storage partagé** (`localStorage`, clé unique) et, côté cloud, un état de sync partagé
(`they_sync_v1.baseIds`). L'audit (docs/AUDIT_MULTITAB_PERSISTENCE.md) a prouvé que deux
instances ouvertes (deuxième onglet, fenêtre PWA installée) se marchaient dessus : le premier
`save()` d'une instance périmée réécrivait TOUT le storage avec sa photo passée — suppressions
ressuscitées, créations effacées — puis poussait cet état au cloud, où le diff
`baseIds(partagé, à jour) − mémoire(périmée)` **supprimait même les créations des autres**.
Reproduit à l'identique sur v29 : pré-existant, pas une régression.

## Intuition

> 💡 **On ne répare pas en interdisant les onglets multiples ; on répare en appliquant au
> DISQUE la même diplomatie qu'au cloud.** Le moteur LWW + tombstones existe déjà pour
> réconcilier deux appareils ; le bug venait de ce que deux *onglets* ne l'utilisaient pas
> entre eux. Le fix étend cette mécanique au niveau local, sans rien redessiner.

La pièce manquante : distinguer, quand une ligne est absente du disque mais présente en
mémoire, « *je viens de la créer* » (→ garder) de « *un autre onglet l'a supprimée* »
(→ respecter). Réponse : `DISK_KNOWN`, l'ensemble des ids **vus sur le disque au dernier point
de synchro de CET onglet** — l'équivalent local de `baseIds`.

**Exemple jouet** : onglet 1 connaît {A, B} ; onglet 2 supprime B et crée C (disque = {A, C}).
Onglet 1 sauvegarde une note sur A : `mergeFromDisk()` voit C (inconnu de DISK_KNOWN → adopté),
ne voit plus B (connu → supprimé ailleurs → respecté), garde sa note (updatedAt plus récent).
Écriture : {A(note), C}. Rien n'est perdu, rien ne ressuscite.

## Code (3 pièces, ~60 lignes)

### 1. Relire-avant-d'écrire — `mergeFromDisk()` + `DISK_KNOWN`

```js
(disk[ent]||[]).forEach(d=>{
  const m=mem.get(d.id);
  if(!m){ if(known.has(d.id))return;   // je le connaissais et JE l'ai supprimé → reste supprimé
          merged.push(d); return; }     // ligne d'une autre instance → adoptée
  mem.delete(d.id);
  if((m.updatedAt||'')>(d.updatedAt||''))merged.push(m); else merged.push(d);  // LWW
});
mem.forEach(m=>{ if(known.has(m.id))return;  // absent du disque mais connu = supprimé ailleurs
                 merged.push(m); });          // création locale pas encore écrite
```

Appelé par `save()` — **après `cloudStamp()`** : une édition fraîche doit porter son
`updatedAt` neuf AVANT le duel LWW contre le disque (l'inversion de cet ordre a été attrapée
par le test [7] pendant le développement) — et par `cloudPull()` (partir du disque le plus
frais avant le merge distant). `snapshotKnown()` fige le nouveau point de synchro après chaque
écriture réussie (save, pull, boot). Les lignes adoptées du disque mettent à jour `Cloud.sig`
pour ne pas être re-stampées (leur `updatedAt` d'origine est la vérité).

### 2. Sync storage active

```js
window.addEventListener('storage',e=>{
  if(e.key!==KEY||e.newValue==null)return;
  const disk=mergeFromDisk(); DataLayer.normalize(DB);
  if(disk)snapshotKnown(disk);           // point de synchro = le DISQUE (pas la mémoire,
  invalidateCaches();renderAll();         //  qui peut contenir des créations pas encore écrites)
});
```

L'écriture d'un autre onglet est adoptée en direct — l'utilisateur voit les deux fenêtres
converger. (Le listener TRACE existant reste en place, hors périmètre.)

### 3. `online` : pull avant push — **nécessité démontrée par test**

Protocole exigé : le test [21.c] (2 appareils, Y offline+dirty pendant que X supprime un client
et pousse) a d'abord été exécuté **avec l'ancien handler** (`online → cloudPush(true)`) :
**2 échecs** — le client supprimé était ressuscité au cloud par l'upsert de la mémoire périmée
de Y. Le handler passe à `cloudPull()` (qui se termine déjà par un `cloudPush` si `dirty` →
l'édition offline de Y est bien poussée : offline-first intact). Une **garde de réentrance**
(`Cloud.pulling`) sérialise les pulls co-déclenchés (online + visibilitychange) — testé [21.d].

## Ce qui est préservé (exigences)

LWW (réutilisé, pas dupliqué) · `baseIds` · tombstones cloud · mécanique push/debounce ·
offline-first (témoins [B] et [21.c/d/e]) · zéro changement de schéma ou d'architecture —
la suite existante (98) passe inchangée.

## Verification

- **Suite complète : 112 ✓ / 0 ✗** (98 existants + 14 nouveaux, scénario [21]).
- **Reproduction d'audit** `tests/repro-persistence.js` : avant fix 6/6 « REPRODUIT » →
  après fix **6/6 « non reproduit »** (2 onglets local, 2 onglets cloud, refresh).
- Matrice exigée : deux onglets ✓ · PWA installée + onglet (même storage, même mécanique,
  couvert par les tests 2-pages même contexte) ✓ · deux appareils ✓ · offline→online ✓.
- `node --check` OK · SW v34.

**QA manuelle** : ouvrir l'app dans deux fenêtres côte à côte → créer/supprimer dans l'une →
l'autre se met à jour seule ; éditer ensuite dans la seconde → rien ne ressuscite, rien ne
disparaît ; couper le réseau, éditer, revenir en ligne → converge sans résurrection.

## Alternatives (écartées)

**Verrou mono-instance** (BroadcastChannel) : plus simple mais dégrade l'usage (2 écrans).
**SharedWorker propriétaire de l'état** : redesign d'architecture, interdit par la consigne.

## Suggested people to talk to

Mono-propriétaire (THE'Y STUDIO : moteur sync ; ELFASSI Karima : campagne TRACE v25–v29 qui
chassait exactement ces symptômes — le listener `[TRACE-AUTRE-ONGLET]` en production peut
confirmer les occurrences passées).

## Quiz

<details><summary>1. Pourquoi `cloudStamp()` doit-il précéder `mergeFromDisk()` dans `save()` ?</summary>
Une ligne éditée porte encore son ANCIEN `updatedAt` avant le stamp. Si le merge disque a lieu
d'abord, le duel LWW se joue à égalité → le disque gagne → l'édition de l'utilisateur est
silencieusement annulée. Le test [7] (conflits) a détecté cette inversion pendant le développement.
</details>
<details><summary>2. Comment distingue-t-on « création locale » de « supprimé par un autre onglet » ?</summary>
Par `DISK_KNOWN` : les ids vus sur le disque au dernier point de synchro de CET onglet.
Absent du disque + inconnu = ma création (garder) ; absent + connu = supprimé ailleurs (respecter).
C'est le pattern `baseIds` appliqué localement.
</details>
<details><summary>3. Pourquoi le handler storage fige-t-il le point de synchro sur le DISQUE et non sur la mémoire ?</summary>
Après merge, la mémoire peut contenir des créations locales pas encore écrites. Les inclure dans
`DISK_KNOWN` ferait croire, au prochain save, qu'elles ont été « supprimées ailleurs » → perte.
</details>
<details><summary>4. En quoi le changement du handler `online` préserve-t-il l'offline-first ?</summary>
`cloudPull()` se termine par `cloudPush(true)` dès que `pending` (qui inclut `st.dirty`) est
vrai : le travail hors ligne est poussé dans le même cycle, juste APRÈS avoir intégré l'état
distant — testé [21.c] (l'édition offline arrive au cloud, `dirty=false`).
</details>
<details><summary>5. Deux onglets éditent la même ligne à la même milliseconde. Qui gagne ?</summary>
Le duel LWW `>` (strict) fait gagner le disque à égalité — donc le premier écrivain. C'est le
même arbitrage que côté cloud (le distant gagne les égalités) : déterministe et cohérent.
</details>
