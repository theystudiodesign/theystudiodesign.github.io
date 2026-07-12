# ARCHITECTURE

- **Type** : SPA offline-first, un seul fichier `gestion/index.html` (~1 200 lignes), zéro dépendance.
- **Données** : LocalStorage, clé unique `crm_gestion_clients_v1` → `DB = {clients, projets, taches, paiements, factureCounter, blCounter}`.
  Images facture (logos/cachet) : clés séparées `they_fact_ae`, `they_fact_logo`, `they_fact_stamp` (base64).
- **Couche données** : uniquement `load()` / `save()` — point d'entrée unique pour la future migration Supabase.
- **Rendering** : `renderAll()` global (dette acceptée à cette échelle ; optimisation ciblée prévue en Phase 1 #8).
- **PWA** : `sw.js` — network-first pour HTML, cache-first pour assets. Bump de version obligatoire à chaque release.
- **Sécurité** : PIN client-side (SHA-256, dissuasif seulement — pas une vraie auth), `esc()` sur toute sortie, try/catch sur storage/JSON.
- **Hébergement** : GitHub Pages + domaine theystudiodesign.com (CNAME).

## Limites structurelles (→ Phase 2 uniquement)
Auth réelle, multi-user, fichiers lourds (quota ~5MB), paiements Stripe : impossibles côté client. Ne jamais simuler.
