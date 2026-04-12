---
phase: 01-authentication-discovery-core
audited_at: 2026-04-13T03:34:00+05:30
threats_total: 13
threats_closed: 11
threats_open: 2
asvs_level: L1
---

# Phase 01 — Security Threat Verification

## Threat Register

| Threat ID | Category | Component | Disposition | Status | Evidence |
|-----------|----------|-----------|-------------|--------|---------|
| T-01-01 | Spoofing | OTP login | mitigate | **CLOSED** | Zod regex `/^\+91\d{10}$/` enforces Indian format. Supabase OTP has built-in 30-min expiry. `src/app/api/auth/login/route.ts:6` |
| T-01-02 | Tampering | Session tokens | mitigate | **CLOSED** | Supabase Auth handles JWT HS256 signing + auto-refresh. No custom JWT code. Session managed server-side. |
| T-01-03 | Repudiation | Admin actions | mitigate | **CLOSED** | `auth.audit_log_entries` in Supabase captures OTP events. Admin grants recorded via `admin_users` table lookup. |
| T-01-04 | Information Disclosure | User sessions | mitigate | **CLOSED** | No PII stored for anonymous users. ANON key scoped to public read. Session tokens not logged. |
| T-01-05 | Denial of Service | OTP spam | mitigate | **CLOSED** | 60s resend cooldown (`COOLDOWN_SECONDS=60`). 3-attempt lockout (`MAX_ATTEMPTS=3`). 15-min lockout (`LOCKOUT_MINUTES=15`). Counters in `otp_rate_limits` table. `route.ts:16-57` |
| T-01-06 | Elevation of Privilege | Admin access | mitigate | **CLOSED** | Admin whitelist check on `admin_users` table after OTP verify. Non-whitelisted numbers receive `isAdmin: false`. `route.ts:153-161` |
| T-01-07 | Tampering | DB records | mitigate | **OPEN** | RLS policies commented in schema.prisma but **not implemented** in `supabase/migrations/01_initial.sql`. Any authenticated user can currently write to all tables. |
| T-01-08 | Information Disclosure | Parking data | mitigate | **OPEN** | API filters `status = 'ACTIVE'` at application layer only. No DB-level RLS enforcing visibility. Direct DB access bypasses the filter. |
| T-01-09 | Denial of Service | Query performance | mitigate | **CLOSED** | GIST index on `parking_listings.location` present in migration (`CREATE INDEX ... USING GIST`). PostGIS ST_DWithin optimized. |
| T-01-10 | Information Disclosure | User location | accept | **CLOSED (accepted)** | Location is required for core "find parking near me" feature. No server-side location storage. Location stays client-side only. |
| T-01-11 | Tampering | Search parameters | mitigate | **CLOSED** | Zod validates: lat(-90..90), lng(-180..180), radius(0..5000m), type enum(PUBLIC\|PRIVATE), coverage enum(OPEN\|COVERED\|MULTI). All invalid inputs return 400. Verified in UAT. |
| T-01-12 | Denial of Service | Expensive queries | mitigate | **CLOSED** | Max radius 5km enforced by Zod (≤5000m). 5-min cache headers (`s-maxage=300`). GIST spatial index. Limit capped at 100 rows. |
| T-01-13 | Information Disclosure | Parking locations | accept | **CLOSED (accepted)** | Parking location data is public directory information. No sensitive user data included in listings. |

## Open Threats

### T-01-07 — Tampering: Database Records (OPEN)

**Risk:** Without RLS, any Supabase-authenticated request can INSERT/UPDATE/DELETE records in `users`, `admin_users`, `otp_rate_limits`, and `parking_listings` tables.

**Required Fix:** Add RLS policies to the migration:

```sql
-- Enable RLS on all tables
ALTER TABLE "parking_listings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "otp_rate_limits" ENABLE ROW LEVEL SECURITY;

-- Public can read active listings only
CREATE POLICY "public_read_active_listings"
ON "parking_listings" FOR SELECT
USING (status = 'ACTIVE');

-- Users can read their own profile
CREATE POLICY "users_read_own"
ON "users" FOR SELECT
USING (auth.uid()::text = id);

-- Admin: only server-side via service role
CREATE POLICY "admin_users_service_only"
ON "admin_users" FOR ALL
USING (false); -- Block all direct client access; use service role key server-side
```

**Remediation path:** Add a new migration file `02_rls_policies.sql` in Phase 2.

---

### T-01-08 — Information Disclosure: Parking Data (OPEN)

**Risk:** Application-layer `status = 'ACTIVE'` filter can be bypassed if DB is accessed directly. PENDING/EXPIRED listings could be exposed.

**Required Fix:** Covered by the same RLS policy as T-01-07 (`public_read_active_listings` policy). Same migration fix resolves both.

**Remediation path:** Resolved by T-01-07 fix.

## Accepted Risks

| Risk ID | Rationale | Accepted By |
|---------|-----------|-------------|
| T-01-10 | Location access required for core feature. Data stays client-side only. No server-side location storage. Privacy notice shown via "Location Access Required" overlay. | Phase 01 design decision |
| T-01-13 | Parking locations are inherently public directory information (street addresses). No PII or commercial-sensitivity. | Phase 01 design decision |

## Summary Threat Flags from SUMMARY.md

| Flag | File | Description | Resolution |
|------|------|-------------|------------|
| threat_flag: injection | `src/app/api/parking/nearby/route.ts` | Uses `$queryRawUnsafe` with manually constructed filters. | Parameters passed as `$n` placeholders. type/coverage filters validated via Zod enums before insertion. **CLOSED** |

## Security Audit Trail

### Audit 2026-04-13

| Metric | Count |
|--------|-------|
| Threats found | 13 |
| Closed | 11 |
| Open | 2 |
| Accepted | 2 |

**Auditor:** Automated (gsd-secure-phase)
**Audited files:** `src/app/api/auth/login/route.ts`, `src/app/api/parking/nearby/route.ts`, `src/lib/supabase.ts`, `src/hooks/useGeolocation.ts`, `supabase/migrations/01_initial.sql`, `prisma/schema.prisma`
