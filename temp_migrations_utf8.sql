-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "ParkingType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "CoverageType" AS ENUM ('OPEN', 'COVERED', 'MULTI');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED');

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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parking_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_userId_key" ON "admin_users"("userId");

-- CreateIndex
CREATE INDEX "parking_listings_location_idx" ON "parking_listings" USING GIST ("location");

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


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
    FOR SELECT USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON "users"
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON "users"
    FOR UPDATE USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- ADMIN_USERS Table Policies
-- -----------------------------------------------------------------------------

-- Only existing admins can see the admin list
CREATE POLICY "Admins can read admin_users" ON "admin_users"
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- -----------------------------------------------------------------------------
-- PARKING_LISTINGS Table Policies
-- -----------------------------------------------------------------------------

-- PUBLIC can read ACTIVE listings
CREATE POLICY "Anyone can read active listings" ON "parking_listings"
    FOR SELECT USING (status = 'ACTIVE');

-- Owners can read all their own listings (even INACTIVE/PENDING)
CREATE POLICY "Owners can read own listings" ON "parking_listings"
    FOR SELECT USING (owner_id = auth.uid());

-- Admins can read all listings
CREATE POLICY "Admins can read all listings" ON "parking_listings"
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- Authenticated users can create listings
CREATE POLICY "Authenticated users can create listings" ON "parking_listings"
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Owners can update their listings
CREATE POLICY "Owners can update own listings" ON "parking_listings"
    FOR UPDATE USING (owner_id = auth.uid());

-- -----------------------------------------------------------------------------
-- SUBSCRIPTIONS Table Policies
-- -----------------------------------------------------------------------------

-- Owners can read their own subscriptions
CREATE POLICY "Owners can read own subscriptions" ON "subscriptions"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parking_listings 
            WHERE id = parking_id AND owner_id = auth.uid()
        )
    );

-- Owners can create subscriptions for their listings
CREATE POLICY "Owners can create own subscriptions" ON "subscriptions"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM parking_listings 
            WHERE id = parking_id AND owner_id = auth.uid()
        )
    );

-- Admins can read all subscriptions
CREATE POLICY "Admins can read all subscriptions" ON "subscriptions"
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- Admins can update subscriptions (verification)
CREATE POLICY "Admins can update subscriptions" ON "subscriptions"
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- -----------------------------------------------------------------------------
-- OTP_RATE_LIMITS Table Policies
-- -----------------------------------------------------------------------------

-- Admins only (for monitoring)
CREATE POLICY "Admins can read rate limits" ON "otp_rate_limits"
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

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

-- Only existing admins can see the admin list
CREATE POLICY "Admins can read admin_users" ON "admin_users"
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE "userId" = auth.uid()::text)
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

