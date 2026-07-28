# WhereIsMyParking (WIMP) — Software Requirements Document (SRD)
### Version 1.0 (MVP) — PMF Validation Build

---

## 1. Purpose of This Document

This SRD defines the exact, minimum scope required to build and ship WIMP V1 for a single validation question:

> **Do people actually need a dedicated parking discovery platform?**

Nothing in this document exists to make the product complete. It exists to make the product *testable*, fast, and cheap. Anything not explicitly listed under Section 5 (In Scope) is out of scope by default — see Section 6.

---

## 2. Problem Statement

Drivers arriving in an unfamiliar area do not know where they can legally and conveniently park. General-purpose maps require manual searching, listing comparison, and guesswork to identify the nearest usable option. This is slow and frustrating, especially in dense urban areas, tourist zones, hospitals, commercial centers, and event venues in Kerala.

## 3. Core Value Proposition

**Convenience, above everything else.**

WIMP's entire differentiation is speed-to-decision. A user should go from "I need parking" to "I'm navigating to a spot" in **under 10 seconds**, with zero typing, zero comparison, zero login. Every requirement in this document is subordinate to this promise. If a feature adds a tap, a screen, or a second of load time without directly serving convenience, it does not belong in V1.

---

## 4. Target User & Primary Use Case

**Primary user:** A driver in an unfamiliar area (visitor, tourist, patient/attendant, event attendee) who needs to park *right now*, on a mobile device, likely on mobile data, possibly in a low-signal area.

**Primary use case (the only one V1 must nail):**
Open site → grant location → see nearest parking options ranked by distance → tap one → navigation app opens with the route.

There is no secondary persona in V1. Parking lot owners, businesses, and admins are explicitly **not** users of this version (see Section 6).

---

## 5. In-Scope Functional Requirements (V1)

### FR-1: Automatic Location Detection
- On page load, the app requests the browser Geolocation API for the user's current position.
- If permission is granted, proceed automatically — no manual address entry required.
- If permission is denied or unavailable, fall back to FR-6 (Location Fallback).

### FR-2: Nearby Parking Retrieval
- Query parking locations tagged in OpenStreetMap (`amenity=parking` and related tags), ingested statewide across Kerala (see Section 10), filtered at query time to within a configurable radius of the user's coordinates (default: 2 km, expandable if fewer than N results found).
- Retrieval must complete fast enough that total time-to-first-result stays within the 10-second UX budget (Section 8).

### FR-3: Distance-Based Ranking
- All retrieved parking locations are sorted by straight-line (or, if feasible without added latency, routed) distance from the user, nearest first.
- Display distance in meters/kilometers next to each result.

### FR-4: Clean Result Display
- Show a scannable list and/or map view of nearby parking lots.
- Each result shows: name (or generic label if untagged in OSM), distance, and a single primary action button ("Navigate").
- No secondary metadata that isn't verifiable from OSM (no fake ratings, no invented amenities).

### FR-5: One-Tap Navigation Handoff
- Tapping a result opens the user's default navigation app (Google Maps or equivalent) with the destination pre-filled, via a deep link / URL scheme.
- This is a handoff, not an in-app navigation build. WIMP does not render turn-by-turn directions itself.

### FR-6: Location Fallback (Permission Denied / Unavailable)
- If geolocation fails, allow a lightweight manual entry (e.g., a single search box for a locality/landmark name) as the only fallback — not a full search-and-filter UI.
- This path should be treated as the exception, not the primary flow, and should not add complexity to the happy path.

### FR-7: Empty State Handling
- If no parking locations are found within the search radius, show a clear, honest empty state (not a spinner that never resolves) and, where feasible, auto-expand the search radius once before declaring "none found nearby."

---

## 6. Explicitly Out of Scope (V1)

The following are **not** to be built, designed for, or stubbed in V1. Each is deferred to a "Recommended for Version 2" backlog:

| Excluded Feature | Reason |
|---|---|
| Slot booking / reservations | Not needed to validate discovery demand |
| Payments | No monetization in V1 |
| User accounts / login | Adds friction against the 10-second promise |
| Parking owner dashboard / self-onboarding | Data comes from OSM only in V1 |
| Reviews / ratings | Unverifiable, adds moderation burden |
| Push notifications | Not required for a single-session discovery flow |
| Real-time occupancy | Requires sensors/live data WIMP doesn't have yet |
| Subscriptions / monetization of any kind | Explicitly a non-goal for this phase |
| In-app turn-by-turn navigation | Reinventing what Google Maps already does well |

If a stakeholder proposes any of the above during the build, the response is: **"Recommended for Version 2"** — and the conversation returns to V1 scope.

---

## 7. Non-Functional Requirements

### NFR-1: Mobile-First, Mobile-Mandatory
- This is not "responsive design as an afterthought" — mobile is the **primary and assumed** platform. Desktop, if it works, is a byproduct, not a target.
- Layout, tap targets, font sizes, and interaction patterns are designed mobile-first from the first line of CSS.
- All primary actions (grant location, tap a result, navigate) must be reachable with one thumb, no pinch-zooming, no horizontal scrolling.

### NFR-2: Performance Budget
- Time from page load to visible parking results: **target under 5 seconds on 4G**, hard ceiling of 10 seconds end-to-end (load → results → navigate tap).
- Minimize JS bundle size; avoid heavy frameworks/libraries that don't earn their weight against this budget.
- Design for graceful behavior on low/inconsistent mobile signal — this is a realistic condition for the target user, not an edge case.

### NFR-3: Visibility & Readability
- Results must be legible in direct sunlight (common outdoor mobile-use condition) — sufficient contrast, no reliance on subtle color-only differentiation.
- Distance and the "Navigate" action must be the most visually dominant elements on each result — nothing competes with the convenience path.

