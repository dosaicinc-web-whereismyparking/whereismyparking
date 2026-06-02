SELECT COUNT(*) as total FROM parking_listings;

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

SELECT COUNT(*) as total_after FROM parking_listings;
