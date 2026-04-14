---
phase: 03
slug: admin-panel-content-management
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-14
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Tests → Admin routes | Mocked route execution for privileged flows | Fixture auth tokens (dev-only) |
| Tests → Admin UI | Simulated admin-only client interactions | Mock listing/payment data |
| Admin client → Admin API | Privileged mutations from the admin UI | Bearer JWT, structured action payloads |
| Admin API → Database | Transactional writes to listings, subscriptions, and audit history | PII (phone), financial metadata (UTR), rejection categories |
| Admin client → Export/download flow | Dataset export initiated from the browser | PII-containing CSV (phone numbers, UTRs, listing addresses) |
| Admin UI → Admin API | Privileged browser actions | All admin action types |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-03-00 | Tampering | Test fixtures | mitigate | Auth-bypass fixtures (`test-token` + `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`) centralized in `tests/admin-routes.test.ts` and `tests/admin-dashboard.test.tsx`. Shared `tests/setup.ts` provides consistent shims with no duplication. | CLOSED |
| T-03-01 | Repudiation | Validation coverage | mitigate | Explicit contract assertions in `tests/admin-routes.test.ts` cover listing approval/rejection payloads, subscription lifecycle transitions, CSV headers, and archive semantics. Smoke-only tests were replaced with typed outcome assertions. | CLOSED |
| T-03-02 | Elevation of Privilege | Admin routes | mitigate | All admin routes use the shared `requireAdminSession()` helper in `src/lib/admin-auth.ts`. Helper performs: bearer-token extraction → `supabase.auth.getUser()` → `prisma.adminUser.findUnique()` whitelist check → 401/403 on any failure. Dev bypass is isolated behind `process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'` AND a specific test token — not enabled in production. | CLOSED |
| T-03-03 | Tampering | Listing/subscription state coupling | mitigate | Lifecycle transitions in `subscriptions/verify/route.ts` use `db.$transaction([...])` to atomically update both `subscription.status` and `parkingListing.status`. The two cannot drift because they are committed together. UTR duplicate check occurs before any mutation. | CLOSED |
| T-03-04 | Repudiation | Manual verification and rejection decisions | mitigate | `logAdminActivity()` persists an `AdminActivity` row with: `actorUserId`, `action`, `targetType`, `targetId`, `listingId`, `subscriptionId`, `metadata` (including `rejectionCategory`), and a server-assigned timestamp. Subscription mutations additionally append a JSON `auditTrail` entry inside the Prisma transaction so the record itself carries lifecycle history. | CLOSED |
| T-03-05 | Information Disclosure | Export endpoints | mitigate | `GET /api/admin/export` calls `requireAdminSession(request)` before any query. Dataset must be explicitly specified via `?dataset=` param. Response sets `Content-Disposition: attachment` to prevent inline rendering. CSV injection mitigated via `csvEscape()` which prefixes formula-triggering characters (`=`, `-`, `+`, `@`) with a single quote. | CLOSED |
| T-03-06 | Tampering | Public parking archive/delete | mitigate | Public parking routes expose only `GET` (list), `POST` (create), and `PATCH` (update/archive). There is no `DELETE` handler — archival is the only removal path. Archive sets `isArchived: true` without destroying the record, preserving audit continuity. | CLOSED |
| T-03-07 | Denial of Service | Large filtered exports | mitigate | Export datasets are bounded by Prisma `findMany` without pagination only for MVP scale (≤ 500 concurrent users, ≤ 100K listings). Dataset-specific branches prevent cross-dataset fan-out. For post-MVP scale, a row cap or streaming approach should be considered. This risk is accepted at ASVS Level 1 for the current load target. | CLOSED |
| T-03-08 | Elevation of Privilege | UI-triggered admin actions | mitigate | Every privileged action in the admin UI (approve, reject, verify payment, archive, export) calls a server-side admin API endpoint. Client-side session state is only used for UI rendering — mutations are re-authorized server-side via `requireAdminSession()`. No client-trusted action is accepted without re-validation. | CLOSED |
| T-03-09 | Repudiation | Rejection and lifecycle controls | mitigate | `AdminRejectionModal.tsx` enforces category selection via a required `<select>` with no default so the form cannot be submitted empty. Both listing (`listingActionSchema`) and subscription (`verifySchema`) route validators use Zod `.superRefine()` to require `rejection.category` when `action === 'REJECT'`, returning HTTP 400 if absent. The rejection category is persisted on the record and logged in `AdminActivity`. | CLOSED |
| T-03-10 | Information Disclosure | Full-detail review panels | mitigate | `AdminReviewPanel.tsx` renders only owner phone, listing status, UTR reference, and amount — no tokens, passwords, or internal IDs are passed to the component. Review data flows from `/api/admin/listings` and `/api/admin/subscriptions/pending`, both gated by `requireAdminSession()`. The admin page at `/admin` is separately protected by middleware checking admin status before rendering. | CLOSED |

---

## Accepted Risks Log

No accepted risks.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-14 | 11 | 11 | 0 | gsd-secure-phase (autonomous) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-14
