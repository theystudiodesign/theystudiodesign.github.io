# THE'Y Client Portal — Architecture (Phase 4 · Foundation)

*Status: **v2 — scope ratified** (product decisions of the studio applied). Architecture only, zero production code. Nothing here modifies the public website.*

---

## 0. Audit of the existing system

| Asset | State | Relevance to the portal |
|---|---|---|
| **Marketing site** (`theystudiodesign.com`) | Live on `main`. Static, zero-dependency, token-driven (`assets/css/main.css` §9 tokens), i18n EN/FR/AR, dark/light theme system, no auth, no SW, no state — by Blueprint §8.2.5 design | Supplies the **design system** (tokens, components, motion) and the `/portal` reserved path (redirect only). Must never gain state. |
| **THE'Y Gestion** (studio CRM) | Complete on PR #26 (unmerged): single-page app + **SyncEngine v2** (IndexedDB source of truth, persistent queue, soft-delete tombstones), 55+ green tests | The **studio-side source of truth**. The portal never duplicates its job: Gestion writes, portal projects a client-safe subset. |
| **Supabase project** (`tychqyohodvjwafzfycg`) | Live. Tables `clients, projets, taches, paiements, events` with v2 columns (`deleted_at, version, device_id`), RLS by `user_id`, GoTrue auth with **email confirmation ON** | Becomes the shared backend: one Postgres, two audiences (studio / clients), separated by RLS. Auth, Storage, Realtime, Edge Functions all come from here. |
| **Blueprint §8 (roadmap seams)** | Ratified | Portal = **subdomain app** (`portal.theystudiodesign.com`), consumes the same tokens, never touches marketing routes. |

