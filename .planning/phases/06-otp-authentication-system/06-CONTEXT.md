# Phase 06: OTP Authentication System - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning
**Source:** User Request (Direct Implementation Plan)

<domain>
## Phase Boundary

This phase implements a custom OTP-based authentication system using Fast2SMS as the SMS gateway, replacing or augmenting the existing Supabase Auth SMS flow. It covers OTP generation, delivery, verification, rate limiting, lockout, session management (JWT), and admin whitelist enforcement.

</domain>

<decisions>
## Implementation Decisions

### Gateway: Fast2SMS
- Use Fast2SMS API for sending transactional OTPs.
- Preferred over MSG91 for MVP due to simpler API, lower cost, and no DLT registration requirement for transactional OTP in testing phase.

### OTP Logic (AUTH-01, AUTH-02, AUTH-05)
- Generate a 6-digit numeric OTP.
- Store OTP hash and expiry in a dedicated `otp_sessions` table.
- **Expiry:** 5 minutes.
- **Lockout:** 3 failed attempts results in an account lockout (15 minutes or as per config).
- **Cooldown:** 60-second wait before allowing another OTP request for the same mobile number.
- Response for resend attempt during cooldown must include `seconds_remaining`.

### Session Management (AUTH-03, AUTH-04)
- Issue a Supabase JWT session token on successful verification.
- **Session Expiry:** 30 days.
- Middleware must check token validity on protected routes and redirect to login if expired.

### Admin Enforcement (AUTH-06)
- Use an environment variable `ADMIN_WHITELISTED_MOBILES` (comma-separated list).
- Restrict OTP sending on admin-specific routes/actions to whitelisted numbers only.
- Assign 'admin' role upon verification for these numbers.

### the agent's Discretion
- Database schema for `otp_sessions`: `id`, `mobile`, `otp_hash`, `expires_at`, `attempts`, `locked_until`, `created_at`, `last_sent_at`.
- Use a dedicated library for SMS (`src/lib/sms.ts`).
- Secure hashing for OTPs (e.g., node native `crypto`).

</decisions>

<canonical_refs>
## Canonical References

### Existing Auth
- `src/app/api/auth/login/route.ts` — Current placeholder/basic auth logic.
- `src/lib/supabase.ts` — Supabase client configuration.

### Deployment & Config
- `.env.local` — Must include `FAST2SMS_API_KEY` and `ADMIN_WHITELISTED_MOBILES`.

</canonical_refs>

<specifics>
## Specific Ideas

### Plan 06-01: Fast2SMS integration and OTP send
- Endpoint: `POST /api/auth/send-otp`
- Logic: Validates mobile, checks cooldown, generates OTP, hashes it, stores in `otp_sessions`, sends via Fast2SMS.

### Plan 06-02: OTP verification with expiry and lockout
- Endpoint: `POST /api/auth/verify-otp`
- Logic: Checks `otp_sessions`, validates expiry, increments attempts on failure, locks on 3 fails, issues JWT on success.

### Plan 06-03: Resend OTP with cooldown
- Update `send-otp` to return `seconds_remaining` if cooldown active.

### Plan 06-04: Auto-logout on 30-day token expiry
- Middleware check + JWT configuration.

### Plan 06-05: Admin mobile whitelist enforcement
- Logic in both `send-otp` and `verify-otp` to handle admin roles and restrictions.

</specifics>

<deferred>
## Deferred Ideas
- Automated subscription engine (Razorpay) deferred to v2.
</deferred>

---

*Phase: 06-otp-authentication-system*
*Context gathered: 2026-04-19 via User Request*
