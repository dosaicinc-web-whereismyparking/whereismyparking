CREATE OR REPLACE FUNCTION search_parking(
  p_query TEXT,
  p_limit INTEGER DEFAULT 8
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pl.id::text,
    pl.name,
    pl.address,
    ST_Y(pl.location::geometry) AS latitude,
    ST_X(pl.location::geometry) AS longitude
  FROM parking_listings pl
  WHERE
    pl.status = 'ACTIVE'
    AND pl."moderationStatus" = 'APPROVED'
    AND (
      pl.name ILIKE '%' || p_query || '%'
      OR pl.address ILIKE '%' || p_query || '%'
      OR similarity(pl.name, p_query) > 0.15
      OR similarity(pl.address, p_query) > 0.15
    )
  ORDER BY 
    CASE WHEN pl.name ILIKE p_query || '%' THEN 1
         WHEN pl.name ILIKE '%' || p_query || '%' THEN 2
         ELSE 3
    END,
    similarity(pl.name, p_query) DESC
  LIMIT p_limit;
END;
$$;
