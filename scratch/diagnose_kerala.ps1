$ip = "49.12.37.22"
$user = "root"

# I'm redirecting this to the Hetzner DB because that's our active production DB we just fixed.
# If you really meant 100.64.183.55, let me know, but our data is currently on 49.12.37.22.

Write-Host "STEP 1 & 2 - Current DB State"
ssh -i C:\Users\ACER\.ssh\id_ed25519 -o StrictHostKeyChecking=no ${user}@${ip} "docker exec postgres psql -U postgres -d postgres -c `"SELECT COUNT(*) as total, status FROM parking_listings GROUP BY status ORDER BY total DESC;`""

Write-Host "STEP 3 - Delete ALL non-Kerala data"
ssh -i C:\Users\ACER\.ssh\id_ed25519 -o StrictHostKeyChecking=no ${user}@${ip} "docker exec postgres psql -U postgres -d postgres -c `"DELETE FROM parking_listings WHERE address NOT ILIKE '%Kerala%' AND address NOT ILIKE '%Thrissur%' AND address NOT ILIKE '%Kochi%' AND address NOT ILIKE '%Ernakulam%' AND address NOT ILIKE '%Kozhikode%' AND address NOT ILIKE '%Palakkad%' AND address NOT ILIKE '%Malappuram%' AND address NOT ILIKE '%Kannur%' AND address NOT ILIKE '%Kasaragod%' AND address NOT ILIKE '%Wayanad%' AND address NOT ILIKE '%Idukki%' AND address NOT ILIKE '%Alappuzha%' AND address NOT ILIKE '%Kottayam%' AND address NOT ILIKE '%Pathanamthitta%' AND address NOT ILIKE '%Kollam%' AND address NOT ILIKE '%Thiruvananthapuram%' AND address NOT ILIKE '%Trivandrum%';`""

Write-Host "STEP 4 - Count after cleanup"
ssh -i C:\Users\ACER\.ssh\id_ed25519 -o StrictHostKeyChecking=no ${user}@${ip} "docker exec postgres psql -U postgres -d postgres -c `"SELECT COUNT(*) FROM parking_listings;`""
