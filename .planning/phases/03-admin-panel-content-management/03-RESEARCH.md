# Phase 03: admin-panel-content-management - Research

**Researched:** 2026-04-14
**Domain:** Admin operations, moderated content workflows, manual subscription controls, and reporting on Next.js + Prisma + Supabase
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Review Flow
- **D-01:** The default admin landing experience is a mixed screen: high-level summary metrics plus immediate pending action queues on the same screen.
- **D-02:** Listing review must show the full submission before approval or rejection, not just summary metadata.
- **D-03:** After an approval or rejection, the UI should show success feedback and then move the admin to the next review item.
- **D-04:** Listing approvals and subscription verifications remain separate operational queues, even if both are surfaced from the default screen.

### Rejections
- **D-05:** Rejection reasons are mandatory for both listing rejections and payment rejections.
- **D-06:** Rejection reasons should use preset categories with an optional free-text note for admin nuance.
- **D-07:** Owners must see the rejection status, the reason, and clear next-step guidance for correction or resubmission.
- **D-08:** Rejected listings remain editable by the owner and can be resubmitted as the same listing record.

### Public Parking Management
- **D-09:** Public parking management uses a hybrid model: a table-first management view with map support embedded in create and edit flows.
- **D-10:** MVP public parking CRUD is manual now, but Phase 3 must also prepare a programmatic bulk-import API and documentation so future ingestion can plug into the same data model.
- **D-11:** Deleting public parking should be implemented as soft delete or archival, not hard delete.
- **D-12:** Public parking records in MVP must support a rich record set: name, address, coordinates, type, coverage, hours, vehicle types, notes, images, and source metadata.

### Subscription Control
- **D-13:** Admins need full manual lifecycle control in MVP: verify or reject payments, activate or deactivate subscriptions, and manually renew or extend subscription dates.
- **D-14:** Subscription status should automatically drive listing visibility so active payment state and public listing state do not drift apart.
- **D-15:** The admin UI must show status, expiry date, grace-period state, and quick actions for renewal or extension.
- **D-16:** Admins need a full payment audit view with timestamps, decision history, and admin actions for UTR verification and subscription changes.

### Metrics and Export
- **D-17:** MVP KPI coverage should include total listings, pending approvals, active subscriptions, revenue, expired subscriptions, public vs private counts, rejected counts, and recent admin activity.
- **D-18:** Export should support CSV now with section-level filtered exports in the MVP implementation.
- **D-19:** Export coverage must include listings, owners, subscriptions, and payment verification history.
- **D-20:** Metrics and exports should support filtering by date range and by status where relevant.

### Claude's Discretion
- Exact dashboard card layout, spacing, and visual hierarchy inside the mixed landing view.
- The concrete preset rejection reason taxonomy, provided it supports both listing and payment rejection workflows.
- The exact shape of the bulk-import API, as long as it is documented and aligned with the public parking CRUD model.