CREATE OR REPLACE FUNCTION search_nearby_parking(
  p_lng float,
  p_lat float,
  p_radius float,
  p_limit int,
  p_type text DEFAULT NULL,
  p_coverage text DEFAULT NULL,
  p_cursor_distance float DEFAULT NULL,
  p_cursor_id text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  name text,
  address text,
  type "ParkingType",
  coverage "CoverageType",
  "availableHours" jsonb,
  status "ListingStatus",
  longitude float,
  latitude float,
  distance float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.name, p.address, p.type, p.coverage, p."availableHours", p.status,
    ST_X(p.location::geometry) AS longitude,
    ST_Y(p.location::geometry) AS latitude,
    ST_Distance(p.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) AS distance
  FROM parking_listings p
  WHERE ST_DWithin(p.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius)
  AND p.status = 'ACTIVE'
  AND (p_type IS NULL OR p.type = p_type::"ParkingType")
  AND (p_coverage IS NULL OR p.coverage = p_coverage::"CoverageType")
  AND (
    p_cursor_distance IS NULL OR 
    (ST_Distance(p.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) > p_cursor_distance OR 
     (ST_Distance(p.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) = p_cursor_distance AND p.id > p_cursor_id))
  )
  ORDER BY distance ASC, p.id ASC
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalListings', (SELECT count(*) FROM parking_listings),
    'pendingListings', (SELECT count(*) FROM parking_listings WHERE "moderationStatus" = 'PENDING_REVIEW'),
    'activeSubscriptions', (SELECT count(*) FROM subscriptions WHERE status = 'ACTIVE'),
    'expiredSubscriptions', (SELECT count(*) FROM subscriptions WHERE status = 'EXPIRED'),
    'rejectedListings', (SELECT count(*) FROM parking_listings WHERE "moderationStatus" = 'REJECTED'),
    'publicListings', (SELECT count(*) FROM parking_listings WHERE type = 'PUBLIC'),
    'privateListings', (SELECT count(*) FROM parking_listings WHERE type = 'PRIVATE'),
    'revenue', (SELECT COALESCE(SUM(amount), 0) FROM subscriptions WHERE status = 'ACTIVE'),
    'recentActivity', (SELECT COALESCE(jsonb_agg(a), '[]'::jsonb) FROM (
        SELECT id, action, "targetType", "targetId", "createdAt" 
        FROM admin_activities 
        ORDER BY "createdAt" DESC 
        LIMIT 5
      ) a)
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION verify_subscription(
  p_subscription_id text,
  p_action text,
  p_actor_user_id text,
  p_extension_days int DEFAULT 7,
  p_rejection_category text DEFAULT NULL,
  p_rejection_note text DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub record;
  v_now timestamp := now();
  v_next_end_date timestamp;
  v_sub_status "SubscriptionStatus";
  v_listing_status "ListingStatus";
  v_listing_moderation "ListingModerationStatus";
  v_audit_entry jsonb;
BEGIN
  -- 1. Fetch current subscription
  SELECT * INTO v_sub FROM subscriptions WHERE id = p_subscription_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Subscription not found');
  END IF;

  -- 2. Logic for dates and status
  v_next_end_date := COALESCE(v_sub."endDate", v_now);
  IF p_action = 'EXTEND' THEN
    v_next_end_date := v_next_end_date + (p_extension_days || ' days')::interval;
    v_sub_status := 'ACTIVE';
  ELSIF p_action IN ('APPROVE', 'ACTIVATE', 'RENEW') THEN
    v_next_end_date := v_now + interval '1 month';
    v_sub_status := 'ACTIVE';
  ELSIF p_action = 'DEACTIVATE' THEN
    v_sub_status := 'INACTIVE';
  ELSIF p_action = 'REJECT' THEN
    v_sub_status := 'REJECTED';
  ELSE
    RETURN jsonb_build_object('error', 'Invalid action');
  END IF;

  v_listing_status := CASE WHEN v_sub_status = 'ACTIVE' THEN 'ACTIVE'::"ListingStatus" ELSE 'INACTIVE'::"ListingStatus" END;
  v_listing_moderation := CASE WHEN p_action = 'REJECT' THEN 'REJECTED'::"ListingModerationStatus" ELSE 'APPROVED'::"ListingModerationStatus" END;

  -- 3. Check duplicate UTR on APPROVE
  IF p_action = 'APPROVE' AND v_sub.utr IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM subscriptions WHERE utr = v_sub.utr AND status = 'ACTIVE' AND id != p_subscription_id) THEN
      RETURN jsonb_build_object('error', 'Duplicate UTR');
    END IF;
  END IF;

  -- 4. Update Subscription
  v_audit_entry := jsonb_build_object(
    'action', p_action,
    'at', v_now,
    'actorUserId', p_actor_user_id,
    'rejectionCategory', p_rejection_category
  );

  UPDATE subscriptions SET
    status = v_sub_status,
    "startDate" = CASE WHEN p_action IN ('APPROVE', 'ACTIVATE', 'RENEW') THEN v_now ELSE "startDate" END,
    "endDate" = v_next_end_date,
    "verifiedAt" = CASE WHEN p_action IN ('APPROVE', 'RENEW', 'EXTEND') THEN v_now ELSE "verifiedAt" END,
    "verifiedById" = p_actor_user_id,
    "deactivatedAt" = CASE WHEN p_action = 'DEACTIVATE' THEN v_now ELSE NULL END,
    "rejectionCategory" = CASE WHEN p_action = 'REJECT' THEN p_rejection_category ELSE NULL END,
    "rejectionNote" = CASE WHEN p_action = 'REJECT' THEN p_rejection_note ELSE NULL END,
    "gracePeriodEndsAt" = CASE WHEN p_action = 'DEACTIVATE' THEN v_now + interval '7 days' ELSE NULL END,
    "lastActionAt" = v_now,
    "auditTrail" = COALESCE("auditTrail", '[]'::jsonb) || v_audit_entry
  WHERE id = p_subscription_id;

  -- 5. Update Listing
  UPDATE parking_listings SET
    status = v_listing_status,
    "moderationStatus" = v_listing_moderation,
    "rejectionCategory" = CASE WHEN p_action = 'REJECT' THEN p_rejection_category ELSE NULL END,
    "rejectionNote" = CASE WHEN p_action = 'REJECT' THEN p_rejection_note ELSE NULL END
  WHERE id = v_sub."listingId";

  RETURN jsonb_build_object('success', true, 'status', v_sub_status, 'listingId', v_sub."listingId");
END;
$$;

-- CreateTable
CREATE TABLE "otp_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3) WITH TIME ZONE,
    "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(),
    "last_sent_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT "otp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_sessions_phone_idx" ON "otp_sessions"("phone");

-- Enable Row Level Security
ALTER TABLE "otp_sessions" ENABLE ROW LEVEL SECURITY;

-- Admins can read/write all otp_sessions
CREATE POLICY "Admins can manage otp_sessions" ON "otp_sessions"
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE "userId" = auth.uid()::text)
    );

-- Lightweight bounding-box search that extracts coordinates from PostGIS geometry.
-- Used as Tier-2 fallback when search_nearby_parking RPC is unavailable.
CREATE OR REPLACE FUNCTION search_parking_bbox(
  p_lat float,
  p_lng float,
  p_radius_km float DEFAULT 5,
  p_type text DEFAULT NULL,
  p_coverage text DEFAULT NULL,
  p_limit int DEFAULT 150
)
RETURNS TABLE (
  id text,
  name text,
  address text,
  type text,
  coverage text,
  "availableHours" jsonb,
  status text,
  latitude float,
  longitude float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    p.id,
    p.name,
    p.address,
    p.type::text,
    p.coverage::text,
    p."availableHours",
    p.status::text,
    ST_Y(p.location::geometry) AS latitude,
    ST_X(p.location::geometry) AS longitude
  FROM parking_listings p
  WHERE
    p.status = 'ACTIVE'
    AND ST_DWithin(
      p.location::geography,
      ST_Point(p_lng, p_lat)::geography,
      p_radius_km * 1000
    )
    AND (p_type IS NULL OR p.type::text = p_type)
    AND (p_coverage IS NULL OR p.coverage::text = p_coverage)
  LIMIT p_limit;
$$;

