# Project Research Summary

**Project:** WhereIsMyParking
**Domain:** Location-based parking discovery platform
**Researched:** 2026-04-12
**Confidence:** HIGH

## Executive Summary

WhereIsMyParking is a location-based parking discovery platform targeting urban India, particularly Kerala and major metros, with a discovery-only MVP that aggregates both public and private parking listings. Experts in this domain emphasize mobile-first UX, geospatial database performance, and robust payment handling in the Indian context, with a focus on managed services like Supabase for rapid MVP delivery. The recommended approach leverages a JAMstack architecture with Next.js, PostGIS for spatial queries, and UPI deep-links for subscriptions, prioritizing supply-side monetization through owner subscriptions over user-side transactions to validate demand without booking complexity.

Key risks include stale data accumulation without transactional feedback, GPS accuracy failures in urban environments, UPI payment brittleness during peak loads, and PostGIS query performance degradation at scale. Mitigation requires proactive staleness indicators, battery-optimized location polling, automated UTR verification workflows, and proper geospatial indexing from day one. The lean discovery approach avoids premature booking implementation while building a foundation for transactional expansion when demand is validated.

## Key Findings

### Recommended Stack

WhereIsMyParking requires a mobile-first, location-aware stack optimized for sub-2s page loads on 4G networks and sub-500ms geospatial queries. The recommended JAMstack approach uses Next.js 15 for SSR and React foundation, Supabase with PostGIS for spatial data and auth, Mapbox for interactive maps, and UPI deep-links with manual UTR verification for India-specific payments. This enables 3-month MVP delivery with zero DevOps and seamless mobile transition.

**Core technologies:**
- **Next.js + React + TypeScript:** Full-stack React framework with SSR for SEO and mobile-first responsive design — enables zero-friction React Native migration and TypeScript safety
- **Supabase + PostGIS:** Managed PostgreSQL with geospatial queries and RLS auth — handles sub-500ms nearby searches and multi-tenant data isolation
- **Mapbox GL JS:** Interactive vector maps with clustering — superior performance for dense markers and native React Native SDK for mobile
- **UPI deep-links + MSG91 SMS:** India-optimized payments and OTP — avoids gateway fees and KYC delays for MVP

### Expected Features

Parking platforms require clear differentiation between discovery-only (MVP focus) and full booking systems. Table stakes include location-based search, real-time availability display, parking details, and mobile-first UX. Differentiators include pre-booking, EV charging filters, and reviews, but these are deferred to post-validation phases. Anti-features like custom navigation, automated payments, and IoT sensors should be explicitly avoided.

**Must have (table stakes):**
- Location-based search — core value proposition users expect
- Parking details (hours, type, price) — decision-making data
- Mobile-responsive UI — 90% of searches on mobile
- Price transparency — no hidden fees

**Should have (competitive):**
- EV charging spot filtering — growing EV market segment
- User reviews & ratings — trust signal
- Loyalty/rewards program — increases retention

**Defer (v2+):**
- Pre-booking/reservation — add after demand validation
- Real-time IoT sensor integration — high cost, low ROI pre-validation
- Dynamic pricing — requires transaction history

### Architecture Approach

WhereIsMyParking follows a 4-layer serverless JAMstack architecture with clean separation between presentation (Next.js SSR), application (API routes with business logic), data (Supabase PostGIS with RLS), and infrastructure (Vercel, Mapbox, UPI). This emphasizes geospatial queries with PostGIS GiST indexes, subscription state machines, and managed services for rapid MVP iteration.

**Major components:**
1. **Presentation Layer:** Next.js App Router with hybrid rendering for SEO and interactive maps
2. **Application Layer:** API routes for geospatial proximity searches and subscription management
3. **Data Layer:** Supabase PostgreSQL with PostGIS spatial functions and Row Level Security
4. **Infrastructure Layer:** Vercel CDN, Mapbox tiles, MSG91 SMS, and UPI deep-links

### Critical Pitfalls

Top pitfalls include stale data cascade (trust killer without feedback loops), GPS accuracy crisis in urban canyons (battery drain and location drift), UPI payment brittleness (outages during peaks), and PostGIS performance cliff (sequential scans at scale). Avoid by implementing staleness indicators, battery-optimized polling, automated verification workflows, and ST_DWithin() filters with GiST indexes.

