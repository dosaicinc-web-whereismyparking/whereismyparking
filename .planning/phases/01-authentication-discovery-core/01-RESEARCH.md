# Phase 01: Research

**Researched:** 2026-04-12

**Status:** Complete

**Researcher:** gsd-phase-researcher

## Summary

This phase implements the core user-facing functionality: anonymous parking discovery with location services. The technical stack is well-established (Next.js 15, Supabase, Mapbox GL JS), so research focused on implementation patterns, performance considerations, and India-specific constraints.

## Technical Approaches

### Authentication (AUTH-01 to AUTH-06)

**OTP Flow with Supabase Auth:**
- Use `supabase.auth.signInWithOtp({ phone })` for sending OTP
- Supabase handles SMS via configured provider (MSG91)
- OTP expiry: 5 minutes (Supabase default)
- Attempt lockout: Implement custom logic since Supabase doesn't have built-in (use RLS policy on `auth.audit_log_entries`)
- JWT tokens: HS256, auto-refresh
- Admin whitelist: Store admin mobiles in `admin_users` table, check in RLS policies

**Security Considerations:**
- No password complexity (OTP only)
- Rate limiting for OTP requests (60s cooldown)
- Brute-force protection (3 attempts + 15min lockout)
- HTTPS/TLS 1.3 required for production

### Location Services (LOC-01 to LOC-06)

**Geolocation API:**
- Browser native: `navigator.geolocation.getCurrentPosition()`
- Permissions: Handle denied with manual city search fallback
- Accuracy: Use `enableHighAccuracy: true` for better precision
- Timeout: 10 seconds fallback

**PostGIS Queries:**
- ST_Distance for radius search (< 2km)
- ST_DWithin for optimized spatial queries
- GIST indexes on geometry column for <500ms performance
- Lat/long stored as PostGIS geometry type

**Map Integration:**
- Mapbox GL JS v3.21.0 for web
- react-map-gl v8.1.0 wrapper
- Clustering for dense areas (100+ pins)
- Dynamic updates on pan/zoom

### Parking Discovery (DISC-01 to DISC-06)

**Data Model:**
- Parking table with geometry, type, coverage, hours
- Public vs private listings (separate tables or status column)
- Availability timing stored as JSON or separate table

**UI Patterns:**
- List view with distance sorting
- Map view with pins
- Filters: type, coverage
- Navigation deep-links to Google Maps

**Performance:**
- Paginate results (50 per page)
- Cache frequent queries
- Lazy load map tiles

## Implementation Patterns

### API Routes
- `/api/auth/login` for OTP send/verify
- `/api/parking/nearby` for geospatial search
- Use Next.js App Router (v15)

### Database Schema
- `parking_listings` table with PostGIS geometry
- `users` table for owners (OTP auth)
- RLS policies for data isolation

### UI Components
- Shadcn/ui for consistent design
- Tailwind CSS for responsive mobile-first
- Dark mode optional (not required)

## Dependencies & Integrations

### External Services
- Supabase: Auth, DB, Storage
- Mapbox: Maps (50K MAU free)
- MSG91: SMS OTP (₹0.25/SMS)

### Libraries
- @supabase/supabase-js
- mapbox-gl
- react-map-gl
- zod (validation)
- react-hook-form

## Risks & Mitigations

### Performance
- PostGIS query optimization critical for <500ms
- Map rendering on mobile (vector tiles help)
- Geolocation on slow networks (fallback to city search)

### Security
- OTP brute-force (implement attempt counting)
- Data privacy (no PII storage for anonymous users)
- HTTPS mandatory

### India-Specific
- UPI payments in later phase (not this one)
- Regional SMS reliability (MSG91 has good coverage)
- Mobile-first UX (4G speeds)

## Open Questions (RESOLVED)

1. **How to handle OTP brute-force protection in Supabase?**
   - *Resolution:* Implement custom attempt tracking in a `login_attempts` table or check `auth.audit_log_entries` via RLS/Edge Functions. Plan 01 uses a custom counter logic.

2. **Is PostGIS required for 2km radius search?**
   - *Resolution:* Yes, for high performance and accuracy on dense parking data. ST_DWithin with GIST index is the standard approach.

3. **Should admin whitelist be in DB or ENV?**
   - *Resolution:* `REQUIREMENTS.md` mentions ENV, but research suggests DB table `admin_users` for better RLS integration and scalability. We will implement via DB table with an initial migration.

## Validation Architecture

### Dimension 1: Functional Completeness
- OTP send/receive works
- Geolocation permission flow
- Nearby search returns results
- Map displays pins correctly

### Dimension 2: Performance
- Page load <2s on 4G
- Search <500ms
- Map render <1s for 1000 pins

### Dimension 3: Security
- OTP expiry enforced
- Lockout on attempts
- No unauthorized access

### Dimension 4: Usability
- Fallback on GPS deny
- Clear error messages
- Mobile-responsive

### Dimension 5: Reliability
- Graceful degradation
- Error boundaries
- Offline map support (Phase 2)

### Dimension 6: Maintainability
- TypeScript coverage
- Component reusability
- Database migrations

### Dimension 7: Compliance
- TRAI SMS compliance (DLT registration)
- Data protection (minimal data collection)

### Dimension 8: Testability
- Unit tests for business logic
- E2E for critical flows
- Mock geolocation for testing

## Recommendations

1. **Start with Authentication** - Foundation for owner features in Phase 2
2. **Parallelize Location and Discovery** - Independent but related
3. **Test on Real Devices** - Geolocation and maps vary by device/browser
4. **Monitor SMS Delivery** - India has variable telecom reliability
5. **Plan for Scalability** - PostGIS optimization from day 1

This research provides the technical foundation for planning Phase 1 implementation.

---

*Phase 01 researched: 2026-04-12*
*Researcher: gsd-phase-researcher*