const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Manually load .env.local if available
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      process.env[key] = value.replace(/^['"](.*)['"]$/, '$1'); // Strip quotes
    }
  });
}

// TOGGLE TEST MODE HERE
const TEST_MODE = false;

const DISTRICTS = [
  { name: 'Thiruvananthapuram', bbox: '8.3,76.7,8.7,77.2' },
  { name: 'Kollam', bbox: '8.8,76.5,9.1,76.9' },
  { name: 'Pathanamthitta', bbox: '9.1,76.6,9.5,77.0' },
  { name: 'Alappuzha', bbox: '9.3,76.3,9.7,76.6' },
  { name: 'Kottayam', bbox: '9.4,76.4,9.8,76.9' },
  { name: 'Idukki', bbox: '9.8,76.7,10.3,77.2' },
  { name: 'Ernakulam', bbox: '9.8,76.2,10.2,76.7' },
  { name: 'Thrissur', bbox: '10.4,76.1,10.7,76.4' },
  { name: 'Palakkad', bbox: '10.3,76.4,11.1,76.9' },
  { name: 'Malappuram', bbox: '10.8,75.9,11.3,76.5' },
  { name: 'Kozhikode', bbox: '11.1,75.7,11.5,76.1' },
  { name: 'Wayanad', bbox: '11.4,75.7,11.8,76.4' },
  { name: 'Kannur', bbox: '11.7,75.3,12.1,75.9' },
  { name: 'Kasaragod', bbox: '12.1,74.9,12.5,75.4' },
];

const DISTRICTS_TO_RUN = TEST_MODE 
  ? DISTRICTS.filter(d => d.name === 'Ernakulam')
  : DISTRICTS;

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321').replace(/\/rest\/v1\/?$/, '');

async function fetchWithRetry(query, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.log(`  Retry ${i+1}/${retries}... (${res.status} ${res.statusText})`);
        if (i === retries - 1) throw new Error(`Overpass API error: ${res.statusText} - ${errorText}`);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`  Retry ${i+1}/${retries}... (${err.message})`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

async function insertListings(elements, districtName) {
  let inserted = 0;
  let skipped = 0;
  
  for (const element of elements) {
    const lat = element.lat || element.center?.lat;
    const lng = element.lon || element.center?.lon;
    if (!lat || !lng) { skipped++; continue; }
    
    const name = element.tags?.name ||
                 element.tags?.['name:en'] ||
                 element.tags?.['name:ml'] ||
                 `Public Parking - ${districtName}`;
    
    // Map OSM tags to our Enum types
    const coverage = 
      element.tags?.parking === 'multi-storey' ? 'MULTI' :
      element.tags?.parking === 'underground' ? 'COVERED' :
      element.tags?.covered === 'yes' ? 'COVERED' : 'OPEN';
    
    const address = [
      element.tags?.['addr:street'],
      element.tags?.['addr:city'] || districtName,
      'Kerala'
    ].filter(Boolean).join(', ');
    
    const payload = {
      id: crypto.randomUUID(),
      name,
      address: address || `${districtName}, Kerala`,
      location: `SRID=4326;POINT(${lng} ${lat})`,
      type: 'PUBLIC',
      coverage: coverage,
      status: 'ACTIVE',
      moderationStatus: 'APPROVED',
      sourceType: 'BULK_IMPORT',
      availableHours: { from: '06:00:00', to: '22:00:00' },
      vehicleTypes: ['car', 'bike'],
      ownerId: '00000000-0000-0000-0000-000000000000',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    const insertRes = await fetch(`${SUPABASE_URL}/parking_listings`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates'
      },
      body: JSON.stringify(payload)
    });
    
    if (insertRes.ok) {
      inserted++;
    } else {
      skipped++;
    }
  }
  
  return { inserted, skipped };
}

async function main() {
  if (!SERVICE_KEY) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is missing.');
    process.exit(1);
  }

  console.log(`Starting Kerala OSM import (TEST_MODE: ${TEST_MODE})...`);
  console.log(`Target: ${SUPABASE_URL}\n`);
  
  let totalInserted = 0;
  let totalSkipped = 0;
  
  for (const district of DISTRICTS_TO_RUN) {
    process.stdout.write(`Fetching ${district.name}... `);
    
    try {
      const query = `[out:json][timeout:60];
(
  node[amenity=parking](${district.bbox});
  way[amenity=parking](${district.bbox});
);
out center;`;

      const data = await fetchWithRetry(query);
      const { inserted, skipped } = await insertListings(
        data.elements, 
        district.name
      );
      
      totalInserted += inserted;
      totalSkipped += skipped;
      console.log(`Found ${data.elements.length} | ✓ ${inserted} | ✗ ${skipped}`);
      
      // Wait to respect Overpass rate limits
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (err) {
      console.log(`\n  ✗ Failed for ${district.name}:`, err.message);
    }
  }
  
  console.log(`\n=============================`);
  console.log(`Import Cycle Complete!`);
  console.log(`Total Records Inserted: ${totalInserted}`);
  console.log(`Total Records Skipped:  ${totalSkipped}`);
  console.log(`=============================`);
}

main().catch(console.error);
