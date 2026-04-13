# Phase 3: admin-panel-content-management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `03-CONTEXT.md` - this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 03-admin-panel-content-management
**Areas discussed:** Review Flow, Rejections, Public Parking Management, Subscription Control, Metrics and Export

---

## Review Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Queue-first | Show pending listings and pending UTR verifications first | |
| Dashboard-first | Show KPIs first, with review work in tabs | |
| Mixed | Top summary plus immediate pending action queues on the same screen | yes |

**User's choice:** Mixed landing view with top summary and immediate pending action queues.
**Notes:** Full submission visibility is required before listing approval. Success feedback should show and then advance to the next item. Listing approvals and subscription verifications stay in separate queues.

---

## Rejections

| Option | Description | Selected |
|--------|-------------|----------|
| Mandatory reasons | Rejection requires a reason | yes |
| Preset plus note | Use preset reasons with optional free-text note | yes |
| Owner guidance | Show rejection status, reason, and next-step guidance | yes |
| Same listing resubmission | Owner edits the same listing and resubmits it | yes |

**User's choice:** Mandatory reasons for both listings and payments, using preset reasons plus optional notes. Owners see the reason and next-step guidance, and rejected listings are corrected through the same record.
**Notes:** This locks both data capture and owner-facing messaging requirements.

---

## Public Parking Management

| Option | Description | Selected |
|--------|-------------|----------|
| Table-first | Searchable table with add, edit, and delete actions | |
| Map-first | Map is primary, form opens from selected pin or area | |
| Hybrid | Table management with map embedded in create and edit flows | yes |

**User's choice:** Hybrid public parking CRUD, manual entry now, soft deletion, and rich records.
**Notes:** The user explicitly added that this phase must also set up a programmatic bulk-import API and accompanying documentation for future import workflows.

---

## Subscription Control

| Option | Description | Selected |
|--------|-------------|----------|
| Full control | Verify or reject, activate or deactivate, renew or extend manually | yes |
| Automatic listing visibility | Subscription status should automatically control listing visibility | yes |
| Expiry quick actions | Show expiry and grace state with renewal or extension actions | yes |
| Full audit history | Keep timestamps, decision history, and admin actions | yes |

**User's choice:** Full manual subscription lifecycle control with automatic listing visibility coupling, explicit expiry and grace handling, and full audit history.
**Notes:** This expands the current pending-verification-only flow into a full operational control surface.

---

## Metrics and Export

| Option | Description | Selected |
|--------|-------------|----------|
| Full MVP ops KPIs | Business metrics plus public/private split, rejected counts, and recent admin activity | yes |
| Section-level CSV exports | CSV exports with filtered exports per section | yes |
| Full export coverage | Listings, owners, subscriptions, and payment verification history | yes |
| Filterable reporting | Filter by date range and status where relevant | yes |

**User's choice:** Full MVP operational KPIs, filtered CSV exports, full data coverage, and filterable reporting.
**Notes:** The current frontend-only export is insufficient; reporting needs backend-backed filtered export paths.

---

## the agent's Discretion

- Final layout structure of the mixed landing view.
- Exact rejection reason taxonomy.
- Exact API contract design for future bulk import, as long as it is documented and compatible with public parking CRUD.

## Deferred Ideas

None.
