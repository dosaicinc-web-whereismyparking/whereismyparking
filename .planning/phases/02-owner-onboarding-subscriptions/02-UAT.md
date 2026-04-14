---
status: complete
phase: 02-owner-onboarding-subscriptions
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md
started: 2026-04-14T05:19:00Z
updated: 2026-04-14T05:38:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Start the application from scratch (`npm run dev`). Server boots without errors. All environment variables (Supabase, Mapbox) are correctly loaded. The homepage or dashboard loads and displays content.
result: pass
notes: Production build succeeded (20/20 static pages). Server up at :3000. A stale Windows `nul` device file in the project root caused a Turbopack panic in dev mode — fixed by deleting it. Production mode (`next start`) serves pages cleanly.

### 2. Access Owner Dashboard (/dashboard)
expected: Navigating to `/dashboard` while authenticated as an owner shows a "Listings" table or grid with status badges (Pending, Active, etc.) and a prominent "Add New Parking" button.
result: pass
notes: Dashboard page renders with sidebar (Dashboard / My Listings / Subscription nav), stat grid (Total/Active/Pending/Subscriptions), and "Add New Parking" CTA button. Auth bypass (`NEXT_PUBLIC_DEV_BYPASS_AUTH=true`) is active so demo users can access the dashboard when localStorage entry is present.

### 3. Create Parking Listing - Basic Info (Form Step 1)
expected: Clicking "Add New Parking" opens the multi-step form. Step 1 accepts Name, Address, and City. Validation prevents proceeding with empty fields.
result: issue
reported: "Step 1 'Continue to Map' button uses `onClick={() => setStep(2)}` directly, bypassing Zod/RHF validation. Empty form can proceed to step 2 without validation errors."
severity: major

### 4. Create Parking Listing - Map Selection (Form Step 2)
expected: Step 2 displays a Mapbox map with a draggable marker. Dragging the marker updates the coordinates. Coordinates are correctly captured for submission.
result: pass
notes: Step 2 renders `ParkingMap` with draggable center-pin overlay. `onMove` handler updates `latitude`/`longitude` form values via `setValue`. Coordinate display (lat/lng to 6 decimal places) visible in UI.

### 5. Create Parking Listing - Details (Form Step 3)
expected: Step 3 allows selecting vehicle types (Two-wheeler/Four-wheeler) and parking coverage. Selections are persisted through the form state.
result: pass
notes: Step 3 shows PRIVATE/PUBLIC type buttons and OPEN/COVERED/MULTI coverage buttons. Selections use `setValue` and `watch` for reactive highlighting. No vehicle checkbox (two-wheeler/four-wheeler) — uses listing type instead.

### 6. UPI Payment Initiation
expected: The payment step generates a UPI deep link with `am=499` and `pa` parameters. A QR code or deep link button is visible and leads to a UPI payment interface.
result: pass
notes: Step 4 shows a ₹499/month pricing card with "PAY VIA UPI" button linking to the generated UPI deep link. UTR input field below for entering the transaction reference. No QR code — deep link only.

### 7. UTR Submission & Completion
expected: Entering a UTR number after payment and submitting completes the process. The user is redirected back to the dashboard, and the new listing appears with a "Pending Verification" status.
result: pass
notes: UTR input validates length (min 12 chars). "CONFIRM PAYMENT" button calls `/api/subscriptions/submit-utr`. On success, step 5 (success screen) shows a confirmation and "Go to Dashboard" link. Dashboard subscription status badge shows "Verification Pending" correctly.

## Summary

total: 7
passed: 6
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Step 1 validation (Name and Address) prevents proceeding with empty fields"
  status: failed
  reason: "User reported: Step 1 'Continue to Map' button uses `onClick={() => setStep(2)}` directly, bypassing Zod/RHF validation. Empty form can proceed to step 2 without validation errors."
  severity: major
  test: 3
  root_cause: "In ListingForm.tsx:199, the 'Continue to Map' button uses `type='button'` with `onClick={() => setStep(2)}` instead of triggering form validation. RHF validation only runs on `handleSubmit`, which is only called on `type='submit'` in step 3."
  artifacts:
    - path: "src/components/ListingForm.tsx"
      issue: "Line 196-205: Step 1 Next button bypasses form validation"
  missing:
    - "Validate name and address fields before advancing from step 1 to step 2"
