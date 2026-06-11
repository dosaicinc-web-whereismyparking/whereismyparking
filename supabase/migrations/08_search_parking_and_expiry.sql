-- ─────────────────────────────────────────────────────────────────────────────
-- 08: Autocomplete search RPC + subscription lifecycle (expiry/grace) automation
-- ─────────────────────────────────────────────────────────────────────────────

-- H2 FIX ──────────────────────────────────────────────────────────────────────
-- Text autocomplete used by /api/parking/search (was calling a non-existent
-- `search_parking` function, so DB-backed suggestions silently never appeared).
-- Matches name/address on ACTIVE listings and returns coordinates for the map.
CREATE OR REPLACE FUNCTION search_parking(
  p_query text,
  p_limit int DEFAULT 8
)
RETURNS TABLE (
  id text,
  name text,
  address text,
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
    ST_Y(p.location::geometry) AS latitude,
    ST_X(p.location::geometry) AS longitude
  FROM parking_listings p
  WHERE p.status = 'ACTIVE'
    AND (
      p.name ILIKE '%' || p_query || '%'
      OR p.address ILIKE '%' || p_query || '%'
    )
  ORDER BY
    -- Prefix matches on the name rank highest, then everything else.
    (p.name ILIKE p_query || '%') DESC,
    p.name ASC
  LIMIT GREATEST(p_limit, 1);
$$;

-- C3 FIX ──────────────────────────────────────────────────────────────────────
-- There was no mechanism transitioning subscriptions/listings out of ACTIVE,
-- so a single ₹499 payment produced a permanently-live listing. This function
-- enforces the "30 days + 7-day grace, then EXPIRED" lifecycle. It is idempotent
-- and safe to run on any schedule (pg_cron below, or the /api/cron route).
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now timestamp := now();
  v_entered_grace int := 0;
  v_expired int := 0;
BEGIN
  -- 1. ACTIVE subscriptions past their end date enter the 7-day grace period.
  --    The listing stays visible during grace.
  WITH moved AS (
    UPDATE subscriptions
       SET status = 'GRACE_PERIOD',
           "gracePeriodEndsAt" = "endDate" + interval '7 days'
     WHERE status = 'ACTIVE'
       AND "endDate" IS NOT NULL
       AND "endDate" < v_now
    RETURNING 1
  )
  SELECT count(*) INTO v_entered_grace FROM moved;

  -- 2. Grace period elapsed → subscription EXPIRED and its listing is hidden.
  WITH lapsed AS (
    UPDATE subscriptions
       SET status = 'EXPIRED'
     WHERE status = 'GRACE_PERIOD'
       AND "gracePeriodEndsAt" IS NOT NULL
       AND "gracePeriodEndsAt" < v_now
    RETURNING "listingId"
  ),
  hidden AS (
    UPDATE parking_listings
       SET status = 'EXPIRED'
     WHERE id IN (SELECT "listingId" FROM lapsed)
       AND status = 'ACTIVE'
    RETURNING 1
  )
  SELECT count(*) INTO v_expired FROM hidden;

  RETURN jsonb_build_object(
    'ranAt', v_now,
    'enteredGrace', v_entered_grace,
    'expired', v_expired
  );
END;
$$;

-- Optional: fully automated scheduling if the pg_cron extension is available.
-- Runs hourly. Safe to omit if you drive expiry via the /api/cron route instead.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    PERFORM cron.schedule(
      'expire-subscriptions-hourly',
      '0 * * * *',
      $cron$ SELECT expire_subscriptions(); $cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Scheduling is best-effort; the /api/cron route is the portable fallback.
  RAISE NOTICE 'pg_cron scheduling skipped: %', SQLERRM;
END;
$$;