### NFR-4: Low Infrastructure Cost
- Favor static/lightweight hosting, minimal or no backend server where possible, free-tier or open-source services.
- Avoid paid APIs unless a free/open alternative genuinely cannot meet FR-1 through FR-5.
- No infrastructure decision should be made "for scale" until the PMF signal (Section 9) justifies it.

### NFR-5: PWA-Ready
- Build as a responsive web app with PWA-readiness in mind (installable, works reasonably offline-tolerant for cached UI shell) — but a full offline data experience is not required in V1.

### NFR-6: Simplicity & Maintainability
- Single, lightweight codebase. No premature modularization for features that don't exist yet.
- Every dependency added must be justified against the performance budget in NFR-2.

---

## 8. Core User Flow (Happy Path)

```
1. User opens whereismyparking.com on mobile
2. Browser prompts for location permission
3. User grants permission
4. App fetches nearby parking (OSM) within radius
5. Results render, sorted nearest-first
6. User taps a result
7. Default navigation app opens with route pre-filled
   -----------------------------------------------
   Total elapsed time target: < 10 seconds
```

**Fallback path** (permission denied): Step 2 → user denies → lightweight manual location entry → continue from Step 4.

---

## 9. PMF Validation — Success Criteria

This section is intentionally part of the SRD, not a separate document, because build decisions should trace back to what's being measured.

**Primary metric:** % of sessions where a user taps "Navigate" on a result (this is the true intent signal — not page views, not time-on-site).

**Suggested instrumentation (lightweight, privacy-respecting):**
- Session started (location permission prompted)
- Location granted vs. denied (fallback usage rate)
- Results shown (count of parking lots returned)
- Result tapped → navigation opened (**the core conversion event**)
- Empty state hit (signals OSM data gaps by area)

**Decision framework (set now, not revisited mid-test):**

| Metric | Threshold | Why this number |
|---|---|---|
| Tap-through rate (sessions → "Navigate" tapped) | **≥ 25%** | One in four visitors completing the core action is a real intent signal for a zero-friction, single-purpose tool with no login/incentive to game it. Below 15% for the full window = kill or fundamentally rework, not "try longer." Between 15–25% = soft signal, worth one more iteration cycle before deciding. |
| Location-permission grant rate | **≥ 60%** | If most visitors deny location, the core UX (auto-detect) isn't trusted or isn't reaching the right audience — a distribution/trust problem, not a demand one. Track separately so a low tap-through rate isn't misdiagnosed. |
| Review window | **4 weeks or 300 sessions, whichever comes first** | Long enough to smooth out single-day noise (weekday vs. weekend parking behavior differs), short enough that a "no" gets acted on instead of quietly extended. |
| Empty-state rate | **> 20% in the pilot zone = pause and fix data, don't count that window toward the PMF verdict** | A high empty-state rate measures OSM coverage, not user demand — see Section 10. Re-run the clock once coverage is fixed. |

Once the window closes: ≥25% tap-through → move to V2 scoping. 15–25% → one focused iteration (usually radius tuning or result clarity) then re-test for 2 weeks. Below 15% with a healthy empty-state rate (data wasn't the problem) → the discovery-only wedge likely isn't strong enough on its own; revisit the premise rather than the UI.

---

## 10. Data Source & Architecture Notes

- **Primary data source:** OpenStreetMap, ingested statewide (all of Kerala) via Overpass API at build time — not scoped per-zone at the data layer. Ingestion breadth is decoupled from validation breadth: pulling full-state data is near-zero marginal cost/effort over a single zone, so there's no reason to gate it.
- **Validation/launch scope: to be finalized separately by founder.** Data availability across Kerala does not imply the PMF test itself runs statewide on day one — see the tap-through/empty-state risk noted in Section 9. This SRD will be updated once that scope is confirmed; until then, treat Section 9's thresholds as provisional and re-check them against whatever launch geography is ultimately chosen.
- **Before building the UI:** regardless of final validation scope, run at least the initial launch area(s) through Overpass to confirm parking tag density is sufficient — statewide ingestion doesn't guarantee even coverage district to district, and thin data in the actual launch zone is still a blocker.
- **Navigation handoff:** platform-appropriate deep link (e.g., `geo:` URI or Google Maps URL scheme) rather than building routing logic in-house.
- **Backend:** minimal or none — if OSM data can be queried client-side or through a thin cached proxy, prefer that over a full backend service, per NFR-4.

---

## 11. Assumptions & Risks

| Assumption / Risk | Notes |
|---|---|
| OSM parking data density is sufficient in pilot zone(s) | Must verify via Overpass query before build — see Section 10 |
| Browser geolocation accuracy is sufficient for ranking | Acceptable for V1; not GPS-lot-precise, and that's fine for "nearest few options" |
| Users have navigation apps installed / deep links resolve correctly | Standard on both Android and iOS; test deep link behavior on both before launch |
| No login means no way to build a returning-user cohort | Accepted trade-off — V1 optimizes for first-touch conversion, not retention |
| Zero monetization is temporary, not permanent | Revisit only after PMF signal is clear — do not let this scope creep in either direction during V1 build |

---

## 12. Version 2 Backlog (Not for Current Build)

Captured here only so nothing gets lost — **do not build against this section during V1**:

- Parking owner self-onboarding / dashboard
- Slot booking & reservations
- Payments
- User accounts
- Reviews & ratings
- Real-time occupancy
- Push notifications
- Monetization model (based on V1 PMF signal + owner-side willingness-to-pay conversations)

---

*Document status: Ready for MVP build. Any scope addition beyond Section 5 requires a conscious re-evaluation against Section 9's PMF question before implementation begins.*
