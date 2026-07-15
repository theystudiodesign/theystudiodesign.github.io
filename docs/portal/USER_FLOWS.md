# Client Portal — User Flows

## 1. Invitation → first login

```mermaid
sequenceDiagram
    participant S as Studio (Gestion/admin)
    participant EF as Edge Function invite
    participant SB as Supabase Auth
    participant C as Client
    S->>EF: invite {email, client_id, role} (studio JWT)
    EF->>SB: inviteUserByEmail (service role)
    EF->>EF: insert portal_members (status=invited)
    SB-->>C: email "THE'Y invited you to your portal"
    C->>SB: open link → set password / magic link
    SB-->>C: session (email confirmed)
    C->>Portal: first load → members row → status=active
    Portal-->>C: dashboard (their client only)
```

Edge cases: link expired → resend from `/login`; email already registered → normal login, membership attaches; revoked member → RLS returns nothing + "access ended" screen.

## 2. Track progress (the daily loop)

Login → **Dashboard**: one card per project — name, thin progress meter, next milestone, latest update snippet, unread dot. → **Project page**: milestone timeline (done/doing/todo), updates feed (markdown), deliverables strip. Reading an update marks its notification read.

## 3. Deliverable share → download → approve

```mermaid
sequenceDiagram
    participant S as Studio
    participant DB as Supabase
    participant C as Client (owner role)
    S->>DB: deliverable.status draft→shared (+trigger)
    DB-->>C: notification (realtime + email digest)
    C->>DB: open /deliverables/:id (RLS check)
    C->>DB: rpc sign_download(deliverable_id)
    DB-->>C: signed URL (5 min) → download
    C->>DB: insert approvals {approved | changes_requested, note}
    DB->>DB: trigger: deliverable.status ← decision · notify studio · audit_log
    DB-->>S: notification "Atlas approved Logo v3"
```

Rules: only `client_owner` sees the approve bar; `changes_requested` requires a note; decisions are append-only (re-share creates version v2 → new decision).

## 4. Invoices

Dashboard badge "1 invoice due" → `/invoices`: list rows (number · issued · due · amount · status pill) → detail: line summary + **Download PDF** (signed URL) → status updates arrive from studio (`sent → paid` set in Gestion/admin, mirrored to `invoices`). Overdue = computed style, never a client-side mutation.

## 5. Book a meeting

`/meetings` → themed Calendly inline (prefilled name/email) → confirm → Calendly webhook → Edge Function verifies signature → `bookings` row → confirmation notification + row appears in "Upcoming". Cancel/reschedule flows through Calendly links on the row; webhook keeps the mirror truthful.

## 6. Notifications

Bell badge (realtime count) → panel: grouped by project, newest first → click = deep link + mark read. Email digest (Edge cron, 15-min batch) for unread items, per-type opt-out in `/settings`.

## 7. Studio flows (v1 admin surface)

Publish project (pick Gestion projet → name/summary/progress → publish) · post update (markdown, publish now/draft) · share deliverable (upload → preview → share) · issue invoice (upload PDF + metadata, optionally link paiement) · invite/revoke member · "view as client" (read-only impersonation banner).

## 8. Error & empty states (first-class, per design language)

Empty dashboard: "Your first project appears here the day we press publish." · signed URL expired → one-click refresh · offline → calm banner, retry on focus · revoked → farewell screen with studio contact.
