# Roadmap: WhereIsMyParking

**Created:** 2026-04-12
**Phases:** 3
**Requirements:** 32
**Requirements Mapped:** 32
**Requirements Unmapped:** 0 ✓

## Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Authentication & Discovery Core | Enable anonymous parking discovery with location services | AUTH-01 through AUTH-06, LOC-01 through LOC-06, DISC-01 through DISC-06 (18 requirements) | 5 criteria |
| 2 | Owner Onboarding & Subscriptions | Enable parking space owners to list spaces with subscription payments | LIST-01 through LIST-07, PAY-01 through PAY-06 (13 requirements) | 4 criteria |
| 3 | Admin Panel & Content Management | Enable platform administration and content curation | ADM-01 through ADM-08 (8 requirements) | 3 criteria |

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
Requirements: ADM-01 through ADM-08
Success criteria:
1. Admin can approve/reject listings and verify subscription payments
2. Admin can add/edit public parking data directly
3. Admin dashboard shows key metrics and export functionality
4. Manual subscription management works for renewal and expiry

---

*Roadmap created: 2026-04-12*
*Last updated: 2026-04-12 after initial creation*
