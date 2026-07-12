# CHANGELOG — THE'Y STUDIO DESIGN · Gestion

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
