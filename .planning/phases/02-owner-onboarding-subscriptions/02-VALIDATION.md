# Phase 02: Owner Onboarding & Subscriptions - Validation Strategy

**Phase:** 02
**Slug:** owner-onboarding-subscriptions
**Date:** 2026-04-13

## 1. Automated Testing

### Unit Tests (Vitest)
- **UPI Deep Link Generator:** Verify that `generateUpiLink()` produces correct `upi://` URLs with mandatory parameters.
- **Zod Schema Validation:** Test listing submission payloads (valid/invalid cases, GPS range checks).
- **Date Math:** Verify subscription expiry calculations (30 days + 7 days grace).

### Integration Tests (API)
- **POST /api/listings:** Verify that a new listing is created in `PENDING` status and geometry is correctly stored in PostGIS.
- **POST /api/subscriptions/initiate:** Verify a `PENDING_PAYMENT` record is created.
- **POST /api/subscriptions/submit-utr:** Verify transition to `PENDING_VERIFICATION`.
- **Admin Access Check:** Verify that whitelisted numbers (from env) can access admin-only APIs while others get 403.

## 2. Manual Verification (UAT)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as Owner via OTP | Success, redirected to Dashboard |
| 2 | Click "Add New Listing" | Multi-step form opens |
| 3 | Complete steps 1-3 | Data persisted locally in form state |
| 4 | Click "Pay & Submit" | UPI app opens / QR shown; redirected to UTR input |
| 5 | Submit dummy UTR | Listing status shows "Pending Admin Verification" |
| 6 | Admin Login | Access Admin Panel |
| 7 | Verify Listing | Listing status moves to "Active"; becomes visible on Map |

## 3. Security Validation

### Dimension 8: Nyquist Checks
- [ ] **Data Integrity:** Verify `utr` is unique across all subscriptions.
- [ ] **Access Control:** Confirm owners cannot edit listings they don't own.
- [ ] **Input Sanitization:** Validate Lat/Lng coordinates are within India's bounds (roughly Lat 6-38, Lng 68-98).
- [ ] **RLS verification:** Use `supabase gen types typescript` to ensure types match RLS-enabled tables.

## 4. Performance Gates
- **Listing Submission:** < 1s response time.
- **Dashboard Load:** < 500ms for active listing fetch.
