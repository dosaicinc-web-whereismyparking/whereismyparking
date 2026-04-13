# Requirements: WhereIsMyParking

**Defined:** 2026-04-12
**Core Value:** Urban Indian drivers find nearby parking in seconds through a single location-aware interface, eliminating time and fuel wasted circling for spaces

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: Send OTP to mobile number via SMS gateway (MSG91 / Fast2SMS)
- [x] **AUTH-02**: Verify OTP with 5-minute expiry and 3-attempt lockout
- [x] **AUTH-03**: Issue JWT session token on successful OTP verification
- [x] **AUTH-04**: Auto-logout on 30-day token expiry
- [x] **AUTH-05**: Resend OTP with 60-second cooldown
- [x] **AUTH-06**: Admin login restricted to whitelisted mobile numbers stored in env config

### Location Services

- [ ] **LOC-01**: Request browser/device GPS on page load with graceful fallback
- [ ] **LOC-02**: Allow manual city/area search if GPS is denied
- [ ] **LOC-03**: Calculate and display distance (km) from user to each listing
- [ ] **LOC-04**: Sort listings by distance ascending (nearest first) by default
- [ ] **LOC-05**: Display listings on an interactive map (Mapbox GL JS)
- [ ] **LOC-06**: Update results dynamically on map pan/zoom

### Parking Discovery (User-Side)

- [ ] **DISC-01**: Display list of nearby parking spaces with name, type, distance, address
- [x] **DISC-02**: Filter by type: Public / Private
- [x] **DISC-03**: Filter by coverage: Open-air / Covered / Multi-level
- [x] **DISC-04**: Show availability timing for each listing
- [ ] **DISC-05**: Navigate button: deep-link to Google Maps with destination coordinates
- [x] **DISC-06**: Show placeholder card when no parking found within 2 km radius

### Listing Management (Owner-Side)

- [ ] **LIST-01**: Owner can create a new parking listing via a multi-step form
- [ ] **LIST-02**: Listing form captures: Name, Address, GPS coordinates (map pin), Slot type, Coverage type, Available hours, Vehicle types accepted
- [ ] **LIST-03**: Listing is submitted in PENDING state - not visible to users until admin approves
- [ ] **LIST-04**: Owner dashboard shows all their listings with status tags (Pending / Active / Rejected / Expired)
- [ ] **LIST-05**: Owner can edit a listing; edited listing reverts to PENDING status for re-approval
- [ ] **LIST-06**: Listing becomes EXPIRED if subscription lapses for more than 7 days
- [ ] **LIST-07**: Owner can delete a listing (soft delete - retained in DB with deleted flag)

### Subscription & Payment (Owner-Side)

- [ ] **PAY-01**: Owner prompted to subscribe (₹499/month) before submitting a listing
- [ ] **PAY-02**: Payment flow: Owner enters UPI ID → platform shows UPI payment link / QR (₹499) → owner pays via Google Pay
- [ ] **PAY-03**: Owner submits UTR (transaction reference) for manual payment verification by admin
- [ ] **PAY-04**: Admin verifies UTR and activates subscription manually in MVP
- [ ] **PAY-05**: Subscription record includes: start date, end date, status (active/expired/cancelled)
- [ ] **PAY-06**: Email/SMS notification sent to owner 7 days before subscription expiry
- [ ] **PAY-07**: Automated subscription engine (Razorpay recurring) to be added in v2

### Admin Panel

- [x] **ADM-01**: Admin can view all private listing submissions with PENDING status
- [x] **ADM-02**: Admin can Approve or Reject a listing with an optional rejection reason
- [x] **ADM-03**: Admin can add, edit, or delete public parking data directly
- [x] **ADM-04**: Admin can view all registered owners with subscription status
- [x] **ADM-05**: Admin can manually activate/deactivate a subscription
- [x] **ADM-06**: Admin can view and verify UTR payment submissions
- [x] **ADM-07**: Admin dashboard shows KPIs: total listings, active subscriptions, pending approvals
- [x] **ADM-08**: Admin can export listings and user data as CSV

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Notifications

- **NOTF-01**: User receives in-app notifications
- **NOTF-02**: User receives email for new followers
- **NOTF-03**: User receives email for comments on own posts
- **NOTF-04**: User can configure notification preferences

### Moderation

- **MODR-01**: User can report content
- **MODR-02**: User can block other users
- **MODR-03**: Admin can view reported content
- **MODR-04**: Admin can remove content
- **MODR-05**: Admin can ban users

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time chat | High complexity, not core to community value |
| Video posts | Storage/bandwidth costs, defer to v2+ |
| OAuth login | Email/password sufficient for v1 |
| Mobile app | Web-first, mobile later |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| AUTH-06 | Phase 1 | Complete |
| LOC-01 | Phase 1 | Pending |
| LOC-02 | Phase 1 | Pending |
| LOC-03 | Phase 1 | Pending |
| LOC-04 | Phase 1 | Pending |
| LOC-05 | Phase 1 | Pending |
| LOC-06 | Phase 1 | Pending |
| DISC-01 | Phase 1 | Pending |
| DISC-02 | Phase 1 | Complete |
| DISC-03 | Phase 1 | Complete |
| DISC-04 | Phase 1 | Complete |
| DISC-05 | Phase 1 | Pending |
| DISC-06 | Phase 1 | Complete |
| LIST-01 | Phase 2 | Pending |
| LIST-02 | Phase 2 | Pending |
| LIST-03 | Phase 2 | Pending |
| LIST-04 | Phase 2 | Pending |
| LIST-05 | Phase 2 | Pending |
| LIST-06 | Phase 2 | Pending |
| LIST-07 | Phase 2 | Pending |
| PAY-01 | Phase 2 | Pending |
| PAY-02 | Phase 2 | Pending |
| PAY-03 | Phase 2 | Pending |
| PAY-04 | Phase 2 | Pending |
| PAY-05 | Phase 2 | Pending |
| PAY-06 | Phase 2 | Pending |
| ADM-01 | Phase 3 | Complete |
| ADM-02 | Phase 3 | Complete |
| ADM-03 | Phase 3 | Complete |
| ADM-04 | Phase 3 | Complete |
| ADM-05 | Phase 3 | Complete |
| ADM-06 | Phase 3 | Complete |
| ADM-07 | Phase 3 | Complete |
| ADM-08 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-12*
*Last updated: 2026-04-14 after Phase 3 execution*
