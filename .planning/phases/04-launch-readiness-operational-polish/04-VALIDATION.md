---
phase: 04
slug: launch-readiness-operational-polish
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-19
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (inherited) |
| **Quick run command** | `npx vitest run tests/phase-04.test.tsx` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/phase-04.test.tsx`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | ADM-03 | T-04-01 | Input validation via Zod | unit | `npx vitest run tests/phase-04.test.tsx` | ✅ | ✅ green |
| 04-01-03 | 01 | 1 | ADM-03 | T-04-02 | Session check before insert | unit | `npx vitest run tests/phase-04.test.tsx` | ✅ | ✅ green |
| 04-02-01 | 02 | 1 | NAV-01 | — | Valid Google Maps URL structure | unit | `npx vitest run tests/phase-04.test.tsx` | ✅ | ✅ green |
| 04-02-03 | 02 | 1 | SEO-01..05 | T-04-03 | Metadata presents correct tags | unit | `npx vitest run tests/phase-04.test.tsx` | ✅ | ✅ green |
| 04-03-01 | 03 | 2 | PERF-01 | — | Priority/Lazy loading logic | unit | `npx vitest run tests/phase-04.test.tsx` | ✅ | ✅ green |
| 04-03-03 | 03 | 2 | PERF-01 | — | Image format/patterns in config | unit | `npx vitest run tests/phase-04.test.tsx` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SEO Visibility | SEO-01..05 | Search engine crawling behavior | Use Lighthouse / Google Search Console |
| 4G Performance | PERF-01 | Real-world network variance | Simulation via DevTools Throttling |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-19

---

## Validation Audit 2026-04-19
| Metric | Count |
|--------|-------|
| Gaps found | 4 |
| Resolved | 4 |
| Escalated | 0 |
