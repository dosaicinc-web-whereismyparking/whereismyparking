-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "ParkingType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "CoverageType" AS ENUM ('OPEN', 'COVERED', 'MULTI');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'REJECTED', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ListingModerationStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ParkingSourceType" AS ENUM ('OWNER_SUBMISSION', 'ADMIN_MANUAL', 'BULK_IMPORT');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING_PAYMENT', 'PENDING_VERIFICATION', 'ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'INACTIVE', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "userId" TEXT NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "otp_rate_limits" (
    "phone" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastSent" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),

    CONSTRAINT "otp_rate_limits_pkey" PRIMARY KEY ("phone")
);

-- CreateTable
CREATE TABLE "parking_listings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "location" geometry(Point, 4326) NOT NULL,
    "type" "ParkingType" NOT NULL,
    "coverage" "CoverageType" NOT NULL,
    "availableHours" JSONB,
    "status" "ListingStatus" NOT NULL DEFAULT 'PENDING',
    "moderationStatus" "ListingModerationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "rejectionCategory" TEXT,
    "rejectionNote" TEXT,
    "rejectionGuidance" TEXT,
    "notes" TEXT,
    "vehicleTypes" JSONB,
    "images" JSONB,
    "sourceType" "ParkingSourceType" NOT NULL DEFAULT 'OWNER_SUBMISSION',
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "sourceImportedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "archivedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resubmittedAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parking_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "upiId" TEXT,
    "utr" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "rejectionCategory" TEXT,
    "rejectionNote" TEXT,
    "gracePeriodEndsAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),
    "lastActionAt" TIMESTAMP(3),
    "auditTrail" JSONB,
    "amount" INTEGER NOT NULL DEFAULT 499,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_parking_records" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "type" "ParkingType" NOT NULL,
    "coverage" "CoverageType" NOT NULL,
    "availableHours" JSONB,
    "vehicleTypes" JSONB,
    "notes" TEXT,
    "images" JSONB,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_parking_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_activities" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "listingId" TEXT,
    "subscriptionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_userId_key" ON "admin_users"("userId");

-- CreateIndex
CREATE INDEX "parking_listings_location_idx" ON "parking_listings" USING GIST ("location");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_listingId_key" ON "subscriptions"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_utr_key" ON "subscriptions"("utr");

-- CreateIndex
CREATE INDEX "admin_activities_targetType_targetId_idx" ON "admin_activities"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_listings" ADD CONSTRAINT "parking_listings_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_listings" ADD CONSTRAINT "parking_listings_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "parking_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_activities" ADD CONSTRAINT "admin_activities_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_activities" ADD CONSTRAINT "admin_activities_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "parking_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_activities" ADD CONSTRAINT "admin_activities_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enable Row Level Security
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "parking_listings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "otp_rate_limits" ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- USERS Table Policies
-- -----------------------------------------------------------------------------

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON "users"
    FOR SELECT USING (auth.uid()::text = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON "users"
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE "userId" = auth.uid()::text)
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON "users"
    FOR UPDATE USING (auth.uid()::text = id);

-- -----------------------------------------------------------------------------
-- ADMIN_USERS Table Policies
-- -----------------------------------------------------------------------------

-- Only existing admins can see the admin list (direct check avoids infinite recursion)
CREATE POLICY "Admins can read admin_users" ON "admin_users"
    FOR SELECT USING (
        "userId" = auth.uid()::text
    );

-- -----------------------------------------------------------------------------
-- PARKING_LISTINGS Table Policies
-- -----------------------------------------------------------------------------

-- PUBLIC can read ACTIVE listings
CREATE POLICY "Anyone can read active listings" ON "parking_listings"
    FOR SELECT USING (status = 'ACTIVE');

-- Owners can read all their own listings (even INACTIVE/PENDING)
CREATE POLICY "Owners can read own listings" ON "parking_listings"
    FOR SELECT USING ("ownerId" = auth.uid()::text);

-- Admins can read all listings
CREATE POLICY "Admins can read all listings" ON "parking_listings"
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE "userId" = auth.uid()::text)
    );

-- Authenticated users can create listings
CREATE POLICY "Authenticated users can create listings" ON "parking_listings"
    FOR INSERT WITH CHECK (auth.uid()::text = "ownerId");

-- Owners can update their listings
CREATE POLICY "Owners can update own listings" ON "parking_listings"
    FOR UPDATE USING ("ownerId" = auth.uid()::text);

-- -----------------------------------------------------------------------------
-- SUBSCRIPTIONS Table Policies
-- -----------------------------------------------------------------------------

-- Owners can read their own subscriptions
CREATE POLICY "Owners can read own subscriptions" ON "subscriptions"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parking_listings 
            WHERE id = "listingId" AND "ownerId" = auth.uid()::text
        )
    );

-- Owners can create subscriptions for their listings
CREATE POLICY "Owners can create own subscriptions" ON "subscriptions"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM parking_listings 
            WHERE id = "listingId" AND "ownerId" = auth.uid()::text
        )
    );

-- Admins can read all subscriptions
CREATE POLICY "Admins can read all subscriptions" ON "subscriptions"
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE "userId" = auth.uid()::text)
    );

-- Admins can update subscriptions (verification)
CREATE POLICY "Admins can update subscriptions" ON "subscriptions"
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM admin_users WHERE "userId" = auth.uid()::text)
    );

-- -----------------------------------------------------------------------------
-- OTP_RATE_LIMITS Table Policies
-- -----------------------------------------------------------------------------

-- Admins only (for monitoring)
CREATE POLICY "Admins can read rate limits" ON "otp_rate_limits"
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE "userId" = auth.uid()::text)
    );
