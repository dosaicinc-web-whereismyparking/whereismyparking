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
