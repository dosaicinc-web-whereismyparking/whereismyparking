# Phase 06: OTP Authentication System - Validation

**Created:** 2026-04-19
**Phase:** 06
**Status:** In Progress

## Validation Architecture

Testing the OTP system requires simulating SMS delivery and verifying database state changes for rate limits and lockouts.

### Dimension 1: Functional Correctness
- **OTP Generation:** Verify 6-digit numeric randomness.
- **Verification:** Verify hash matching logic works for valid and invalid inputs.
- **Expiry:** Verify that OTPs older than 5 minutes are rejected.

### Dimension 2: Security & Lockout
- **Rate Limiting:** Verify 60s cooldown is enforced at the API level.
- **Lockout:** Verify that 3 failed attempts result in `locked_until` being set and further attempts blocked.
- **Whitelist:** Verify non-whitelisted numbers cannot reach the OTP send stage for admin actions.

### Dimension 3: SMS Integration
- **Fast2SMS API:** Verify correct payload structure and error handling for common API failures (low balance, invalid number).

### Dimension 4: Session Integrity
- **JWT Issuance:** Verify the issued token contains correct user ID and role claims.
- **Expiry:** Verify the session is invalidated after 30 days.

## Test Matrix

| Test ID | Scenario | Input | Expected Output |
|---------|----------|-------|-----------------|
| AUTH-V1 | Success Flow | Valid Mobile | SMS Sent, entry in DB |
| AUTH-V2 | Invalid OTP | Wrong Code | 401, attempts = 1 |
| AUTH-V3 | Lockout | Wrong Code x3 | 429, locked_until set |
| AUTH-V4 | Cooldown | Send then re-send < 60s | 429, seconds_remaining returned |
| AUTH-V5 | Admin Block | Non-whitelist + isAdmin=true | 403 Forbidden |

## Environmental Constraints
- **Secrets:** `FAST2SMS_API_KEY` must be active for E2E tests.
- **DB:** Local Supabase must be running with `otp_sessions` table.
