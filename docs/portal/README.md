# THE'Y Client Portal — Architecture Package (Phase 4 · Foundation)

**Status: for review. Architecture only — no production code, no changes to the live website or Gestion.**

| Document | Contents |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Audit, principles, topology & routing, auth/authz, component system, folder structure, Gestion & Supabase integration, booking, notifications, security summary, non-goals, SaaS seams |
| [DATA_MODEL.md](./DATA_MODEL.md) | ERD (mermaid), draft DDL for the 10 portal tables, storage layout, client-safe views, migration notes |
| [USER_FLOWS.md](./USER_FLOWS.md) | Invitation, daily tracking, share→download→approve, invoices, booking, notifications, studio flows, empty/error states |
| [wireframes.html](./wireframes.html) | 6 annotated screens (login, dashboard, project, approval, invoices, meetings + mobile shell) in the production token language |
| [SECURITY_REVIEW.md](./SECURITY_REVIEW.md) | Trust boundaries, full RLS matrix, threat model & mitigations, audit/privacy posture, pre-implementation gate checklist |
| [API_CONTRACTS.md](./API_CONTRACTS.md) | PostgREST reads/writes, RPCs (signed downloads, summary), Edge Functions (invite, calendly-webhook, notify), realtime channels, versioning policy |

## Decisions requested before implementation
1. **Subdomain + new repo** `theystudiodesign/portal` → `portal.theystudiodesign.com` (Blueprint §8.2.1)
2. **Same Supabase project** as Gestion (one Postgres, RLS-separated audiences) — confirm project **region** for privacy posture
3. **Email provider** for notification digests (proposed: Resend)
4. **v1 scope cut** as listed in ARCHITECTURE §10 (no payments collection, no client uploads, EN/FR at launch)
5. Calendly account (already a Phase-1 open item) — needed for booking v1