1. **Stale Data Cascade** — Implement automated expiry, crowdsourced validation, and staleness indicators to prevent trust erosion
2. **GPS Accuracy Crisis** — Use battery-optimized polling, manual address fallback, and Google Maps deep-links for indoor navigation
3. **UPI Payment Brittleness** — Build UTR auto-match dashboard, add payment status polling, and prepare Razorpay migration for Phase 2
4. **PostGIS Performance Cliff** — Always use ST_DWithin() with GiST indexes, monitor query performance, and schedule VACUUM maintenance

## Implications for Roadmap

Based on research, suggested phase structure prioritizes discovery validation, supply monetization, and gradual transactional complexity addition.

### Phase 1: Discovery MVP
**Rationale:** Validates core parking search need and builds supply-side revenue before adding booking complexity, following lean startup principles from research
**Delivers:** Functional web app with parking listings, owner subscriptions, and admin approval workflow
**Addresses:** Location-based search, parking details, mobile-responsive UI, price transparency from table stakes
**Avoids:** Stale data cascade through automated expiry and staleness indicators; GPS accuracy issues via optimized polling and fallbacks

### Phase 2: Booking & Real-time Features
**Rationale:** Adds transactional revenue once discovery demand validated, leveraging existing architecture for seamless integration
**Delivers:** Pre-booking system, user accounts, real-time availability, and EV charging filters
**Uses:** Razorpay Payment Links (migrating from manual UPI), Supabase Realtime, and expanded PostGIS queries from stack
**Implements:** Subscription state machine with automated payments and entrance precision from architecture patterns

### Phase 3: Scale & Advanced Features
**Rationale:** Handles growth with horizontal scaling and AI features once sufficient transaction data exists
**Delivers:** Dynamic pricing, predictive availability (AI), and multi-city expansion
**Uses:** Partitioning, read replicas, and materialized views from architecture scalability roadmap

### Phase Ordering Rationale

- MVP first to validate demand without booking complexity, avoiding over-building trap seen in failed startups
- Booking second after supply validation, using transactional feedback to address stale data pitfall
- Scale third with data-driven features, leveraging PostGIS performance patterns and AI research
- This grouping minimizes risks by deferring high-complexity features until patterns are proven

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Real-time availability sync and concurrent booking conflicts — need phase-specific research on optimistic locking
- **Phase 3:** IoT sensor integration — evaluate providers vs. DIY hardware for cost/accuracy trade-offs

Phases with standard patterns (skip research-phase):
- **Phase 1:** Core discovery features — well-documented patterns in parking platforms
- **Phase 2:** Payment gateway migration — standard SaaS billing patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified via official Next.js, Supabase, Mapbox releases and parking platform case studies |
| Features | HIGH | Consistent patterns across 10+ global platforms; directly relevant to Indian market |
| Architecture | HIGH | Established JAMstack patterns with PostGIS best practices from official documentation |
| Pitfalls | HIGH | Validated by real-world case studies, 2026 parking reports, and user behavior research |

**Overall confidence:** HIGH

### Gaps to Address

- Willingness-to-pay for premium features in Indian market — validate during Phase 1 user research
- Real-time availability refresh intervals — test with Phase 1 analytics to determine user tolerance
- Admin approval friction impact — A/B test automated vs. manual approval in Phase 1

## Sources

### Primary (HIGH confidence)
- Next.js 15 release docs — SSR patterns and React 19 compatibility
- Supabase PostGIS guide — geospatial query optimization and RLS auth
- Mapbox ParkBee case study — production parking discovery architecture
- Carparking.App 2026 reports — parking data quality and pricing pitfalls
- NPCI 2026 outage reports — UPI payment reliability issues

### Secondary (MEDIUM confidence)
- DXB Apps 2026 feature guide — global parking platform comparison
- RAC 2025 parking app study — user behavior and GPS issues
- Medium PostGIS performance articles — query optimization patterns

### Tertiary (LOW confidence)
- Forum user reports — anecdotal GPS and payment experiences, needs validation

---
*Research completed: 2026-04-12*
*Ready for roadmap: yes*