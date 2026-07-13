# AUDIT — Bug de persistance « clients qui reviennent / créations qui disparaissent »

> **Statut : CORRIGÉ** — fix minimal approuvé et implémenté (voir CHANGELOG 21) : relire-avant-d'écrire (`mergeFromDisk` + `DISK_KNOWN`), sync storage active, `online` pull→push (nécessité démontrée par test [21.c]). `tests/repro-persistence.js` : 6/6 « non reproduit ».
> Reproduction exécutable : `tests/repro-persistence.js` (scénarios A–D).

## 1 · Reproduction

| Scénario | Résultat |
|---|---|
| **[A]** 1 onglet, local — create/delete + reload | ✅ SAIN |
| **[B]** 1 onglet, cloud — create/delete + reload, y compris **pendant la fenêtre de debounce 1.5s** | ✅ SAIN (le flag `dirty` rattrape le push au boot) |
| **[C]** **2 onglets ouverts simultanément** (même navigateur), mode local | 🔴 **4/4 symptômes reproduits** |
| **[D]** 2 onglets + cloud | 🔴 reproduits + **amplification cloud** : le supprimé est ressuscité AU CLOUD et la création est SUPPRIMÉE du cloud |
| **[C] rejoué sur v29** (commit `2d69f29`, avant Sprints 17–19) | 🔴 **identique** |

## 2 · Verdict sur les fonctions suspectées

| Fonction | Verdict |
|---|---|
| `save()` / `DataLayer.write()` / `load()` / `normalize()` / `sweepOrphans()` / `cloudPull()` / `cloudBoot()` / render | **Toutes correctes en mono-instance** (scénarios témoins A/B : 8 ✓, + les 98 tests de la suite) |
| **Architecture multi-instance** | 🔴 **Coupable** — voir §4 |

**Ce n'est PAS une régression des Sprints 17–19** : reproduction identique sur v29. C'est la même classe de symptômes que la campagne de diagnostic v25–v29 (« clients qui reviennent ») — le listener `[TRACE-AUTRE-ONGLET]` (toujours actif en production, `gestion/index.html:2262`) a été posé précisément pour la détecter.

## 3 · Trace d'exécution complète (scénario reproduit)

```
        ONGLET 2 (l'utilisateur travaille)                ONGLET 1 (PWA/onglet oublié, ouvert avant)
        ─────────────────────────────────                 ──────────────────────────────────────────
t0      boot → load() → DB₂ = {A, B}  ← localStorage →    boot → load() → DB₁ = {A, B}   (copie MÉMOIRE)
t1      delClient(B)  → DB₂ = {A}
        save() → sweepOrphans ✓ → cloudStamp
              → DataLayer.write(DB₂)      ────────────►   localStorage = {A}          ✓ correct
              → cloudOnSave → push (1.5s) ────────────►   cloud = {A}                 ✓ correct
                                                          they_sync_v1.baseIds = [A]  (PARTAGÉ, à jour)
t2      addClient(C) → DB₂ = {A, C}
        save() → write → localStorage = {A, C}  ✓         (DB₁ en mémoire = TOUJOURS {A, B} — aucun
        push → cloud = {A, C}, baseIds = [A, C] ✓          mécanisme ne l'invalide : l'event `storage`
                                                           ne fait qu'un console.warn TRACE)
t3                                                        l'utilisateur revient dans l'onglet 1 et fait
                                                          N'IMPORTE QUEL save() (éditer une note…)
                                                          save() → DataLayer.write(DB₁ = {A, B})
                                                          ────► localStorage = {A, B}
                                                                = B RESSUSCITÉ, C EFFACÉ   🔴 symptômes 1·2·3
t4                                                        cloudPush : upsert {A, B}  → B ressuscité au cloud
                                                          dead = baseIds − local = [A,C] − [A,B] = [C]
                                                          → DELETE C au cloud            🔴 amplification
t5      refresh → load() → localStorage {A, B}
        cloudPull → cloud {A, B} → rien à corriger
        render() → l'utilisateur voit B revenu, C disparu                                 🔴 symptôme 4
```

