const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

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

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// IMPORTANT: Adjust URL for Mac Mini standalone PostgREST (no /rest/v1)
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321').replace(/\/rest\/v1\/?$/, '');

async function getUnnamedListings() {
  const res = await fetch(
    `${SUPABASE_URL}/parking_listings?` +
    `name=ilike.*Public Parking*&` +
    `type=eq.PUBLIC&` +
    `select=id,name,address,location`,
    {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Accept': 'application/geo+json' // Fetch as GeoJSON to get easy lat/lng
      }
    }
  );
  
  const geojson = await res.json();
  if (!geojson.features) return [];
  
  return geojson.features.map(f => ({
    id: f.properties.id,
    name: f.properties.name,
    address: f.properties.address,
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1]
  }));
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
      `lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'WhereIsMyParking/1.0' } }
    );
    const data = await res.json();
    
    // Build meaningful name from nearby landmarks
    const tags = data.address || {};
    
    const landmark = 
      tags.amenity ||
      tags.leisure ||
      tags.shop ||
      tags.building ||
      tags.road ||
      tags.suburb ||
      tags.neighbourhood ||
      tags.town ||
      tags.city ||
      null;
    
    const area = 
      tags.suburb || 
      tags.neighbourhood || 
      tags.quarter ||
      tags.town ||
      tags.city ||
      tags.county ||
      null;
    
    if (landmark && area && landmark !== area) {
      return `Parking near ${landmark}, ${area}`;
    } else if (area) {
      return `Parking - ${area}`;
    } else {
      return null;
    }
  } catch (err) {
    return null;
  }
}

async function updateName(id, name) {
  await fetch(
    `${SUPABASE_URL}/parking_listings?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        name,
        updatedAt: new Date().toISOString()
      })
    }
  );
}

async function main() {
  if (!SERVICE_KEY) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY missing');
    return;
  }

  console.log('Fetching unnamed parking listings...');
  const listings = await getUnnamedListings();
  console.log(`Found ${listings.length} unnamed listings\n`);
  
  let updated = 0;
  let failed = 0;
  
  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    
    // Check if we already have a meaningful name (optional safety check)
    // if (!listing.name.includes('Public Parking')) continue;

    const newName = await reverseGeocode(
      listing.lat, 
      listing.lng
    );
    
    if (newName) {
      await updateName(listing.id, newName);
      console.log(`[${i+1}/${listings.length}] ✓ ${newName}`);
      updated++;
    } else {
      console.log(`[${i+1}/${listings.length}] ✗ Could not geocode (${listing.lat}, ${listing.lng})`);
      failed++;
    }
    
    // Wait 1.1 seconds to respect Nominatim rate limit (1 req/sec)
    await new Promise(r => setTimeout(r, 1100));
  }
  
  console.log(`\n=============================`);
  console.log(`Name Fix Complete!`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed:  ${failed}`);
  console.log(`=============================`);
}

main().catch(console.error);
