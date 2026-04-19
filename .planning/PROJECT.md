# WhereIsMyParking

## What This Is

WhereIsMyParking is a lean, validation-first parking discovery platform for urban India. It's a structured parking directory that aggregates public parking data and privately listed spaces, making them discoverable via location-based search. The v1.0 MVP provides anonymous discovery for drivers and a subscription-based listing platform for owners, managed through a central administrative command center.

## Core Value

Urban Indian drivers find nearby parking in seconds through a single location-aware interface, eliminating time and fuel wasted circling for spaces.

## Requirements

### Validated

- ✓ Anonymous users can discover parking near their GPS location without login — v1.0
- ✓ Parking owners can list spaces via OTP-authenticated mobile signup — v1.0
- ✓ Private listings require ₹499/month subscription via UPI before going live — v1.0
- ✓ Admin manually approves all private listings before public visibility — v1.0
- ✓ Users can navigate to selected parking via Google Maps deep-link — v1.0
- ✓ Platform displays distance, type, coverage, and availability hours for each space — v1.0
- ✓ Admin can add public parking data directly to the platform — v1.0
- ✓ Owner subscriptions expire after 30 days with 7-day grace period — v1.0
- ✓ Listings auto-update to EXPIRED status when subscription lapses — v1.0
- ✓ Admin can view pending listings, verify UTR payments, and manage subscriptions — v1.0

### Active

- [ ] Advanced analytics and reporting for administrators
- [ ] Export functionality for subscription and occupancy data
- [ ] Automated email/SMS notifications for subscription expiry
- [ ] User feedback and basic rating system for parking quality

### Out of Scope

- **Slot booking/reservation system** — Deferred to Phase 2; MVP is discovery-only to validate demand before building transactional infrastructure
- **Real-time availability updates** — Phase 3 with IoT sensor integration
- **Automated payment verification** — MVP uses manual UTR verification by admin; Razorpay recurring subscriptions in v2
- **Mobile native apps** — Web-first MVP; React Native apps planned for Phase 2
- **Multi-language support** — English only in MVP; Malayalam/Hindi/Tamil in Phase 2
- **Dynamic pricing** — Phase 4 intelligence features

## Context

**Current State (v1.0):**
- Shipped with ~5,200 LOC TypeScript/React.
- **Architectural Shift:** Migrated from Mapbox/Managed Supabase to **MapLibre GL JS** and **Self-Hosted Supabase** on a local Mac Mini (Docker) to ensure data sovereignty and control over PostGIS infrastructure.
- **Security:** Implemented robust OTP authentication with lockout protection and JWE session management.

**Strategic Position:**
- State-Level Winner of Young Innovators Programme (Government of Kerala).
- First-mover advantage in Kerala with a structured multi-source parking directory.

**Initial Data Strategy:**
- Admin panel manages public parking data repository.
- Support for owner-contributed private listings via OTP verification.

## Constraints

- **Tech Stack**: Next.js 15 (React 19), Supabase (PostgreSQL + PostGIS) — Self-Hosted, MapLibre GL JS, Tailwind CSS
- **Timeline**: 3-month MVP delivery (Month 1-3)
- **Performance**: Initial page load < 2.0s on 4G mobile; nearby parking API < 500ms
- **Payment Gateway**: UPI deep-link (Google Pay) with manual UTR verification
- **SMS Provider**: Fast2SMS for India-optimized OTP delivery
- **Authentication**: OTP-based mobile auth only; 30-day sessions
- **Scalability Target**: 500 concurrent users at launch; 100K+ listings capacity
- **Security**: HTTPS/TLS 1.3, JWT HS256 tokens, OTP brute-force protection (3 attempts + 15-min lockout)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Discovery-only MVP (no booking) | Validate demand before building complex transactional infrastructure | ✓ Good |
| Manual UTR verification | Avoid payment gateway integration complexity in MVP; acceptable for low volume | ✓ Good |
| Self- Hosted Supabase Stack | Data sovereignty and control over PostGIS; local operational stability | ✓ Good |
| MapLibre GL JS | Open-source alternative to Mapbox with full PostGIS support and no MAU limits | ✓ Good |
| OTP-Only Authentication | Reduces friction for Indian mobile users; eliminates password management debt | ✓ Good |
| Next.js App Router (v15) | Server-side rendering for SEO and modern React features like Server Actions | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-04-19 after v1.0 MVP Launch Readiness milestone*
