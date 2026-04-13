# Phase 02: Owner Onboarding & Subscriptions - Research

**Date:** 2026-04-13
**Status:** Complete

## Technical Approach

### 1. Database Schema Updates
The current `schema.prisma` is missing a `Subscription` model and the `ownerId` field in `ParkingListing`.

```prisma
model Subscription {
  id              String             @id @default(cuid())
  listingId       String             @unique
  listing         ParkingListing     @relation(fields: [listingId], references: [id])
  ownerId         String
  owner           User               @relation(fields: [ownerId], references: [id])
  startDate       DateTime?
  endDate         DateTime?
  status          SubscriptionStatus @default(PENDING_PAYMENT)
  upiId           String?
  utr             String?            @unique
  verifiedAt      DateTime?
  createdAt       DateTime           @default(now())

  @@map("subscriptions")
}

enum SubscriptionStatus {
  PENDING_PAYMENT
  PENDING_VERIFICATION
  ACTIVE
  EXPIRED
}
```

### 2. PostGIS Geometry Insertion with Prisma
Prisma `Unsupported("geometry(Point, 4326)")` requires raw SQL for inserts and updates.

**Insertion Pattern:**
```typescript
const result = await prisma.$executeRaw`
  INSERT INTO parking_listings (id, name, address, location, type, coverage, status, "ownerId")
  VALUES (${id}, ${name}, ${address}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), ${type}, ${coverage}, 'PENDING', ${ownerId})
`;
```

### 3. UPI Deep Link Integration
The UPI intent URL format for Indian apps (GPay, PhonePe, Paytm):
`upi://pay?pa={PAYEE_ADDRESS}&pn={PAYEE_NAME}&am=499&cu=INR&tn=ParkingSub_{LISTING_ID}`

- `pa`: VPA/UPI ID of the merchant.
- `pn`: Merchant Name.
- `am`: Amount.
- `tn`: Transaction note (critical for UTR matching).

### 4. Subscription State Machine
| Action | Current Status | New Status | Trigger |
|--------|----------------|------------|---------|
| Create Listing | - | PENDING | Form Submission |
| Initiate Payment | PENDING | PENDING_PAYMENT | "Pay Now" Click |
| Submit UTR | PENDING_PAYMENT | PENDING_VERIFICATION | UTR Entry |
| Admin Verify | PENDING_VERIFICATION | ACTIVE | Admin Approval |
| Lapse + 7 days | ACTIVE | EXPIRED | Scheduled Check (v2) / Access Query (v1) |

### 5. Multi-Step Form (Owner Listing)
**Library:** React Hook Form + Zod.
**Steps:**
1. **Details:** Name, Address (Text).
2. **Location:** Mapbox Pin drop (Lat/Lng).
3. **Features:** ParkingType, CoverageType, Vehicle types.
4. **Subscription:** Pay 499 INR button + UTR input field.

## Dependencies
- `react-hook-form`: Form state management.
- `zod`: Schema validation.
- `lucide-react`: Icons for dashboard.

## Risk Assessment
- **Manual Verification Latency:** Users might be frustrated waiting for admin approval. *Mitigation:* Clear UX messaging about "24h verification window".
- **Duplicate UTRs:** Owners might try to reuse UTRs. *Mitigation:* Unique constraint on `utr` field in DB.
- **GPS Picking Accuracy:** Owners might put the pin in the wrong place. *Mitigation:* Reverse geocoding check (optional v2) or admin map review (Ph 3).

## Validation Architecture
- **Unit Tests:** Zod schema validation, UPI link generator.
- **API Tests:** Listing creation with raw SQL, UTR submission.
- **E2E Tests (Browser):** Form completion flow.
