# Phase 3: admin-panel-content-management - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable platform administration and content curation for the MVP. This phase covers admin review of private listings and subscription payments, direct management of public parking records, owner and subscription oversight, KPI visibility, and data export. It does not add new end-user features or automated payment verification.

</domain>

<decisions>
## Implementation Decisions

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

### the agent's Discretion
- Exact dashboard card layout, spacing, and visual hierarchy inside the mixed landing view.
- The concrete preset rejection reason taxonomy, provided it supports both listing and payment rejection workflows.
- The exact shape of the bulk-import API, as long as it is documented and aligned with the public parking CRUD model.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope
- `.planning/ROADMAP.md` - Phase 3 goal and success criteria for admin panel and content management.
- `.planning/REQUIREMENTS.md` - `ADM-01` through `ADM-08`, plus Phase 2 dependencies around manual UTR verification and subscription records.
- `.planning/PROJECT.md` - MVP constraints, admin persona, whitelist-based admin access, and manual verification strategy.
- `.planning/STATE.md` - Current project progress and prior implementation decisions that carry into this phase.

### Product Spec
- `WhereIsMyParking_SRD_v1.docx` - Source product requirements document for broader admin, listing, and subscription behavior.

### Existing Implementation Anchors
- `prisma/schema.prisma` - Current admin, listing, user, and subscription data model that this phase extends.
- `src/app/admin/page.tsx` - Existing admin dashboard shell and current tab model.
- `src/app/api/admin/listings/route.ts` - Existing admin listing queue API behavior.
- `src/app/api/admin/listings/[id]/route.ts` - Existing listing approval and rejection action endpoint.
- `src/app/api/admin/subscriptions/pending/route.ts` - Existing pending UTR verification queue.
- `src/app/api/admin/subscriptions/verify/route.ts` - Existing subscription verification flow and listing activation coupling.
- `src/app/api/admin/stats/route.ts` - Current KPI endpoint baseline.
- `src/app/api/admin/owners/route.ts` - Current owner overview endpoint.
- `src/components/admin/AdminTabs.tsx` - Current admin navigation pattern.
- `src/components/admin/ListingApprovalCard.tsx` - Existing listing review card baseline.
- `src/components/admin/StatsCard.tsx` - Existing KPI presentation baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/admin/page.tsx`: Existing client-side admin shell with tabs, queue fetches, CSV trigger, and approval handlers that can be refactored into the mixed landing view.
- `src/components/admin/AdminTabs.tsx`: Reusable tab navigation for separate operational queues.
- `src/components/admin/ListingApprovalCard.tsx`: Existing review card that can be expanded to show full submission details and rejection capture.
- `src/components/admin/StatsCard.tsx`: Existing metric card primitive for the dashboard summary section.
- `src/components/ListingForm.tsx`: Best current reference for the full set of owner-submitted listing fields that admin review must expose.

### Established Patterns
- Admin endpoints consistently authenticate with Supabase token lookup and a Prisma `adminUser` whitelist check, with a dev bypass behind `NEXT_PUBLIC_DEV_BYPASS_AUTH`.
- Prisma is the source of truth for listings, subscriptions, users, and admin access; admin flows already mutate listing and subscription state directly through Prisma.
- The current admin UI is a client-rendered dashboard that fetches section-specific JSON endpoints on tab change.
- Existing listing and subscription flows already encode manual UTR verification and listing status transitions, so Phase 3 should extend that pattern instead of introducing a separate workflow model.

### Integration Points
- Public parking CRUD will extend `ParkingListing` handling and likely distinguish admin-managed public records from owner-submitted private records.
- Review improvements plug into the existing admin page, listing approval card, and admin queue endpoints.
- Subscription lifecycle controls integrate with the existing `Subscription` model and the `/api/admin/subscriptions/*` routes.
- KPI filtering and export will extend the stats, listing, owner, and subscription admin endpoints rather than building an isolated reporting module.

</code_context>

<specifics>
## Specific Ideas

- The admin home should feel like an action center, not a passive dashboard: summary context first, then pending work.
- Public parking bulk import needs both a programmatic API contract and supporting documentation in this phase, even if bulk ingestion is exercised later.
- Owners should not be left with a dead-end rejection state; every rejection path should explain what to fix and how to resubmit.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 03-admin-panel-content-management*
*Context gathered: 2026-04-14*