Le pull sur `visibilitychange` (onglet 1 refocalisé) *peut* réparer avant le save — c'est la
course qui explique le « **sometimes** » : si le save de l'onglet périmé part avant/à la place
du pull (mode local : aucun pull n'existe), l'état périmé gagne.

## 4 · Lignes exactes en cause (`gestion/index.html`, main @ `300ee9d`)

| Ligne | Code | Rôle dans le bug |
|---|---|---|
| **1108** | `localStorage.setItem(KEY,JSON.stringify(db))` (`DataLayer.write`) | Écriture **inconditionnelle de TOUT l'état depuis la mémoire de L'ONGLET** — dernier-écrivain-gagnant à la granularité de l'onglet, sans vérification de fraîcheur |
| **963** | `const dead=(s.baseIds[ent]\|\|[]).filter(id=>!localIds.has(id))` (`cloudPush`) | `baseIds` est lu du **storage partagé** (à jour) mais `localIds` vient de la **mémoire périmée** de l'onglet → le diff **supprime au cloud les créations des autres instances** |
| **2262** | `window.addEventListener('storage', …console.warn…)` | La détection existe mais est **passive** (TRACE) : aucune resynchronisation de `DB` quand un autre onglet écrit |
| (aggravant) **859** | `window.addEventListener('online', … cloudPush(true))` | Push **sans pull préalable** — même mécanique de résurrection entre deux *appareils* |

## 5 · Root cause

**`DB` est un état mutable par-onglet, mais `localStorage` (données) et `they_sync_v1` (baseIds)
sont partagés entre toutes les instances.** Toute instance dont la mémoire est périmée — deuxième
onglet, fenêtre PWA installée restée ouverte, app rouverte après veille — réécrit l'intégralité
du storage avec sa photo passée au premier `save()`, puis la pousse au cloud. Comme `baseIds`
(partagé) est plus récent que sa mémoire, le diff de suppression efface même, au cloud, les
lignes créées par l'instance à jour. Aucun chemin (storage event, boot, save) ne réconcilie la
mémoire d'un onglet avec le storage avant écriture.

Confirmation possible en production : ouvrir la console → chercher les warns
`[TRACE-AUTRE-ONGLET] ⚠️ crm_gestion_clients_v1 vient d'être RÉÉCRIT PAR UN AUTRE ONGLET`.

## 6 · Pistes de fix (à discuter — RIEN d'implémenté)

1. **Relire avant d'écrire** *(chirurgical)* : `save()` re-merge `DB` avec l'état du storage
   (par `updatedAt` ligne à ligne, en réutilisant la mécanique LWW existante) avant `write` —
   un onglet périmé ne peut plus écraser ce qu'il ne connaît pas. + compteur de version
   (`they_rev`) pour détecter l'écriture concurrente.
2. **Storage event actif** *(complément)* : sur `storage` (clé DB), recharger `DB` +
   `invalidateCaches()` + `renderAll()` au lieu du simple warn TRACE.
3. **Verrou d'instance** *(alternative simple)* : une seule instance active (`BroadcastChannel`
   /heartbeat) ; les autres passent en lecture seule avec bandeau « ouvert ailleurs ».
4. **`online` → pull puis push** *(corollaire cloud)* : éliminer la résurrection inter-appareils.

Recommandation : **1 + 2 + 4** (aucun changement de schéma, réutilise le LWW existant, testable
avec le harnais multi-onglets déjà écrit). L'option 3 est plus simple mais dégrade l'usage.


---

# ADDENDUM (audit 2) — « le bug persiste en production » : diagnostic complet

