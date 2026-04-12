# WhereIsMyParking

## What This Is

WhereIsMyParking is a lean, validation-first parking discovery platform for urban India. It's a structured parking directory that aggregates public parking data and privately listed spaces, making them discoverable via location-based search. The MVP deliberately avoids booking complexity to validate demand, establish a comprehensive parking database, and generate recurring revenue through ₹499/month subscriptions for private space owners.

## Core Value

Urban Indian drivers find nearby parking in seconds through a single location-aware interface, eliminating time and fuel wasted circling for spaces.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Anonymous users can discover parking near their GPS location without login
- [ ] Parking owners can list spaces via OTP-authenticated mobile signup
- [ ] Private listings require ₹499/month subscription via UPI before going live
- [ ] Admin manually approves all private listings before public visibility
- [ ] Users can navigate to selected parking via Google Maps deep-link
- [ ] Platform displays distance, type, coverage, and availability hours for each space
- [ ] Admin can add public parking data directly to the platform
- [ ] Owner subscriptions expire after 30 days with 7-day grace period
- [ ] Listings auto-update to EXPIRED status when subscription lapses
- [ ] Admin can view pending listings, verify UTR payments, and manage subscriptions

### Out of Scope

- **Slot booking/reservation system** — Deferred to Phase 2; MVP is discovery-only to validate demand before building transactional infrastructure
- **Real-time availability updates** — Phase 3 with IoT sensor integration
- **Automated payment verification** — MVP uses manual UTR verification by admin; Razorpay recurring subscriptions in v2
- **Mobile native apps** — Web-first MVP; React Native apps planned for Phase 2
- **Multi-language support** — English only in MVP; Malayalam/Hindi/Tamil in Phase 2
- **User reviews/ratings** — Deferred to maintain lean MVP scope
- **Dynamic pricing** — Phase 4 intelligence features

## Context

**Strategic Position:**
- State-Level Winner of Young Innovators Programme (Government of Kerala), granting privileged access to official parking data and establishing credibility with local bodies
- First-mover advantage in Kerala; no structured multi-source parking directory exists today
- Lean startup approach: validate demand before building supply-side transactional infrastructure

**Target Geography:**
- Launch: Kerala + 2-3 Metro Cities (Mumbai, Bangalore, Chennai)
- Month 1-3 focus

**Initial Data Strategy:**
- Launch with placeholder/sample parking data
- Admin panel allows manual addition of public parking data
- Organic private listings from owners post-launch

**User Personas:**
1. **End Users (Drivers)**: Urban commuters, tourists, shoppers aged 20-55; mobile-first; need quick parking discovery
2. **Parking Space Owners**: Apartment/property owners with idle spaces seeking passive income; moderate tech literacy
3. **Platform Admin**: Internal team managing content quality, approvals, and subscription verification

**Technical Environment:**
- Modern JAMstack + BaaS architecture
- Mobile-first responsive design (320px breakpoint minimum)
- 4G mobile network baseline for performance targets

## Constraints

- **Tech Stack**: Next.js 14 (React), Supabase (PostgreSQL + PostGIS), Mapbox GL JS, Tailwind CSS — chosen for rapid development and easy React Native transition
- **Timeline**: 3-month MVP delivery (Month 1-3)
- **Performance**: Initial page load < 2.0s on 4G mobile; nearby parking API < 500ms
- **Payment Gateway**: UPI deep-link (Google Pay) only in MVP to minimize integration complexity
- **SMS Provider**: MSG91 or Fast2SMS for India-optimized OTP delivery
- **Authentication**: OTP-based mobile auth only; no email/password to reduce friction
- **Scalability Target**: 500 concurrent users at launch; 100K+ listings capacity without degradation
- **Security**: HTTPS/TLS 1.3, JWT HS256 tokens, OTP brute-force protection (3 attempts + 15-min lockout)
- **Uptime**: 99.5% SLA (Supabase + Vercel infrastructure)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Discovery-only MVP (no booking) | Validate demand before building complex transactional infrastructure; faster time to market; lower development cost | — Pending |
| Manual UTR verification | Avoid payment gateway integration complexity in MVP; acceptable for low initial volume; admin can verify in < 1 min per transaction | — Pending |
| Supabase as backend | Managed PostgreSQL with PostGIS for geospatial queries, built-in auth, RLS, real-time capabilities; reduces backend development time by ~60% | — Pending |
| Next.js over pure React SPA | SSR for public listing pages improves SEO discoverability; still React under the hood for easy React Native transition | — Pending |
| Mapbox over Google Maps | Superior rendering performance, generous free tier (50K monthly active users), better clustering for dense urban areas | — Pending |
| ₹499/month subscription pricing | Below market rate for premium listing services; low enough for individual owners; creates ~₹25K MRR at 50 listings (Month 3 target) | — Pending |
| Admin-whitelisted mobile numbers | Simplest secure admin access for MVP single-admin scenario; role-based access control deferred to Phase 2 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-12 after initialization*
