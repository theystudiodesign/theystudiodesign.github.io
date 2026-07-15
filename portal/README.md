# THE'Y Client Portal

Premium client experience for `portal.theystudiodesign.com`. Vanilla ES modules + Supabase, the marketing design tokens, **server-authorized** (RLS), magic-link auth, native booking.

> **Staging note:** built here under `portal/` because the dedicated GitHub repo could not be
> created with the current token. Move this directory to `theystudiodesign/portal` (its own Pages +
> `CNAME portal.theystudiodesign.com`) before launch — nothing here is wired into the marketing site.

## Modules (v1, ratified)
Dashboard · Projects · Timeline · Deliverables · Files · Meetings (native booking) · Invoices · Notes · Approvals · Profile. Notifications = shell capability (bell + panel).

## Run locally
```
cd portal && npm i && npx playwright install chromium
npm run serve        # static app on :8600 (needs a Supabase project with the migrations applied)
npm run qa           # full module QA against the mock Supabase (no network) — 26 assertions
```

## Backend (studio action — not run here)
1. `supabase/migrations/001_schema.sql` → `002_rls.sql` → `003_rpc.sql` in the SQL Editor
2. Storage buckets `assets`, `invoices`, `previews` (private)
3. Deploy Edge Functions `invite`, `notify`; set `EMAIL_PROVIDER` + keys, disable password auth
4. Seed `availability_rules`; invite the first `client_owner`

Architecture of record: `../docs/portal/` (PR #30).
