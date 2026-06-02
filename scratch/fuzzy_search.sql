-- Enable pg_trgm extension for fuzzy/typo-tolerant text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GiST trigram index on name and address for fast fuzzy search
CREATE INDEX IF NOT EXISTS idx_parking_listings_name_trgm
  ON parking_listings USING gist (name gist_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_parking_listings_address_trgm
  ON parking_listings USING gist (address gist_trgm_ops);

-- Fuzzy search function: returns listings matching by trigram similarity
-- Falls back gracefully if pg_trgm is not available
CREATE OR REPLACE FUNCTION search_parking_fuzzy(
  p_query TEXT,
  p_limit INTEGER DEFAULT 8
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  similarity REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pl.id,
    pl.name,
    pl.address,
    ST_Y(pl.location::geometry) AS latitude,
    ST_X(pl.location::geometry) AS longitude,
    GREATEST(
      similarity(pl.name, p_query),
      similarity(pl.address, p_query)
    ) AS similarity
  FROM parking_listings pl
  WHERE
    pl.status = 'ACTIVE'
    AND pl."moderationStatus" = 'APPROVED'
    AND (
      pl.name % p_query
      OR pl.address % p_query
      OR pl.name ILIKE '%' || p_query || '%'
      OR pl.address ILIKE '%' || p_query || '%'
    )
  ORDER BY similarity DESC, pl.name ASC
  LIMIT p_limit;
END;
$$;
