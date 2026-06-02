SELECT name, COUNT(*) FROM parking_listings GROUP BY name ORDER BY COUNT(*) DESC LIMIT 5;
