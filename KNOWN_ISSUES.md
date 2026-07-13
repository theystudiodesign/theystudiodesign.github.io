# KNOWN ISSUES / DETTE TECHNIQUE

0. [RÉSOLU — HOTFIX 13/07] seed() écrasait les données réelles au 2e chargement (else mal rattaché introduit Sprint 04). Leçon: tout patch touchant load()/save() exige désormais un test d intégration complet de load(), pas seulement un test syntaxique.

1. Fichier unique en croissance (~1 550 lignes après Sprint 04) — découpage en modules à prévoir au-delà de ~2 500 lignes.
2. Détection "En retard" basée sur `date` du paiement (pas de champ `échéance` dédié) — heuristique assumée.
3. `renderAll()` re-rend tout — acceptable < quelques centaines d'enregistrements.
4. Images facture en base64 consomment le quota LocalStorage partagé.
5. ~~Backup manuel uniquement~~ Résolu Sprint 09 : snapshots quotidiens + backup fichier hebdo automatique. Les snapshots doublent l usage LocalStorage (surveillé, best-effort).
