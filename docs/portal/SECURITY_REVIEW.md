# Client Portal — Security Review (design-stage)

## 1. Trust boundaries

```
Browser (client member)  ──JWT──▶  Supabase REST/Realtime/Storage   (anon key + user JWT, RLS)
Browser (studio)         ──JWT──▶  same, wider policies
Edge Functions (invite, notify)   service role — never shipped to any client
(no third-party scheduler in v1; future provider adapters = signature-verified Edge Functions)
Marketing site                    zero state, zero secrets — out of scope by construction
```

## 2. RLS matrix (the contract to implement & test)

| Table | studio | client_owner | client_member | anon |
|---|---|---|---|---|
| portal_members | CRUD | SELECT own client's rows; INSERT/REVOKE `client_member` of own client | SELECT own row | — |
| portal_projects | CRUD | SELECT published ∧ member | SELECT published ∧ member | — |
| milestones / notes / assets | CRUD | SELECT via project membership (notes: published only; assets: status ≠ draft) | same | — |
| approvals | SELECT/INSERT | INSERT (own client, shared deliverable-kind asset) + SELECT | SELECT | — |
| availability_rules / overrides | CRUD | SELECT (active only — needed to render the picker) | SELECT | — |
| invoices | CRUD | SELECT own client (status ≠ draft) | SELECT same | — |
| bookings | CRUD | SELECT own client · INSERT **only via `book_slot` RPC** (table INSERT denied to clients) · cancel own ≥24h | SELECT · book via RPC | — |
| notifications | — (system writes) | SELECT/UPDATE(read_at) own rows | same | — |
| audit_log | SELECT | — | — | — |
| Gestion tables (clients, projets, taches, paiements, events) | existing owner-only policies — **unchanged** | — | — | — |

Membership predicate (single SQL function, `security definer`, used by every policy):
`is_member(client uuid) := exists (select 1 from portal_members m where m.user_id = auth.uid() and m.client_id = client and m.status = 'active')` · `is_studio() := exists (… role='studio' …)`.

## 3. Threat model (STRIDE-lite) & mitigations

| Threat | Mitigation |
|---|---|
| Cross-client data access (IDOR) | RLS on every table/view; **pgTAP/integration tests that assert cross-client SELECTs return 0 rows** before any UI ships |
| Leaked file URLs | private buckets; signed URLs TTL ≤ 5 min, minted by RPC that re-checks membership + logs to audit_log |
| Forged approvals | `approvals.decided_by = auth.uid()` enforced by policy `with check`; role checked in policy; append-only (no UPDATE/DELETE policies) |
| Double / phantom bookings | slot validity re-checked **inside the booking transaction**; `EXCLUDE USING gist` range constraint makes overlapping confirmed bookings impossible; table INSERT denied to client roles (RPC only) |
| Booking spam | `book_slot` rate limit (N per member per day, enforced in RPC) + lead-time & horizon caps from rules |
| Invite abuse / enumeration | invites only via studio-JWT-gated Edge Function; generic error messages on /login; Supabase rate limits + captcha-free honeypot on nothing (no public forms) |
| Password attacks | **no passwords exist** (magic link only) — the entire credential-stuffing/reset-flow surface is absent |
| Session theft (XSS) | no third-party scripts except supabase-js (pinned, self-hosted like the Arabic fonts); strict escaping of markdown (updates rendered through a whitelist renderer); CSP via meta (`default-src 'self'`; `connect-src` supabase + calendly; `frame-src` calendly) — GitHub Pages can't set headers: **documented residual risk**, revisit host (Cloudflare Pages) if CSP-in-header becomes a requirement |
| Privilege escalation via role edit | `portal_members.role` writable only by studio policy; `client_owner` can only INSERT rows with role='client_member' (CHECK in policy) |
| Secrets in repo | service role & Resend keys only in Supabase function env; repo scanned (same discipline as today) |
| Data at rest | Supabase-managed encryption; PDFs/files contain client data → bucket names non-guessable is NOT relied upon (signed URLs only) |

## 4. Auditability & privacy

- Every mutation trigger writes `audit_log` (actor, action, entity, meta) — studio-readable, immutable.
- Notifications e-mails contain titles + links only, never document contents.
- Right-to-erasure: revoking a member cascades nothing destructive; full client offboarding = soft-delete portal rows + Storage purge script (runbook to be written in implementation sprint).
- Law 09-08 / GDPR posture inherited from the site's privacy policy; portal adds a processing note (client project data, hosting: Supabase EU region — **decision: confirm project region before implementation**).

## 5. Pre-implementation security checklist (gate for the build sprint)

- [ ] RLS policies written **with tests first** (cross-tenant zero-row proofs)
- [ ] Signed-URL RPCs reviewed (membership + TTL + audit)
- [ ] Edge Functions: auth verification + idempotency tests · `book_slot` concurrency test (parallel bookings → exactly one wins)
- [ ] Markdown renderer whitelist test (no raw HTML pass-through)
- [ ] Invite flow abuse review (expiry, resend limits)
- [ ] Supabase Auth settings: confirm email ON (already), **password auth disabled**, magic-link expiry + rate limits
- [ ] Dependency pinning (supabase-js self-hosted, checksum)