**Constraints inherited from history** (the CRM's persistence wars): client-side state is a liability → the portal is **server-state-first** (Supabase is the source of truth; the browser caches nothing durable). No service worker. No offline mode in v1.

---

## 1. Principles

1. **Calm product, Apple/Linear/Stripe/Notion register.** One idea per screen, hairlines over boxes, ink/paper surfaces, the accent used only as a verb.
2. **The portal is a *projection*, not a second CRM.** Studio truth lives in Gestion tables; clients see explicitly *published* artifacts only. Publishing is an act, never a default.
3. **No unnecessary machinery.** Zero-build vanilla ES modules + `supabase-js`, exactly like the rest of the estate. A framework is introduced only when a measured pain justifies it (§11).
4. **Security by RLS, not by UI.** Every read path is provable at the database layer; the UI is a convenience, not a boundary.
5. **SaaS-ready seams, not SaaS features.** Multi-tenant shape from day one (`client_id` scoping everywhere), billing/white-label left as documented seams.

---

## 2. Topology & routing

```
theystudiodesign.com            static marketing (untouched)
  └── /portal  → 301 →  portal.theystudiodesign.com   (reserved path, redirect only)

portal.theystudiodesign.com     the portal app (new repo: theystudiodesign/portal — DECIDED)
  /                    dashboard (progress, attention items, notes feed)   [auth]
  /login               sign-in — MAGIC LINK ONLY (no passwords in v1)      [public]
  /invite              invite acceptance → magic link                      [public, tokened]
  /projects/:id        project: progress + TIMELINE + notes + deliverables [auth]
  /deliverables        approval-carrying artifacts across projects         [auth]
  /deliverables/:id    preview + download + APPROVE                        [auth]
  /files               simple shared files (no approval workflow)          [auth]
  /invoices            invoice list + status                               [auth]
  /invoices/:id        invoice detail + PDF                                [auth]
  /meetings            NATIVE booking (our availability) + history         [auth]
  /profile             identity, language, notification preferences        [auth]
```
**v1 modules (ratified):** Dashboard · Project Progress · Timeline · Deliverables · Files · Meetings · Invoices · Notes · Approvals · Profile. Notifications remain a **shell capability** (bell + panel), not a page. Everything else → future versions.

- **Hosting:** separate repo `theystudiodesign/portal`, GitHub Pages + `CNAME portal.theystudiodesign.com`. Isolated deploys, cookies, and analytics from the marketing site (Blueprint §8.2.1).
- **Router:** hash-free history routing via a ~40-line vanilla router (static host serves `404.html` = app shell, router resolves the path). One shell, per-route ES modules, lazy-imported.
- **Locale & theme:** reuse the site's mechanisms — `they_theme` localStorage key is shared across subdomains? No — localStorage is origin-scoped; the portal keeps its own copy, same key name, same guard script. i18n: portal launches **EN/FR** (client-facing necessity), AR-ready via the same dictionary pattern.

## 3. Authentication

- **Provider:** Supabase GoTrue (already live, email confirmation ON — a feature here, not a bug).
- **Methods (DECIDED): magic link only.** No passwords exist in v1 — no password storage, reset flows, or strength policies to secure. The invite email *is* the first magic link.
- **Invite-only.** There is no public signup. The studio invites a contact from Gestion (v1: from a small admin page in the portal; v2: a button in Gestion). Invitation = Supabase `inviteUserByEmail` via Edge Function (service role lives **only** in Edge Functions) + a `portal_members` row.
- **Sessions:** supabase-js default (refresh-token rotation, localStorage). Idle logout after 14 days (refresh token expiry). No cross-subdomain session sharing — the marketing site stays stateless.
- **Studio access:** the existing studio account (Gestion's user) is recognized as `role='studio'` via `portal_members`; it sees everything and can impersonate *views* (read-only "view as client") for support.

## 4. Authorization (model)

Three roles in `portal_members` (user ↔ client mapping):

| Role | Scope | Rights |
|---|---|---|
| `studio` | global | read all, write all portal tables, publish, invite |
| `client_owner` | one `client_id` | read published artifacts of their client, **approve deliverables**, pay-status view, invite/remove `client_member`s of the same client, book meetings |
| `client_member` | one `client_id` | read published artifacts, comment, book meetings — **no approvals** |

- Enforcement is **pure RLS** (`security invoker` views + policies; matrix in `SECURITY_REVIEW.md`).
- Gestion's internal tables (`clients, projets, taches, paiements, events`) remain **studio-only** (existing `user_id = auth.uid()` policies untouched). The portal reads only from new `portal_*` tables and hardened views.

## 5. Data model (summary — full detail in `DATA_MODEL.md`)

New tables (all with `client_id` scoping, `created_at/updated_at`, soft-delete `deleted_at` for parity with SyncEngine conventions):

```
portal_members        user_id · client_id · role · invited_by · status
portal_projects       projection of a projet: name, summary, status, dates, progress, published
milestones            portal_project_id · title · due · status(todo/doing/done) · order   (Timeline)
notes                 portal_project_id · title · body(markdown) · author · published_at  (Notes)
assets                portal_project_id · kind(deliverable|file) · title · version
                      · file_path(Storage) · preview_path · status                        (Deliverables + Files)
approvals             asset_id · decided_by · decision · note · decided_at   (append-only)
invoices              client_id · number · issue/due dates · amount · currency
                      · status(draft/sent/paid/overdue) · pdf_path · paiement_id?  (link to Gestion)
availability_rules    weekday · start/end time · slot minutes · timezone      (studio-owned)
availability_overrides date · closed | extra window                           (holidays, exceptions)
bookings              client_id · starts/ends · status · provider('native')
                      · provider_ref?                                         (provider-agnostic)
notifications         recipient user_id · type · payload jsonb · read_at
audit_log             actor · action · entity · entity_id · meta jsonb        (append-only)
```
One storage-backed table (`assets`) serves two surfaces: **Deliverables** (`kind='deliverable'`, approval workflow) and **Files** (`kind='file'`, shared directly, no approvals).

**Integration with Gestion:** `portal_projects.projet_id` and `invoices.paiement_id` are *soft references* to Gestion rows (nullable FKs on the same database). Publishing a project/invoice from Gestion = inserting/updating the portal projection. Progress can be computed studio-side at publish time (explicit) — the portal never reads raw `taches`. This keeps the internal workspace private by construction and immune to Gestion schema churn.

## 6. Component system

The portal **consumes the existing design system** — same tokens file (copied at build-out, single source: the marketing repo publishes `main.css` tokens §1–§8, §24–§26), same type scale, same motion vocabulary. Portal-specific primitives (all vanilla, `<template>`-based):

- `app-shell` (sidebar nav 220px + topbar with client switcher/bell/theme/lang)
- `data-list` (Linear-style rows: hairline dividers, status dot, meta mono)
- `progress-meter` (thin bar + tabular numerals), `status-pill` (dot + label, semantic tints)
- `timeline` (milestones — the vertical rhythm from the site's process section)
- `file-card` (deliverable: preview frame + version + action), `approve-bar` (sticky decision bar)
- `empty-state`, `toast`, `sheet` (mobile), `dialog` (approval confirm — native `<dialog>`)

Folder structure (future `portal` repo):

```
portal/
  index.html  404.html  CNAME
  assets/css/tokens.css        ← synced from marketing repo (script, not fork)
  assets/css/portal.css        ← portal components only
  src/router.js  auth.js  api.js  realtime.js  i18n/
  src/views/{dashboard,project,deliverables,invoices,meetings,notifications,settings}.js
  src/components/…             ← primitives above
  supabase/{migrations/…  functions/{invite,calendly-webhook,notify}/}
  tests/                       ← same Playwright + mock-supabase culture as Gestion
```

## 7. Booking architecture — native, provider-agnostic (DECIDED: no Calendly dependency)

- **Availability lives in Supabase**, owned by the studio: `availability_rules` (recurring weekly windows, slot length, timezone `Africa/Casablanca`) + `availability_overrides` (closed days / extra windows).
- **Slots are computed, never stored**: RPC `list_slots(from, to)` expands rules − overrides − existing bookings − a lead-time buffer, returning bookable UTC slots. Nothing to keep in sync.
- **Booking is one atomic RPC**: `book_slot(starts_at)` re-validates the slot inside the transaction and inserts under a **unique index on the time range** — double-booking is impossible by constraint, not by UI.
- **Confirmations**: trigger → notification (bell + email digest) with an **ICS attachment** generated by the notify function — works with every calendar, no vendor.
- **Provider seam**: `bookings.provider` (default `'native'`) + `provider_ref`. Calendly (or any scheduler) can be added later as an *optional adapter* — an Edge Function webhook writing the same table with `provider='calendly'`. The UI reads only `bookings`; it never knows the provider.

## 8. Notification architecture

- **Source of truth:** `notifications` table. Writers: Postgres triggers (new update published, deliverable shared, approval decided, invoice sent, booking confirmed) via a single `notify()` SQL function.
- **In-app:** Supabase **Realtime** subscription on the user's rows → bell badge + `/notifications` feed. Falls back to poll-on-navigation if the socket drops (no persistent client state).
- **Email (DECIDED: provider-replaceable):** Edge Function `notify` batches unread rows older than 15 min and hands them to an **`EmailProvider` interface** (`send(to, subject, html, ics?)`). Concrete adapter selected by env var (`EMAIL_PROVIDER=resend|postmark|ses|smtp`) — swapping providers is configuration, not code. Every mail is a digest link back to the portal, never full content (privacy).
- **Preferences:** `notification_prefs` jsonb on `portal_members` (per-type email on/off).

## 9. Security model (summary — full review in `SECURITY_REVIEW.md`)

- **Every request is server-authorized — no client-side trust** (DECIDED). All portal reads/writes behind RLS keyed on `portal_members` membership; slot booking validated in-transaction; approvals append-only; audit log on every mutation via triggers.
- Storage: private buckets `deliverables/` and `invoices/`; downloads via short-lived **signed URLs** minted by RPC that re-checks membership. No public objects.
- Service role key only inside Edge Functions; anon key + user JWT everywhere else. Webhooks signature-verified. No secrets in the repo.
- Marketing site remains cookieless/stateless; the portal carries its own CSP, `Referrer-Policy`, and frame-deny headers (via meta where Pages can't set headers — documented limitation, revisit host if CSP becomes critical).

## 10. What v1 explicitly does NOT include

No public signup · **no passwords** · no payments collection (invoices are informational; Stripe is a later phase) · no file uploads from clients · no comments/chat · no offline/PWA · no AR locale at launch · **no third-party scheduler** (Calendly = optional future adapter only) · no standalone notifications page (bell + panel only).

## 11. Scalability path (SaaS seams)

| Future need | Seam already in place |
|---|---|
| Multiple studios (true SaaS) | add `studio_id` to every portal table (documented column, deferred); RLS predicate widens |
| Stripe billing | `invoices.status` + `payment_link` column reserved; Edge Function webhook pattern ready |
| External schedulers (Calendly…) | `bookings.provider/provider_ref` + adapter Edge Function — additive, zero UI change |
| White-label | tokens file per tenant; components are token-pure |
| Heavier app (if vanilla hurts) | routes are ES modules — migrate view-by-view to Vite+TS without a rewrite; the API layer (`api.js`) is the stable contract |

---

*Companion documents: [`DATA_MODEL.md`](./DATA_MODEL.md) · [`USER_FLOWS.md`](./USER_FLOWS.md) · [`SECURITY_REVIEW.md`](./SECURITY_REVIEW.md) · [`API_CONTRACTS.md`](./API_CONTRACTS.md) · [`wireframes.html`](./wireframes.html)*
