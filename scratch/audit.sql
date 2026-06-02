SELECT COUNT(*) as total, status, "moderationStatus" 
FROM parking_listings 
GROUP BY status, "moderationStatus" 
ORDER BY total DESC;

-- Check for duplicates
SELECT name, address, COUNT(*) as cnt 
FROM parking_listings 
GROUP BY name, address 
HAVING COUNT(*) > 1 
LIMIT 20;

-- Check for null locations
SELECT COUNT(*) as null_location_count 
FROM parking_listings 
WHERE location IS NULL;

-- Check for corrupted coords (outside Kerala bbox)
SELECT COUNT(*) as outside_kerala
FROM parking_listings
WHERE location IS NOT NULL
AND NOT (
  ST_X(location) BETWEEN 74.9 AND 77.6
  AND ST_Y(location) BETWEEN 8.0 AND 12.8
);
