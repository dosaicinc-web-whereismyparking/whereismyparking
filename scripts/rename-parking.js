const { Client } = require('pg');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env.production
if (fs.existsSync('.env.production')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env.production'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Missing DATABASE_URL in environment.");
  process.exit(1);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
      headers: { 'User-Agent': 'WhereIsMyParking/1.0 (internal maintenance script)' }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

function buildName(addressData, currentCity) {
  if (!addressData) return null;
  const a = addressData;
  
  // Try to find the most specific place name
  const specificName = a.amenity || a.building || a.shop || a.tourism || a.leisure || a.office || a.historic;
  if (specificName) return `${specificName} Parking`;
  
  // Fallback to road or neighbourhood
  const areaName = a.road || a.neighbourhood || a.suburb || a.village;
  if (areaName) return `${areaName} Parking`;
  
  // Final fallback
  return null;
}

async function main() {
  console.log("Starting parking rename process...");
  
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  
  try {
    const { rows } = await client.query(`
      SELECT id, name, address, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng
      FROM parking_listings
      WHERE name LIKE 'Public Parking - %'
      ORDER BY id
    `);
    
    console.log(`Found ${rows.length} parking spots to rename.`);
    let renamed = 0;
    
    const usedNames = new Set();
    
    // Load existing names to prevent duplicates
    const { rows: existingRows } = await client.query("SELECT name FROM parking_listings");
    existingRows.forEach(r => usedNames.add(r.name));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let newName = null;
      
      console.log(`[${i+1}/${rows.length}] Reverse geocoding for ${row.name} at ${row.lat}, ${row.lng}...`);
      
      const data = await reverseGeocode(row.lat, row.lng);
      if (data && data.address) {
         let generatedName = buildName(data.address, row.address);
         if (generatedName) {
           // Ensure uniqueness
           let finalName = generatedName;
           let suffix = 1;
           while (usedNames.has(finalName)) {
             suffix++;
             finalName = `${generatedName} ${suffix}`;
           }
           
           usedNames.add(finalName);
           newName = finalName;
         }
      }
      
      if (newName) {
        console.log(`   -> Renamed to: ${newName}`);
        await client.query("UPDATE parking_listings SET name = $1 WHERE id = $2", [newName, row.id]);
        renamed++;
      } else {
        console.log(`   -> Could not generate a specific name. Keeping original.`);
      }
      
      // Sleep for 1.2s to respect Nominatim limits
      await sleep(1200);
    }
    
    console.log(`Done! Successfully renamed ${renamed} parking spots.`);
  } catch (err) {
    console.error("Database error:", err);
  } finally {
    await client.end();
  }
}

main();
