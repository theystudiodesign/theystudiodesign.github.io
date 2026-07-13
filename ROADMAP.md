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
| + | Auto-backup & Restore | ✅ Livré (Sprint 09) |
| + | Activity log, filtres avancés, Settings | Backlog |

## Sprints 05→10 : tous livrés (13/07/2026)

## Phase 2 — SaaS (Sprint 11 : fondations livrées — schéma + pilote + auth gate)
Supabase (Auth + PostgreSQL + Storage + RLS) · Stripe · Multi-user & rôles · Client Portal · Cloud Sync · White Label.
Préparation en Phase 1 : isoler la couche données (load/save) pour une migration sans toucher l'UI.
