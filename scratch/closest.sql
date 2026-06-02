SELECT name, address, ST_Distance(location, ST_SetSRID(ST_MakePoint(76.2144, 10.5276), 4326)) as dist 
FROM parking_listings 
ORDER BY location <-> ST_SetSRID(ST_MakePoint(76.2144, 10.5276), 4326)
LIMIT 5;
