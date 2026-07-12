# ROADMAP

## Phase 1 — Architecture actuelle (LocalStorage + GitHub Pages, 100% offline)
| # | Feature | Statut |
|---|---------|--------|
| 1 | Dashboard 2.0 | ✅ Livré |
| 2 | Revenue Charts | ✅ Livré |
| 3 | Global Search (Ctrl+K) | ⏳ En attente d'approbation |
| 4 | Calendrier (mois/semaine, deadlines + paiements) | Planifié |
| 5 | Notifications internes + badge | Planifié |
| 6 | CRM avancé (société, adresse, historique) | Planifié |
| 7 | Reports (CSV + PDF) | Planifié |
| 8 | Performance (rendering ciblé) | Planifié |
| 9 | Responsive audit | Planifié |
| 10 | UI Polish + raccourcis clavier | Planifié |
| + | Activity log, filtres avancés, Settings, auto-backup | Backlog |

## Phase 2 — SaaS (NE PAS IMPLÉMENTER sans approbation explicite)
Supabase (Auth + PostgreSQL + Storage + RLS) · Stripe · Multi-user & rôles · Client Portal · Cloud Sync · White Label.
Préparation en Phase 1 : isoler la couche données (load/save) pour une migration sans toucher l'UI.
