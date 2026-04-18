# Phase 06: OTP Authentication System - Research

**Researched:** 2026-04-19
**Phase:** 06

## Summary
The goal is to implement a robust Indian-market-optimized OTP system using Fast2SMS. This replaces the default Supabase SMS flow for cost and simplicity reasons.

## Technical Findings

### Fast2SMS API
- **Endpoint:** `https://www.fast2sms.com/dev/bulkV2`
- **Method:** POST
- **Headers:** `authorization: <API_KEY>`
- **Payload:**
  - `route: "otp"` (Direct OTP route)
  - `variables_values: <6-digit-code>`
  - `numbers: <phone-number>`
- **Behavior:** Delivers as "Your OTP: 5599".

### OTP Security Best Practices
- **Storage:** Never store raw OTPs. Use SHA-256 hashing.
- **Salt:** Use a unique salt per mobile number or a global secret pepper.
- **Expiry:** 300 seconds (5 minutes) is standard for transactional OTPs.
- **Throttling:** 60-second cooldown is recommended to avoid carrier spam filters.

### Supabase Session Integration
- To issue a session manually after verification:
  - Use `supabaseAdmin.auth.admin.createSession({ userId, expiresIn: 2592000 })` (30 days).
  - Ensure the user is created/linked to the phone number in `auth.users`.

## Dependencies
- `crypto` (node built-in) for hashing.
- `zod` for input validation.
- `supabase-js` for DB and session issuance.

## References
- [Fast2SMS Dev API Documentation](https://www.fast2sms.com/docs/)
- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-createsession)
