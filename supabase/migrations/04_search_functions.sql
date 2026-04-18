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