### Deferred Ideas (OUT OF SCOPE)
None - discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADM-01 | Admin can view all private listing submissions with `PENDING` status. | Pending queue endpoint exists and should be extended into overview + full-detail review flow with shared filters and queue progression. [VERIFIED: `.planning/REQUIREMENTS.md`; `src/app/api/admin/listings/route.ts`; `src/app/admin/page.tsx`] |
| ADM-02 | Admin can approve or reject a listing with an optional rejection reason. | Current approve/reject exists, but research recommends mandatory categorized rejection metadata, owner-visible guidance, and audit logging to satisfy Context decisions D-05 through D-08. [VERIFIED: `.planning/REQUIREMENTS.md`; `src/app/api/admin/listings/[id]/route.ts`; `.planning/phases/03-admin-panel-content-management/03-CONTEXT.md`] |
| ADM-03 | Admin can add, edit, or delete public parking data directly. | No public parking CRUD exists; research defines a manual CRUD slice plus archive-only delete and shared import-ready model. [VERIFIED: `.planning/REQUIREMENTS.md`; codebase grep on `src/app/api/admin/*`; `.planning/phases/03-admin-panel-content-management/03-CONTEXT.md`] |
| ADM-04 | Admin can view all registered owners with subscription status. | Owner list exists but lacks expiry, grace state, linked listings, actions, and history; research specifies those additions. [VERIFIED: `.planning/REQUIREMENTS.md`; `src/app/api/admin/owners/route.ts`; `src/app/admin/page.tsx`] |
| ADM-05 | Admin can manually activate/deactivate a subscription. | No manual lifecycle endpoints exist; research recommends dedicated lifecycle APIs and transaction-safe visibility recomputation. [VERIFIED: `.planning/REQUIREMENTS.md`; `src/app/api/admin/subscriptions/verify/route.ts`] |
| ADM-06 | Admin can view and verify UTR payment submissions. | Pending UTR queue exists but rejection reasons, audit trail, and multi-action lifecycle controls are missing; research covers a payment-history model and UI. [VERIFIED: `.planning/REQUIREMENTS.md`; `src/app/api/admin/subscriptions/pending/route.ts`; `src/app/api/admin/subscriptions/verify/route.ts`] |
| ADM-07 | Admin dashboard shows KPIs: total listings, active subscriptions, pending approvals. | Stats endpoint exists but only returns four metrics; research expands KPI scope and filterable activity reporting per D-17 and D-20. [VERIFIED: `.planning/REQUIREMENTS.md`; `src/app/api/admin/stats/route.ts`; `.planning/phases/03-admin-panel-content-management/03-CONTEXT.md`] |
| ADM-08 | Admin can export listings and user data as CSV. | Current export is client-side and only exports loaded pending listings; research recommends server-side filtered CSV exports and spreadsheet-safe escaping. [VERIFIED: `.planning/REQUIREMENTS.md`; `src/app/admin/page.tsx`] |
</phase_requirements>

## Summary

The repo already has a narrow admin baseline: a client-rendered `/admin` page, per-tab fetches, pending listing review, pending UTR verification, owner list, and a small stats endpoint. That baseline satisfies only the thinnest interpretation of `ADM-01`, `ADM-02`, `ADM-04`, `ADM-06`, and `ADM-07`, and it does so without the richer workflow, auditability, and rejection handling locked in by Context decisions `D-01` through `D-20`. [VERIFIED: `src/app/admin/page.tsx`; `src/app/api/admin/listings/route.ts`; `src/app/api/admin/listings/[id]/route.ts`; `src/app/api/admin/subscriptions/pending/route.ts`; `src/app/api/admin/subscriptions/verify/route.ts`; `src/app/api/admin/stats/route.ts`; `src/app/api/admin/owners/route.ts`; `.planning/phases/03-admin-panel-content-management/03-CONTEXT.md`]

The biggest planning risk is status coupling. The current implementation directly mutates `parking_listings.status` during payment verification, so moderation state, payment state, visibility state, and owner-facing state are all entangled in one field. That is already brittle for rejected payments, and it will become actively wrong once Phase 03 adds manual renewals, deactivations, grace-period views, public parking archival, and owner resubmission flows. [VERIFIED: `src/app/api/admin/subscriptions/verify/route.ts`; `prisma/schema.prisma`; `src/app/dashboard/page.tsx`]

