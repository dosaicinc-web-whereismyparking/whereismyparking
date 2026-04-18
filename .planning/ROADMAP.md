# Roadmap: WhereIsMyParking

**Created:** 2026-04-12
**Phases:** 6
**Requirements:** 32
**Requirements Mapped:** 32
**Requirements Unmapped:** 0 ✓

## Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Authentication & Discovery Core | Enable anonymous parking discovery with location services | AUTH-01 through AUTH-06, LOC-01 through LOC-06, DISC-01 through DISC-06 (18 requirements) | Completed |
| 2 | Owner Onboarding & Subscriptions | Enable parking space owners to list spaces with subscriptions | LIST-01 through LIST-07, PAY-01 through PAY-06 | Completed |
| 3 | Admin Panel & Content Management | Platform administration and curation | ADM-01 through ADM-08 | Completed |
| 4 | Launch Readiness & Operational Polish | Finalize MVP gaps and prepare for production launch | ADM-03+, SEO, UX, Performance | Completed |
| 5 | Prototyping Self-Hosted Stack & Bugfixes | Shift to self-hosted Supabase with MapLibre GL JS | PH5-BUG-01, PH5-MAP-01, PH5-SQL-01, PH5-INFRA-01... | Completed |
| 6 | OTP Authentication System | Implement all FR-AUTH requirements using Fast2SMS gateway | AUTH-01 through AUTH-06 | Completed |

### Phase Details

**Phase 1: Authentication & Discovery Core**
Goal: Enable anonymous parking discovery with location services
Requirements: AUTH-01 through AUTH-06, LOC-01 through LOC-06, DISC-01 through DISC-06
Success criteria:
1. Users can access parking discovery without registration
2. GPS location services work on mobile browsers with fallback
3. Nearby parking results display in <500ms with accurate distances
4. Interactive map shows parking pins with clustering for dense areas
5. Navigation to selected parking works via Google Maps deep-link

**Phase 2: Owner Onboarding & Subscriptions**
Goal: Enable parking space owners to list spaces with subscription payments
Requirements: LIST-01 through LIST-07, PAY-01 through PAY-06
Success criteria:
1. Owners can create parking listings via OTP-authenticated mobile signup
2. Subscription payment flow works via UPI deep-links with UTR verification
3. Owner dashboard shows listing status (Pending/Active/Expired)
4. Listings become visible to users only after admin approval
5. **[Security carry-forward from Ph1]** RLS policies enabled on all tables via `supabase/migrations/02_rls_policies.sql` (T-01-07, T-01-08 deferred from Phase 1 security audit)

**Phase 3: Admin Panel & Content Management**
Goal: Enable platform administration and content curation
Status: Complete (2026-04-14)
Requirements: ADM-01 through ADM-08
Success criteria:
1. Admin can approve/reject listings and verify subscription payments
2. Admin can add/edit public parking data directly
3. Admin dashboard shows key metrics and export functionality
4. Manual subscription management works for renewal and expiry

**Phase 4: Launch Readiness & Operational Polish**
Goal: Finalize MVP gaps and prepare for production launch
Requirements: ADM-03 (UI Enhancement), SEO-01 through SEO-05, PERF-01, NAV-01
Plans:
- [x] 04-01-PLAN.md — Enhance admin panel with public parking form
- [ ] 04-02-PLAN.md — Implement SEO and consistent navigation
- [ ] 04-03-PLAN.md — Optimize performance for mobile

Success criteria:
1. Admin Panel includes "Add New" form for Public Parking records
2. All pages have optimized meta-tags, standard headers, and SEO titles
3. Navigation deep-links work consistently across all listing types
4. 4G initial page load verified at <2.0s via Lighthouse audit

**Phase 5: Prototyping Self-Hosted Stack & Bugfixes**
Goal: Shift to self-hosted Supabase stack with MapLibre GL JS and fix Phase 2 validation bypass.
Requirements: PH5-BUG-01, PH5-MAP-01, PH5-SQL-01, PH5-INFRA-01, PH5-INFRA-02, PH5-INFRA-03, PH5-CLEAN-01
Plans:
- [x] 05-01-PLAN.md — Frontend Polish & Map Migration
- [x] 05-02-PLAN.md — Database Migration & Self-Hosted Stack Setup
- [x] 05-03-PLAN.md — Stack Switch & Cleanup

Success criteria:
1. ListingForm validation bypass bug is fully resolved and verified
2. Mapbox is replaced by MapLibre GL JS without functionality regression
3. Prisma is removed and raw SQL migrations are successfully applied to local stack
4. Local self-hosted Supabase stack is operational on Mac Mini (Docker)
5. End-to-end flows (OTP → Listing → Admin) verified against local stack

**Phase 6: OTP Authentication System**
Goal: Implement all FR-AUTH requirements (AUTH-01 through AUTH-06) with Fast2SMS integration
Status: Complete (2026-04-19)
- [x] 06-01-PLAN.md — Fast2SMS integration and OTP send
- [x] 06-02-PLAN.md — OTP verification with expiry and lockout
- [x] 06-03-PLAN.md — JWT issuance and 30-day session expiry
- [x] 06-04-PLAN.md — Admin whitelist and role assignment
- [x] 06-05-PLAN.md — Middleware and route protection
- [x] 06-06-PLAN.md — Verification and UAT

Success criteria:
1. POST /api/auth/send-otp generates and sends 6-digit OTP via Fast2SMS
2. OTP verification enforces 5-minute expiry and 3-attempt lockout
3. Resend OTP blocked for 60 seconds with countdown remaining in response
4. JWT session tokens have 30-day expiry enforced by middleware
5. Admin route access restricted to whitelisted mobile numbers
6. Full E2E flow verified with live SMS delivery

---

*Roadmap updated: 2026-04-19 after Phase 6 completion*
