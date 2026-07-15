# THE'Y Client Portal — Architecture Package (Phase 4 · Foundation)

**Status: v2 — architecture approved, product scope ratified. Architecture only — no production code, no changes to the live website or Gestion. Implementation awaits explicit approval.**

| Document | Contents |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Audit, principles, topology & routing, auth/authz, component system, folder structure, Gestion & Supabase integration, booking, notifications, security summary, non-goals, SaaS seams |
| [DATA_MODEL.md](./DATA_MODEL.md) | ERD (mermaid), draft DDL for the 10 portal tables, storage layout, client-safe views, migration notes |
| [USER_FLOWS.md](./USER_FLOWS.md) | Invitation, daily tracking, share→download→approve, invoices, booking, notifications, studio flows, empty/error states |
| [wireframes.html](./wireframes.html) | 6 annotated screens (login, dashboard, project, approval, invoices, meetings + mobile shell) in the production token language |
| [SECURITY_REVIEW.md](./SECURITY_REVIEW.md) | Trust boundaries, full RLS matrix, threat model & mitigations, audit/privacy posture, pre-implementation gate checklist |
| [API_CONTRACTS.md](./API_CONTRACTS.md) | PostgREST reads/writes, RPCs (signed downloads, summary), Edge Functions (invite, calendly-webhook, notify), realtime channels, versioning policy |

## Ratified decisions (studio, this revision)
1. ✅ **Dedicated repo** → `portal.theystudiodesign.com`; marketing site fully independent
2. ✅ **Same Supabase project** — no second database
3. ✅ **Magic link only** — no passwords in v1; invite-only
4. ✅ **Premium client experience, not a CRM** — calm, minimal, elegant
5. ✅ **v1 modules:** Dashboard · Project Progress · Timeline · Deliverables · Files · Meetings · Invoices · Notes · Approvals · Profile — everything else deferred
6. ✅ **Native booking** — availability in Supabase, provider-agnostic; Calendly = optional future adapter
7. ✅ **Notifications abstraction** — email provider replaceable (`EmailProvider` adapter, env-selected)
8. ✅ **Gestion = source of truth** — portal shows published information only; internal data unreachable by construction
9. ✅ **RLS model kept** — every request server-authorized; no client-side trust

## Still open (non-blocking, to settle during implementation)
- Supabase project **region confirmation** (privacy posture)
- First concrete `EmailProvider` adapter to enable (interface is fixed either way)
