# ROADMAP

## Phase 1 — Architecture actuelle (LocalStorage + GitHub Pages, 100% offline)
| # | Feature | Statut |
|---|---------|--------|
| 1 | Dashboard 2.0 | ✅ Livré |
| 2 | Revenue Charts | ✅ Livré |
| 3 | Global Search (Ctrl+K) | ✅ Livré |
| 4 | Calendrier (mois/semaine + panneau jour, 4 sources + events) | ✅ Livré |
| 5 | Notifications internes + badge | ✅ Livré |
| 6 | CRM avancé (société, adresse, historique) | ✅ Livré |
| 7 | Reports (CSV + PDF) | ✅ Livré |
| 8 | Performance (rendering ciblé) | ✅ Livré |
| 9 | Responsive audit | Planifié |
| 10 | UI Polish + raccourcis clavier | Planifié |
| + | Activity log, filtres avancés, Settings, auto-backup | Backlog |

## Phase 2 — SaaS (NE PAS IMPLÉMENTER sans approbation explicite)
Supabase (Auth + PostgreSQL + Storage + RLS) · Stripe · Multi-user & rôles · Client Portal · Cloud Sync · White Label.
Préparation en Phase 1 : isoler la couche données (load/save) pour une migration sans toucher l'UI.
