# Project Retrospective: WhereIsMyParking

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP Launch Readiness

**Shipped:** 2026-04-19
**Phases:** 6 | **Plans:** 24 | **Commits:** 46

### What Was Built
- **OTP Auth:** Secure login via Fast2SMS gateway with rate-limiting and session management.
- **Self-Hosted Infrastructure:** Production-ready Supabase stack on Mac Mini with MapLibre GL JS.
- **Admin Dashboard:** Centralized curate/approve flow for owner listings and public parking metadata.
- **Discovery Engine:** High-performance nearby search with recursive PostGIS distance logic.

### What Worked
- **Self-Hosting Shift (Phase 05):** Moving to a local stack early (Phase 05) resolved architectural friction that would have complicated Auth/PostGIS later.
- **Nyquist Validation:** Retroactively applying strict automated tests at milestone completion significantly improved confidence in the "Launch Readiness" phase.
- **MapLibre GL JS:** Proved to be a drop-in, cost-effective replacement for Mapbox for search results.

### What Was Inefficient
- **Phase 04 Validation Delay:** Postponing Phase 04 tests until the end caused rework during the audit. Verification should be "sampled" during task execution.
- **Next.js 15 Migration:** Initial mismatch in dev-origin configurations for the self-hosted stack took longer to resolve than pure feature work.

### Patterns Established
- **Service Role Proxying:** Using `/api/rpc` and `/api/rest` wrappers ensures frontend compatibility regardless of environment (local vs tunnel).
- **Admin Whitelisting:** Using mobile number whitelist is a low-friction/high-security strategy for early-stage internal tools.

### Key Lessons
1. **Infrastructure first:** Self-hosting constraints must be built into the CI/CD and testing logic from Day 1.
2. **Geospatial indexing:** PostGIS performance GIST indexes are critical for <500ms targets as the dataset grows.

### Cost Observations
- Notable: Using 4-6 small plans per phase (e.g. Phase 06) allowed for precise git commits and better "gsd" tracking than large monolithic plans.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~20 | 6 | Transition to Self-Hosted stack mid-milestone. |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 12 | 85% | 1 (Fast2SMS wrapper) |

### Top Lessons (Verified Across Milestones)

1. **Validation-first:** Automated req-mapping keeps the roadmap honest.
