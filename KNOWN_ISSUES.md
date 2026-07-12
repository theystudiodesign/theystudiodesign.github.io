# KNOWN ISSUES / DETTE TECHNIQUE

1. Fichier unique en croissance — découpage en modules à prévoir au-delà de ~2 500 lignes.
2. Détection "En retard" basée sur `date` du paiement (pas de champ `échéance` dédié) — heuristique assumée.
3. `renderAll()` re-rend tout — acceptable < quelques centaines d'enregistrements.
4. Images facture en base64 consomment le quota LocalStorage partagé.
5. Backup manuel uniquement (rappel 7 jours en place) — auto-backup au backlog.