The phase should therefore start with schema normalization and shared admin primitives, not UI polish. Split listing moderation from subscription lifecycle, add append-only payment/admin history, and move exports to server endpoints that reuse the same filter DTOs as the admin tables. Once that foundation exists, the mixed landing page, review queues, public parking CRUD, owner oversight, and exports become additive instead of conflicting rewrites. [VERIFIED: codebase baseline above; CITED: https://www.prisma.io/docs/orm/prisma-client/queries/transactions; CITED: https://www.prisma.io/docs/v6/orm/prisma-migrate/workflows/development-and-production]

**Primary recommendation:** Implement Phase 03 in this order: schema split for moderation/payment/audit, shared admin auth + filter contracts, overview + listing review, subscription/payment lifecycle controls, public parking CRUD, owner oversight, then metrics/export/import-prep. [VERIFIED: codebase baseline; CITED: https://nextjs.org/docs/app/getting-started/route-handlers; CITED: https://www.prisma.io/docs/orm/prisma-client/queries/transactions]

## Current Baseline and Gaps

### ADM-01 through ADM-08

| Item | Current baseline | Concrete gap |
|------|------------------|--------------|
| ADM-01 | `GET /api/admin/listings` filters by `status` and `type`, and the admin page loads `?status=PENDING` into a Listings tab. [VERIFIED: `src/app/api/admin/listings/route.ts`; `src/app/admin/page.tsx`] | No mixed landing queue, no detail drawer/panel, no persisted filters, and no next-item progression UX. [VERIFIED: `src/app/admin/page.tsx`; `src/components/admin/ListingApprovalCard.tsx`; `.planning/phases/03-admin-panel-content-management/03-UI-SPEC.md`] |
| ADM-02 | `PATCH /api/admin/listings/[id]` supports `APPROVE` and `REJECT`, and the UI exposes both actions. [VERIFIED: `src/app/api/admin/listings/[id]/route.ts`; `src/components/admin/ListingApprovalCard.tsx`] | Rejection reason is optional, uncategorized, not persisted, not exposed to owners, and not accompanied by next-step guidance or resubmission workflow state. [VERIFIED: `src/app/api/admin/listings/[id]/route.ts`; `src/app/dashboard/page.tsx`; `.planning/phases/03-admin-panel-content-management/03-CONTEXT.md`] |
| ADM-03 | No admin route or component for public parking CRUD exists. [VERIFIED: codebase grep on `src/app/api/admin/*`; `src/components/admin/*`] | Entire requirement is missing: create, edit, archive, map-assisted coordinate editing, source metadata, images, notes, and bulk-import prep. [VERIFIED: `.planning/REQUIREMENTS.md`; `.planning/phases/03-admin-panel-content-management/03-CONTEXT.md`] |
| ADM-04 | `GET /api/admin/owners` returns users with latest subscription and listing counts; the UI shows phone, count, latest status, and joined date. [VERIFIED: `src/app/api/admin/owners/route.ts`; `src/app/admin/page.tsx`] | Missing expiry dates, grace state, linked listing drilldown, inline lifecycle actions, payment history, and recent activity. [VERIFIED: same files; `.planning/phases/03-admin-panel-content-management/03-UI-SPEC.md`] |
| ADM-05 | Payment verification can activate a subscription indirectly, but there is no standalone manual activate/deactivate/renew/extend flow. [VERIFIED: `src/app/api/admin/subscriptions/verify/route.ts`] | Dedicated lifecycle endpoints, warning UX, and audit records are absent. [VERIFIED: `src/app/api/admin/subscriptions/verify/route.ts`; `.planning/phases/03-admin-panel-content-management/03-CONTEXT.md`] |
| ADM-06 | Pending payment queue exists and approval is supported. [VERIFIED: `src/app/api/admin/subscriptions/pending/route.ts`; `src/app/api/admin/subscriptions/verify/route.ts`; `src/app/admin/page.tsx`] | Missing payment rejection reasons, history timeline, manual lifecycle actions, duplicate-handling UI, and full audit detail. [VERIFIED: same files; `.planning/phases/03-admin-panel-content-management/03-CONTEXT.md`] |
| ADM-07 | Stats endpoint returns `totalListings`, `pendingListings`, `activeSubscriptions`, and revenue; UI renders four cards. [VERIFIED: `src/app/api/admin/stats/route.ts`; `src/components/admin/StatsCard.tsx`; `src/app/admin/page.tsx`] | Missing rejected counts, expired subscriptions, public/private split, recent admin activity, date/status filters, and overview queue integration. [VERIFIED: `.planning/phases/03-admin-panel-content-management/03-CONTEXT.md`; `.planning/phases/03-admin-panel-content-management/03-UI-SPEC.md`] |
| ADM-08 | Export is currently a client-side CSV data URI built from `pendingListings` only. [VERIFIED: `src/app/admin/page.tsx`] | Export does not cover owners, subscriptions, payment history, or server-side filters, and it risks malformed CSV/cell injection. [VERIFIED: `src/app/admin/page.tsx`; `.planning/phases/03-admin-panel-content-management/03-CONTEXT.md`] |

### Decisions D-01 through D-20

| Decision | Current baseline | Gap to close |
|----------|------------------|--------------|
| D-01 | Landing page defaults to a Stats tab, not a mixed action center. [VERIFIED: `src/app/admin/page.tsx`; `src/components/admin/AdminTabs.tsx`] | Restructure `/admin` around overview metrics plus top pending queues. [VERIFIED: `.planning/phases/03-admin-panel-content-management/03-CONTEXT.md`; `03-UI-SPEC.md`] |
| D-02 | Listing review card shows summary only. [VERIFIED: `src/components/admin/ListingApprovalCard.tsx`] | Add full submission detail surface. [VERIFIED: `03-CONTEXT.md`; `03-UI-SPEC.md`] |
| D-03 | Approval/rejection removes the card but shows no inline success feedback or focus handoff. [VERIFIED: `src/app/admin/page.tsx`] | Add success toast/banner and auto-advance behavior. [VERIFIED: `03-CONTEXT.md`; `03-UI-SPEC.md`] |
| D-04 | Listings and subscriptions are separate tabs today. [VERIFIED: `src/components/admin/AdminTabs.tsx`] | Keep separate operational queues, but surface both from overview. [VERIFIED: `03-CONTEXT.md`] |
| D-05 | Rejection reason is not enforced for either listings or payments. [VERIFIED: `src/app/api/admin/listings/[id]/route.ts`; `src/app/api/admin/subscriptions/verify/route.ts`] | Make rejection reason mandatory in both APIs and UI. [VERIFIED: `03-CONTEXT.md`] |
| D-06 | No preset rejection taxonomy exists. [VERIFIED: codebase grep on `rejection|reason`] | Add shared categories plus optional note. [VERIFIED: `03-CONTEXT.md`] |
| D-07 | Owner dashboard shows generic `Rejected` with no explanation. [VERIFIED: `src/app/dashboard/page.tsx`] | Expose reason + corrective guidance in owner-facing APIs and UI. [VERIFIED: `03-CONTEXT.md`] |
| D-08 | Listing edit/resubmission state is not modeled beyond current owner listing fetch. [VERIFIED: `src/app/api/listings/owner/route.ts`; `prisma/schema.prisma`] | Preserve listing identity and support resubmission on the same record. [VERIFIED: `03-CONTEXT.md`] |
| D-09 | No public parking management UI exists. [VERIFIED: codebase grep on admin public parking] | Build table-first management view with map in create/edit flows. [VERIFIED: `03-CONTEXT.md`; `03-UI-SPEC.md`] |
| D-10 | No import endpoint or docs exist. [VERIFIED: codebase grep on `import` under admin] | Add bulk-import API contract and documentation aligned with CRUD model. [VERIFIED: `03-CONTEXT.md`] |
| D-11 | There is no delete/archive behavior for public parking. [VERIFIED: missing public CRUD] | Implement archive-only semantics. [VERIFIED: `03-CONTEXT.md`; `03-UI-SPEC.md`] |
| D-12 | `ParkingListing` stores only name, address, geometry, type, coverage, hours, status, owner, and createdAt. [VERIFIED: `prisma/schema.prisma`] | Add notes, images, source metadata, vehicle types, review fields, and public-record lifecycle metadata. [VERIFIED: `03-CONTEXT.md`; `03-UI-SPEC.md`] |
| D-13 | Subscription verify approves/rejects only one action path. [VERIFIED: `src/app/api/admin/subscriptions/verify/route.ts`] | Add activate, deactivate, renew, and extend actions. [VERIFIED: `03-CONTEXT.md`] |
| D-14 | Listing visibility is changed directly in payment verification. [VERIFIED: `src/app/api/admin/subscriptions/verify/route.ts`] | Replace direct coupling with derived visibility rules and transaction-safe recomputation. [VERIFIED: `03-CONTEXT.md`] |
| D-15 | Owner table shows latest status only. [VERIFIED: `src/app/admin/page.tsx`; `src/app/api/admin/owners/route.ts`] | Add expiry, grace state, and quick actions. [VERIFIED: `03-CONTEXT.md`; `03-UI-SPEC.md`] |
| D-16 | Audit history is only a console log for listing review and none for subscription lifecycle. [VERIFIED: `src/app/api/admin/listings/[id]/route.ts`; codebase grep on `audit|history`] | Add append-only admin and payment history. [VERIFIED: `03-CONTEXT.md`; `03-UI-SPEC.md`] |
| D-17 | KPI coverage is only four metrics. [VERIFIED: `src/app/api/admin/stats/route.ts`] | Add rejected, expired, split counts, recent activity. [VERIFIED: `03-CONTEXT.md`] |
| D-18 | Export is one client-side CSV for pending listings only. [VERIFIED: `src/app/admin/page.tsx`] | Add filtered server-side CSV by section. [VERIFIED: `03-CONTEXT.md`] |
| D-19 | Export coverage excludes owners, subscriptions, payments. [VERIFIED: `src/app/admin/page.tsx`] | Add those datasets. [VERIFIED: `03-CONTEXT.md`] |
| D-20 | Current stats and list endpoints do not expose date-range filters. [VERIFIED: `src/app/api/admin/listings/route.ts`; `src/app/api/admin/stats/route.ts`; `src/app/api/admin/owners/route.ts`] | Standardize filter DTOs across list/stats/export endpoints. [VERIFIED: `03-CONTEXT.md`; `03-UI-SPEC.md`] |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js Route Handlers | `16.2.3` in repo, current registry `16.2.3` | Admin HTTP surface in `app/api/*` | Keep admin APIs in App Router Route Handlers; this matches the current repo and official App Router guidance. [VERIFIED: `package.json`; VERIFIED: npm registry via `npm view next version`; CITED: https://nextjs.org/docs/app/getting-started/route-handlers] |
| Prisma + `@prisma/client` | `6.19.3` in repo, current registry `7.7.0` | Data access, migrations, and transactional admin mutations | Stay on the repo-pinned Prisma 6 line for this phase unless there is an explicit upgrade phase; use Prisma transactions and Prisma Migrate for schema work. [VERIFIED: `package.json`; VERIFIED: `npx prisma --version`; VERIFIED: npm registry via `npm view prisma version` and `npm view @prisma/client version`; CITED: https://www.prisma.io/docs/orm/prisma-client/queries/transactions; CITED: https://www.prisma.io/docs/v6/orm/prisma-migrate/workflows/development-and-production] |
| Supabase Auth client | `2.103.0` | Verify bearer tokens on admin routes | Reuse the existing `supabase.auth.getUser(token)` server-side check plus Prisma whitelist instead of inventing a second admin auth system. [VERIFIED: `package.json`; VERIFIED: npm registry via `npm view @supabase/supabase-js version`; VERIFIED: `src/app/api/admin/listings/route.ts`; `src/app/api/admin/subscriptions/pending/route.ts`] |
| Zod | `4.3.6` in repo, current registry `4.3.6` | Shared request/filter/action validation | Centralize admin filters, rejection payloads, lifecycle actions, and export query validation in shared Zod schemas. [VERIFIED: `package.json`; VERIFIED: npm registry via `npm view zod version`; VERIFIED: existing use in `src/app/api/subscriptions/submit-utr/route.ts`; `src/app/api/subscriptions/initiate/route.ts`] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `date-fns` | `4.1.0` | Grace-period, renewal, extension, and expiry math | Add for deterministic subscription/date-range calculations instead of hand-written `Date` mutation logic. [VERIFIED: npm registry via `npm view date-fns version`; CITED: https://www.npmjs.com/package/date-fns/v/2.3.0] |
| `csv-stringify` | `6.7.0` | Safe server-side CSV generation | Add for filtered exports to avoid broken escaping and spreadsheet formula hazards in hand-built CSV strings. [VERIFIED: npm registry via `npm view csv-stringify version`] |
| `lucide-react` | `1.8.0` | Admin icons consistent with existing UI | Already installed and used throughout the admin UI. [VERIFIED: `package.json`; `src/app/admin/page.tsx`; `src/components/admin/*`] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shared Zod schemas | Ad hoc `request.json()` parsing in each route | Faster at first, but it guarantees filter drift and inconsistent admin error handling. [VERIFIED: current admin routes parse inconsistently; `src/app/api/admin/*`] |
| `csv-stringify` | Hand-rolled string concatenation | Hand-rolled export is already present and already too narrow; it will get error-prone once quoting, commas, newlines, and formula-safe escaping matter. [VERIFIED: `src/app/admin/page.tsx`] |
| Prisma transaction + audit tables | Sequential updates plus console logs | Sequential updates are fragile for coupled listing/subscription changes and do not satisfy D-16 audit needs. [VERIFIED: `src/app/api/admin/listings/[id]/route.ts`; `src/app/api/admin/subscriptions/verify/route.ts`; CITED: https://www.prisma.io/docs/orm/prisma-client/queries/transactions] |

**Installation:**
```bash
npm install date-fns csv-stringify
```

**Version verification:** Registry versions were verified in-session with workspace-local npm cache commands, not training memory: `next@16.2.3` published `2026-04-08T18:46:32.059Z`, `zod@4.3.6` published `2026-01-22T19:14:35.382Z`, `csv-stringify@6.7.0` published `2026-03-17T18:06:56.444Z`, and `date-fns@4.1.0` published `2024-09-17T04:37:03.810Z`. [VERIFIED: npm registry via `npm view ... version` and `npm view ... time --json`]

## Data Model Changes

### Recommended Prisma changes

1. Extend `ParkingListing` with moderation and archival fields instead of overloading `status` alone. Recommended additions: `moderationStatus`, `archivedAt`, `updatedAt`, `reviewedAt`, `reviewedById`, `rejectionCategory`, `rejectionNote`, `resubmittedAt`, `notes`, `vehicleTypes`, `images`, `sourceType`, `sourceName`, `sourceUrl`, and `sourceImportedAt`. The current model cannot represent D-05 through D-12 without those concepts. [VERIFIED: `prisma/schema.prisma`; `03-CONTEXT.md`; `03-UI-SPEC.md`]
2. Keep one `Subscription` row per listing for active lifecycle state, but add a one-to-many payment/audit model such as `SubscriptionPaymentAttempt` for each UTR submission and decision. The current unique `utr` on `Subscription` gives you only one payment artifact and no real history. [VERIFIED: `prisma/schema.prisma`; `src/app/api/admin/subscriptions/verify/route.ts`; `03-CONTEXT.md`]
3. Add an append-only `AdminActivity` table for actor, action, target type, target id, metadata, and timestamp. Console logging in the listing route is not durable and does not satisfy D-16 or D-17 recent activity. [VERIFIED: `src/app/api/admin/listings/[id]/route.ts`; `03-CONTEXT.md`] 
4. Do not add separate latitude/longitude columns unless raw SQL maintenance becomes a consistent pain point. Prisma already models the PostGIS field as `Unsupported("geometry(Point, 4326)")`, and official Prisma guidance confirms unsupported types require casts/raw SQL handling. [VERIFIED: `prisma/schema.prisma`; CITED: https://www.prisma.io/docs/v6/orm/prisma-client/using-raw-sql/raw-queries]

### Migration implications

| Change | Migration implication |
|--------|------------------------|
| New moderation/archive fields on `ParkingListing` | Backfill from existing `status`: `PENDING -> pending review`, `REJECTED -> rejected`, `ACTIVE/EXPIRED -> approved`; then compute effective visibility separately. [VERIFIED: `prisma/schema.prisma`; `src/app/dashboard/page.tsx`] |
| Payment history table | Create new child table and backfill one row per existing subscription where `utr` is present. Preserve current `Subscription` row as lifecycle snapshot. [VERIFIED: `prisma/schema.prisma`] |
| Admin activity table | No destructive migration; start logging new actions immediately, optionally seed historical “migration-created” events for existing verified subscriptions if needed. [ASSUMED] |
| Enum changes or field rename for `status` | Use `prisma migrate dev --create-only` and review the SQL before applying because Prisma Migrate treats some refactors as destructive unless customized. [CITED: https://www.prisma.io/docs/v6/orm/prisma-migrate/workflows/development-and-production] |

**Recommendation:** Treat the status split as the first implementation slice. If the planner leaves it until after the UI work, later slices will have to rewrite list queries, owner dashboards, exports, and review flows. [VERIFIED: current coupling in `src/app/api/admin/subscriptions/verify/route.ts`; `src/app/dashboard/page.tsx`]

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── app/
│   ├── admin/page.tsx                     # action-center shell
│   └── api/admin/
│       ├── overview/route.ts             # KPI + next-item queues + recent activity
│       ├── listings/route.ts             # filtered list review queue
│       ├── listings/[id]/route.ts        # detail + moderation actions
│       ├── subscriptions/route.ts        # owner/subscription table
│       ├── subscriptions/[id]/actions/route.ts
│       ├── payments/route.ts             # payment attempts/history
│       ├── public-parking/route.ts       # CRUD list/create
│       ├── public-parking/[id]/route.ts  # update/archive
│       ├── exports/[section]/route.ts    # filtered CSV responses
│       └── imports/public-parking/route.ts
├── components/admin/
│   ├── overview/
│   ├── listings/
│   ├── subscriptions/
│   ├── public-parking/
│   └── shared/
├── lib/admin/
│   ├── auth.ts                           # admin guard
│   ├── filters.ts                        # shared zod schemas
│   ├── visibility.ts                     # derived listing visibility rules
│   ├── csv.ts                            # export formatter wrappers
│   └── activity.ts                       # audit write helpers
└── tests/admin/
    ├── api/
    ├── components/
    └── utils/
```

### Pattern 1: Shared Admin Guard
**What:** Centralize bearer-token validation and whitelist enforcement in one server helper instead of repeating it in every route. [VERIFIED: current duplication across `src/app/api/admin/*`]
**When to use:** Every admin route, including export/import endpoints. [VERIFIED: admin surface is entirely route-handler based]
**Example:**
```ts
// Source: current repo auth flow + Next.js Route Handlers docs
// [VERIFIED: src/app/api/admin/listings/route.ts]
// [CITED: https://nextjs.org/docs/app/getting-started/route-handlers]
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) throw new Error('UNAUTHORIZED');

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error('UNAUTHORIZED');

  const admin = await prisma.adminUser.findUnique({
    where: { userId: data.user.id },
  });
  if (!admin) throw new Error('FORBIDDEN');

  return data.user;
}
```
