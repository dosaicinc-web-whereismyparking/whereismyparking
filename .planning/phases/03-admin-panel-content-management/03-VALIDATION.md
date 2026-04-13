---
phase: 03
slug: admin-panel-content-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 03 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test:unit -- tests/admin-routes.test.ts tests/admin-dashboard.test.tsx` |
| **Full suite command** | `npm run test:unit && npx prisma validate && npx tsc --noEmit` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit -- tests/admin-routes.test.ts tests/admin-dashboard.test.tsx`
- **After every plan wave:** Run `npm run test:unit && npx prisma validate && npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-00-01 | 00 | 0 | ADM-01..ADM-08 | T-03-00 / T-03-01 | Admin-only fixtures and route mocks prevent accidental public-path testing | unit | `npm run test:unit -- tests/admin-routes.test.ts tests/admin-dashboard.test.tsx` | ❌ W0 | pending |
| 03-01-01 | 01 | 1 | ADM-01, ADM-02, ADM-05, ADM-06 | T-03-02 / T-03-03 | Approval, rejection, verification, and subscription mutations require admin auth and structured reasons where required | unit + prisma | `npm run test:unit -- tests/admin-routes.test.ts && npx prisma validate` | ❌ W0 | pending |
| 03-02-01 | 02 | 1 | ADM-03, ADM-04, ADM-07, ADM-08 | T-03-04 / T-03-05 | CRUD, exports, and reporting stay filter-aware and archive-safe | unit + integration | `npm run test:unit -- tests/admin-routes.test.ts && npx tsc --noEmit` | ❌ W0 | pending |
| 03-03-01 | 03 | 2 | ADM-01..ADM-08 | T-03-06 | Admin UI exposes required controls without bypassing validation or confirmation paths | component | `npm run test:unit -- tests/admin-dashboard.test.tsx` | ❌ W0 | pending |

*Status: pending, green, red, flaky*

---

## Wave 0 Requirements

- [ ] `tests/admin-routes.test.ts` - route coverage for listing review, payment verification, subscription lifecycle actions, public parking archive, and export contract
- [ ] `tests/admin-dashboard.test.tsx` - component coverage for action center, queue progression, rejection modal requirements, owner/subscription controls, and export filters
- [ ] Shared mocks or setup updates in `tests/setup.ts` if the new admin tests need fetch/router helpers

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Public parking map embed in create/edit flows | ADM-03 | jsdom will not validate interactive map ergonomics | Open admin public parking create/edit flow, move the map, and confirm coordinates persist in the form |
| CSV file correctness across datasets | ADM-08 | Automated tests can validate payload shape, but not spreadsheet usability | Export listings, owners, subscriptions, and payment history with filters applied; inspect headers, date labels, and row counts |
| Responsive admin layout and keyboard progression | ADM-01, ADM-06, ADM-07 | Visual focus order and responsive hierarchy are best confirmed manually | Verify overview, queue cards, detail panels, and table actions on mobile and desktop widths; confirm focus rings and next-item progression |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing admin verification references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
