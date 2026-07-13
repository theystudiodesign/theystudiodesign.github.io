# CHANGELOG — THE'Y STUDIO DESIGN · Gestion

## 2026-07-13 (9) — HOTFIX CRITIQUE
- **Bug critique corrigé** : depuis Sprint 04, un else mal rattaché dans load() faisait exécuter seed() (données de démonstration) au 2e chargement, ÉCRASANT les données réelles. Corrigé + tests d'intégration ajoutés (données existantes préservées, seed uniquement au premier lancement). Si des données ont été perdues : restaurer via Import JSON du dernier export, ou via Restore (snapshots).

## 2026-07-13 (8) — Sprint 09
- **Auto Backup & Restore** : snapshot local quotidien avec rotation (2 max, best-effort protégé quota), backup fichier hebdomadaire automatique au chargement (toast), bouton Restore sidebar → liste des snapshots avec contenu résumé + restauration avec confirmation. Bannière backup conservée en fallback.

## 2026-07-13 (7) — Sprint 08
- **Performance** : rendering ciblé — seul l'onglet visible est re-rendu (map RENDERERS + currentTab), au lieu des 6 pages à chaque modification. Le changement d'onglet rend la page fraîche via go(). LocalStorage inchangé (déjà 1 lecture au boot / 1 écriture par save).

## 2026-07-13 (6) — Sprint 07
- **CRM avancé** : champs Société / Website / Adresse sur la fiche client (rétro-compatibles, inclus dans la recherche). Bouton 👁 → fiche client complète en panneau latéral : profil, totaux encaissé/en attente par devise, historique cliquable (projets, 8 derniers paiements, tâches ouvertes, événements), accès direct à la modification.

## 2026-07-13 (5) — Sprint 06
- **Rapports** : bouton sidebar → modal période (mois / mois précédent / année / tout) + type. Exports CSV (paiements avec n° facture/BL, clients avec total payé, projets avec payé vs prix) — utilitaires réutilisables toCSV (RFC4180 + BOM Excel) et downloadFile. Rapport revenus PDF (par client + totaux par devise) via l'overlay d'impression existant.

## 2026-07-13 (4) — Sprint 05
- **Notification Center** : cloche topbar avec badge, panneau des alertes (retards en ●, échéances ≤3 jours en ○, rappel backup), clic ouvre l'élément concerné, toast au chargement si nouvelles alertes. Dérivé du data provider calendrier (zéro duplication).

## 2026-07-13 (3) — Sprint 04
- **Smart Calendar** : vues Mois/Semaine (grille CSS native, semaine commençant lundi), navigation ‹ › / Aujourd'hui / saut mois+année, panneau latéral du jour (bottom sheet sur mobile, dots au lieu de chips sur petits écrans), événements en retard en rouge.
- **Nouvelle entité `DB.events`** (réunions, livraisons, rappels, personnel) : CRUD complet, init auto rétro-compatible, incluse dans Import/Export et dans la recherche globale.
- **Data Provider `getCalendarEvents(from,to)`** : seule couche lisant DB (projets+tâches+paiements+events), cache avec clé de plage — prêt pour Supabase.
- **`invalidateCaches()`** : invalidation générique (Search + Calendar), remplace searchInvalidate (alias rétro-compat conservé).
- Filtres : catégories (chips), statut, client.

## 2026-07-13 (2)
- **Global Search (Ctrl+K / Cmd+K)** : recherche instantanée sur clients, projets, tâches, paiements (y compris notes, ICE, n° facture/BL, montants). Index en mémoire invalidé via hook `save()` (zéro lecture LocalStorage supplémentaire). Navigation clavier (↑↓/Entrée/Échap), surlignage des correspondances, recherches récentes (8 max), catégories, états vide/sans-résultat, bouton 🔍 topbar (mobile), accent-folding ("cafe" trouve "café"). Zéro dépendance.
- Fix pré-release : câblage paresseux des listeners (l'overlay est après le script dans le DOM).

## 2026-07-13
- **Dashboard 2.0** : 4 nouveaux KPIs (Aujourd'hui, Cette année, En retard, Valeur moy./projet) + compteur projets terminés.
- **Revenue Chart** : graphique 12 mois en SVG natif (zéro dépendance), multi-devises (2 max, légende auto), compatible dark mode, tooltips natifs.

## 2026-07-12
- **Facture officielle Auto-Entrepreneur** : taxe AE 1%, Total TTC, montant en lettres (FR), RIB/IF/ICE/Taxe pro, 3 slots images (logo AE, logo THE'Y, cachet), numéro éditable (clic).
- **Bon de livraison** : numérotation BL séparée, colonne Qté/Observation, cadre signature client.
- **Champ ICE** ajouté à la fiche client.
- **Corrections** : impression page vide hors facture, slots vides masqués en print, format A4, "et XX centimes", touche Échap, protection données corrompues / dates invalides / quota localStorage.
- **Service Worker v8+** : network-first pour le HTML — les mises à jour arrivent sans vider le cache.
- **PIN fixe** (hash SHA-256) remplaçant le premier-code-devient-PIN.
- **Rappel backup** : bannière si aucun export depuis 7 jours.
