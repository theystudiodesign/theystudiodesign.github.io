# UI INVENTORY — audit complet (Sprint 18)

> Captures systématiques : [`docs/design-audit/`](design-audit/) — 65 vues (6 onglets + vue semaine × desktop 1440 / tablet 834 / mobile 390 × light/dark, + 11 overlays × 2 thèmes + lock screen).
> Convention de nommage : `{viewport}-{theme}-{écran}.jpg` / `overlay-{theme}-{nom}.jpg`.

## 1 · Écrans (7)

| Écran | Composants | Captures |
|---|---|---|
| **Dashboard** | 8 stat-cards KPI, chart SVG 12 mois, 4 cards listes (tâches, paiements, dus, projets+progress), boutons inline "Salit ✓ / Tkhelless ✓" | `*-dash` |
| **Clients** | Filtres chips + recherche, table (avatar, badges type/statut, compteur tâches, 3 icon-btns) | `*-clients` |
| **Tâches** | Chips statut + select client, table (checkbox toggle, priorité emoji, deadline + ⚠, strikethrough done) | `*-taches` |
| **Projets** | Chips statut, table (prix/payé, badges) | `*-projets` |
| **Paiements** | Chips statut, table (5 icon-btns par ligne : ✓ 🧾 📦 ✏️ 🗑️) | `*-paiements` |
| **Calendrier** | Toolbar (nav ‹ › / Aujourd'hui / selects mois+année / toggle Mois-Semaine), chips catégories + 2 selects, grille 7×6 (chips desktop / dots mobile), colonnes semaine | `*-calendrier`, `*-calendrier-semaine` |
| **Landing** (`/index.html`) | Logo, "Coming soon", CTA WhatsApp — placeholder | — |

## 2 · Overlays & surfaces (12)

| Surface | Notes | Capture |
|---|---|---|
| Modal Client | 2 colonnes, 13 champs, hint | `overlay-*-modal-client` |
| Modal Paiement / Événement / Rapports / Restore | grilles 1–2 col | `overlay-*-modal-*` |
| Palette recherche Ctrl+K | catégories, sélection inversée, mark souligné, footer raccourcis | `overlay-*-search` |
| Panneau notifications | items ●/○, badge compteur | `overlay-*-notifications` |
| Fiche client (panneau latéral) | profil + totaux + 4 sections historique cliquables | `overlay-*-fiche-client` |
| Day panel calendrier | latéral desktop / bottom-sheet mobile | `overlay-*-day-panel` |
| Facture / Bon de livraison | document A4 print, slots images cliquables | `overlay-*-facture`, `overlay-*-bon-livraison` |
| Lock screen PIN | plein écran noir, logo | `overlay-lockscreen` |
| Toast · Bannière backup · Indicateur ☁ · Auth gate cloud · Diagnostic cloud | états système | (toast visible sur certaines captures) |

## 3 · Composants récurrents (→ catalogue design-system.html)

`btn-primary/ghost/sm` · `icon-btn` · `badge` (13 variantes `bg-*`) · `chip(.on)` · `search` · `card(+h3 filet)` · `stat` · `table/t-name/t-sub/avatar/cell-flex/row-acts` · `progress` · `frm/fld/hint` · `overlay/modal/acts` · `toast` · `empty` · `cal-*` (9 classes) · `nf-item(.late/.soon)` · `sr-item(.sel)/mark` · `dp-ev` · facture `f-*` (18 classes).

## 4 · Incohérences relevées (backlog phase redesign — NE PAS corriger en passant)

| # | Incohérence | Détail | Impact |
|---|---|---|---|
| I-1 | `--muted` vs `--mut` | ~25 règles calendrier/notifs/recherche référencent `var(--muted)` **qui n'existe pas** → la propriété est invalide et la couleur héritée. Fallbacks présents parfois (`var(--muted,#9A9A96)`), parfois non | Gris incohérents selon le composant |
| I-2 | « Rouge » = noir | `--rouge:#111110` ; `.cal-ev.late` et `#notifBadge` gardent des fallbacks `#C0392B` jamais atteints ; en dark mode les marqueurs retard sont quasi invisibles | Alerte illisible en dark |
| I-3 | Icônes hybrides | Glyphes texte (nav) + emojis (actions) : rendu OS-dépendant, pas de contrôle de couleur | Non premium |
| I-4 | `btn-danger` = `btn-ghost` | Aucune sémantique destructive (suppression = même style que Annuler) | UX risquée |
| I-5 | Tables mobile | `min-width:560px` + scroll horizontal dans `.card` — pattern à revoir (cartes empilées ?) | Ergonomie mobile |
| I-6 | Valeurs hors échelle | Tailles 12.5 / 11.5 / 10.5 / 13px et radius 5/6/7/9px éparpillés hors tokens | Dette de migration |
| I-7 | États manquants | `disabled` et `loading` non définis (nécessaires pour actions cloud) | Gap design system |
| I-8 | Dashboard dense | 8 KPI + 5 cards empilées sans hiérarchie de lecture claire ; `font-size` inline conditionnel (`length>14?'17px':'26px'`) | → roadmap redesign |
| I-9 | Modal Client | 13 champs d'un bloc, pas de groupement (identité / contact / facturation / notes) | Charge cognitive |
| I-10 | Accessibilité | Icon-btns sans `aria-label` systématique, contrastes gris à vérifier (AA), focus visible non uniforme | À auditer en redesign |

## 5 · Points forts à préserver

- Identité monochrome forte et différenciante (rare dans les CRM).
- Densité d'information excellente sur desktop.
- Dark mode complet et cohérent sur les surfaces principales.
- Empty states systématiques avec ton darija (personnalité produit).
- Facture print pixel-perfect A4 — ne pas toucher.

## 6 · Outillage

- `tests/screenshots.js diff <dir>` → 14 PNG déterministes (preuve de non-régression visuelle, hash-comparables).
- `tests/screenshots.js audit <dir>` → 65 JPEG (set complet d'audit).
- Horloge figée (13/07/2026 12:00 Casablanca), polices neutralisées, animations désactivées, fixtures stables.
