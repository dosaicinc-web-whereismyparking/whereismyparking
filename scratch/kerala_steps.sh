#!/bin/bash

# STEP 1
echo "STEP 1 - Current state"
ssh -o StrictHostKeyChecking=no polaroiddosa@100.64.183.55 "docker exec supabase-db psql -U postgres -d postgres -c \"
SELECT COUNT(*) as total, status, \\\"sourceType\\\" FROM parking_listings GROUP BY status, \\\"sourceType\\\" ORDER BY total DESC;
\""

# STEP 2
echo "STEP 2 - Total count"
ssh -o StrictHostKeyChecking=no polaroiddosa@100.64.183.55 "docker exec supabase-db psql -U postgres -d postgres -c \"
SELECT COUNT(*) as total FROM parking_listings;
\""

# STEP 3
echo "STEP 3 - Cleanup"
ssh -o StrictHostKeyChecking=no polaroiddosa@100.64.183.55 "docker exec supabase-db psql -U postgres -d postgres -c \"
DELETE FROM parking_listings 
WHERE address NOT ILIKE '%Kerala%'
AND address NOT ILIKE '%Thrissur%'
AND address NOT ILIKE '%Kochi%'
AND address NOT ILIKE '%Ernakulam%'
AND address NOT ILIKE '%Kozhikode%'
AND address NOT ILIKE '%Palakkad%'
AND address NOT ILIKE '%Malappuram%'
AND address NOT ILIKE '%Kannur%'
AND address NOT ILIKE '%Kasaragod%'
AND address NOT ILIKE '%Wayanad%'
AND address NOT ILIKE '%Idukki%'
AND address NOT ILIKE '%Alappuzha%'
AND address NOT ILIKE '%Kottayam%'
AND address NOT ILIKE '%Pathanamthitta%'
AND address NOT ILIKE '%Kollam%'
AND address NOT ILIKE '%Thiruvananthapuram%'
AND address NOT ILIKE '%Trivandrum%';
\""

# STEP 4
echo "STEP 4 - Count after cleanup"
ssh -o StrictHostKeyChecking=no polaroiddosa@100.64.183.55 "docker exec supabase-db psql -U postgres -d postgres -c \"
SELECT COUNT(*) FROM parking_listings;
\""
