SELECT 
  CASE 
    WHEN address ILIKE '%Thrissur%' THEN 'Thrissur'
    WHEN address ILIKE '%Ernakulam%' OR address ILIKE '%Kochi%' THEN 'Ernakulam/Kochi'
    WHEN address ILIKE '%Kozhikode%' THEN 'Kozhikode'
    WHEN address ILIKE '%Palakkad%' THEN 'Palakkad'
    WHEN address ILIKE '%Malappuram%' THEN 'Malappuram'
    WHEN address ILIKE '%Kannur%' THEN 'Kannur'
    WHEN address ILIKE '%Kasaragod%' THEN 'Kasaragod'
    WHEN address ILIKE '%Wayanad%' THEN 'Wayanad'
    WHEN address ILIKE '%Idukki%' THEN 'Idukki'
    WHEN address ILIKE '%Alappuzha%' THEN 'Alappuzha'
    WHEN address ILIKE '%Kottayam%' THEN 'Kottayam'
    WHEN address ILIKE '%Pathanamthitta%' THEN 'Pathanamthitta'
    WHEN address ILIKE '%Kollam%' THEN 'Kollam'
    WHEN address ILIKE '%Thiruvananthapuram%' OR address ILIKE '%Trivandrum%' THEN 'Thiruvananthapuram'
    ELSE 'Other/Unknown'
  END as district,
  COUNT(*) as count
FROM parking_listings
WHERE status = 'ACTIVE'
GROUP BY district
ORDER BY count DESC;