## Fait n°1 — la production n'a PAS le fix
`theystudiodesign.com/gestion/` sert **v33** (`__BUILD='v33'`, zéro occurrence de `mergeFromDisk`) :
la PR #19 n'est **pas mergée** (consigne « do not merge »). La reproduction en production est donc
attendue — c'est le build audité, pas le build corrigé. Vérifié par `tests/repro-mixed-version.js` :
- **[P1]** build v33, **1 seul onglet** : create/refresh et delete/refresh **SAINS** → le scénario
  rapporté implique nécessairement une **2ᵉ instance** (fenêtre PWA installée restée ouverte,
  autre onglet, autre fenêtre). Confirmation côté production : console → warns `[TRACE-AUTRE-ONGLET]`.
- **[P2]** build v33, 2 instances : 🔴 reproduit (l'état actuel de la prod).

## Fait n°2 — LE STALE WRITE RESTANT (même après déploiement du fix)
**[P3] build MIXTE** : onglet corrigé (v34) + instance **v33 jamais rechargée** (même origine →
même localStorage). Une fenêtre PWA ouverte depuis avant le déploiement **garde l'ancien code en
mémoire** (le SW network-first ne met à jour qu'à la navigation). Résultat : 🔴 5/5 reproduit.

### Trace d'exécution exacte
```
ONGLET CORRIGÉ (v34)                                INSTANCE v33 (PWA restée ouverte)
────────────────────                                ─────────────────────────────────
load() → DB={A,B} → snapshotKnown: KNOWN={A,B}      load() → DB₃₃={A,B}  (copie mémoire)
create C → save():
  cloudStamp → mergeFromDisk(disk={A,B}: rien à
  adopter) → write({A,B,C}) → KNOWN={A,B,C}
delete B → save(): … write({A,C}) → KNOWN={A,C}
                                                    save() anodin (v33: AUCUN mergeFromDisk)
                                                    → DataLayer.write(DB₃₃={A,B})   ◄── LE STALE WRITE
                                                      localStorage = {A,B}  (B ressuscité, C effacé)
event 'storage' → handler du fix:
  mergeFromDisk():
    disk B: absent de mémoire, B ∉ KNOWN({A,C})
      → branche « inconnu → adopté »  → B RESSUSCITÉ EN MÉMOIRE          🔴
    mémoire C: absent du disque, C ∈ KNOWN
      → branche « connu+absent = supprimé ailleurs » → C ABANDONNÉ        🔴
  snapshotKnown(disk={A,B}) → KNOWN={A,B}
refresh → load({A,B}) → render : B revenu, C disparu — MALGRÉ le fix     🔴
```

### Cause exacte
Le fix protège les instances **qui l'exécutent**. Une instance à l'ancien code écrit toujours
inconditionnellement (`DataLayer.write`, v33 L.1108) ; et l'onglet corrigé, ne pouvant pas
distinguer « suppression légitime par un autre onglet corrigé » d'un « écrasement par un
ancien build », **se rend** : `mergeFromDisk` adopte la résurrection (branche inconnu→adopté)
et honore la fausse suppression (branche connu+absent). Lignes en cause dans le build corrigé :
les deux branches de `mergeFromDisk` + `snapshotKnown(disk)` du handler `storage`.

## Piste de complément (À APPROUVER — rien d'implémenté)
Marquer chaque écriture du nouveau code d'un **jeton de génération** (`they_writer = {rev:n+1, build}`
écrit dans la même transaction que la clé DB). À l'event `storage` / au `mergeFromDisk` :
- si le disque a été écrit **sans progression du jeton** (ancien build) → écriture SUSPECTE :
  ne pas honorer les suppressions, re-fusionner en union+LWW et **réécrire immédiatement**
  l'état sain (l'onglet corrigé reprend la main) ;
- si le jeton a progressé (autre instance corrigée) → comportement actuel (tombstones respectés).
Les instances v33 disparaissent d'elles-mêmes au premier rechargement (SW network-first) —
le jeton n'est qu'un sas de transition, sans changement de schéma des données.
