# Client Portal — API Contracts

*The portal talks to Supabase only: PostgREST (tables/views), RPCs, Storage, Realtime, and three Edge Functions. No custom server. All examples assume `Authorization: Bearer <user JWT>` + `apikey: <anon>` unless noted.*

## 1. PostgREST reads (client roles)

| Purpose | Request | Returns |
|---|---|---|
| Dashboard projects | `GET /rest/v1/v_client_projects?select=*&order=updated_at.desc` | `[{id,name,summary,status,progress,starts_at,due_at,updated_at}]` |
| Project milestones | `GET /rest/v1/milestones?portal_project_id=eq.{id}&deleted_at=is.null&order=sort` | `[{id,title,due_at,status,sort}]` |
| Notes feed | `GET /rest/v1/v_client_notes?portal_project_id=eq.{id}&order=published_at.desc` | `[{id,title,body_md,published_at}]` |
| Deliverables | `GET /rest/v1/v_client_deliverables?portal_project_id=eq.{id}&order=created_at.desc` | `[{id,title,version,status,preview_path,size_bytes,mime,shared_at}]` |
| Files | `GET /rest/v1/v_client_files?order=created_at.desc` | same shape, `kind='file'`, no approval fields |
| Availability (picker) | `GET /rest/v1/availability_rules?active=is.true` + overrides | rendered client-side, but truth re-checked by `book_slot` |
| Invoices | `GET /rest/v1/invoices?select=id,number,issued_at,due_at,amount_cents,currency,status&order=issued_at.desc` | list (RLS scopes to member's client; drafts invisible) |
| Bookings | `GET /rest/v1/bookings?order=starts_at.desc` | upcoming + past |
| Notifications | `GET /rest/v1/notifications?read_at=is.null&order=created_at.desc&limit=30` | unread feed |

Errors: PostgREST standard — `401` no/expired JWT → re-auth; RLS misses surface as **empty sets, never 403** (no existence leaks).

## 2. Writes (client roles)

| Action | Request | Rules |
|---|---|---|
| Approve / request changes | `POST /rest/v1/approvals` `{asset_id, decision, note?}` | policy: role=client_owner ∧ member ∧ asset.kind='deliverable' ∧ status='shared'; `decided_by` forced to `auth.uid()`; `changes_requested` requires non-empty note (CHECK) |
| Mark notification read | `PATCH /rest/v1/notifications?id=eq.{id}` `{read_at: now}` | own rows only |
| Invite member (owner) | `POST /functions/v1/invite` `{email, client_id, role:'client_member'}` | see §4 |
| Update prefs | `PATCH /rest/v1/portal_members?id=eq.{own}` `{notification_prefs}` | own row, prefs column only (column grant) |

## 3. RPCs (`/rest/v1/rpc/…`)

```
sign_download(asset_id uuid)   → { url text, expires_at timestamptz }
  security definer · re-checks membership + status≠draft · TTL 300s · writes audit_log
sign_invoice(invoice_id uuid)  → same pattern for invoices/{…}.pdf
portal_summary()               → { projects int, unread int, invoices_due int, next_meeting timestamptz }

-- NATIVE BOOKING (no external provider)
list_slots(p_from date, p_to date) → [{ starts_at timestamptz, ends_at timestamptz }]
  expands availability_rules − overrides − confirmed bookings − lead time (24h) − horizon (6 weeks)
book_slot(p_starts_at timestamptz, p_title text default null) → { booking_id, starts_at, ends_at }
  transaction: membership → slot still valid → INSERT (gist exclusion) → notify triggers
  errors: P0003 slot_taken · P0004 outside_availability · P0005 rate_limited
cancel_booking(p_id uuid) → { ok } — own booking, ≥24h before start
```
Errors: `P0001 not_a_member`, `P0002 not_available`, `P0003–P0005` above → UI maps to calm states.

## 4. Edge Functions

| Function | Auth | Contract |
|---|---|---|
| `invite` | studio or client_owner JWT (verified inside) | `POST {email, client_id, role}` → `201 {member_id}` · `409 already_member` · `403 role_not_allowed` (owner may only create client_member). Sends the magic-link invite (no password flow exists) |
| `notify` | cron (Supabase scheduled) | batches `notifications` where `read_at is null and emailed_at is null and created_at < now()-'15 min'` → **EmailProvider adapter** (`EMAIL_PROVIDER` env: resend / postmark / ses / smtp) → digest (+ ICS for bookings) → stamps `emailed_at` |
| *(future)* `scheduler-webhook` | provider HMAC | optional adapter (e.g. Calendly) writing `bookings` with `provider`/`provider_ref` — additive, out of v1 |

## 5. Realtime

Channel: `notifications:user_id=eq.{uid}` (INSERT) → badge increment; `assets` & `notes` changes scoped per open project page. Reconnect strategy: on `visibilitychange`, refetch the affected lists (no client cache to reconcile — server state only).

## 6. Versioning & stability

The portal's internal `api.js` is the single place that knows these shapes; views (`v_client_*`) are the compatibility layer — schema may evolve behind them without breaking clients. Breaking changes require a new view version (`v2_client_projects`) + deprecation note here.
