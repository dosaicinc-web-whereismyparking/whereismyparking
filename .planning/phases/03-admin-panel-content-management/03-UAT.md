---
status: testing
phase: 03-admin-panel-content-management
source: [03-00-SUMMARY.md, 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md]
started: 2026-04-14T03:58:00Z
updated: 2026-04-14T03:58:00Z
---

## Current Test

number: 1
name: Cold Start Smoke Test
expected: |
  Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: |
  Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
result: [pending]

### 2. Admin Dashboard Overview
expected: |
  Logging into the dashboard as an admin displays the Action Center. KPI cards (Approved, Pending, Revenue) should be visible at the top. Below, the "Listing Priority Queue" and "Payment Review Queue" should be populated with data if available.
result: [pending]

### 3. Listing Moderation Flow
expected: |
  Selecting a listing from the queue opens the details. Clicking "Reject" should open a structured rejection modal requiring a category (e.g., "Blurry Photos", "Invalid Address"). Submitting the rejection should move the listing out of the pending queue.
result: [pending]

### 4. Subscription Verification
expected: |
  Navigating to the "Payments" or "Subscriptions" tab allows review of pending manual payments. Marking a payment as "Verified" should activate the corresponding subscription and listing, verified by checking the user's dashboard or listing status.
result: [pending]

### 5. Public Parking Management
expected: |
  Navigating to the "Public Parking" section allows adding a new entry. Creating a record should show it in the table. Clicking "Archive" should mark the record as inactive/archived, and it should no longer appear as active but remain visible in the archive view if one exists.
result: [pending]

### 6. Owner Reporting & CSV Export
expected: |
  Navigating to the "Owners" section shows a list of registered space owners with their subscription lifecycle status. Clicking "Export" on any table should trigger a server-side CSV generation and download of the corresponding dataset (Listings, Owners, or Subscriptions).
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0

## Gaps

[none yet]
