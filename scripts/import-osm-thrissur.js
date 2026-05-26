const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

const query = `
[out:json];
(
  node["amenity"="parking"](10.4,76.1,10.7,76.4);
  way["amenity"="parking"](10.4,76.1,10.7,76.4);
  node["amenity"="parking_space"](10.4,76.1,10.7,76.4);
  node["parking"="surface"](10.4,76.1,10.7,76.4);
  node["parking"="multi-storey"](10.4,76.1,10.7,76.4);
  node["parking"="underground"](10.4,76.1,10.7,76.4);
);
out center;
`;

function escapeSql(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/'/g, "''");
}

async function importParkingData() {
  console.log('Fetching OSM parking data for Thrissur...');
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query.trim()),
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    }
  });
  
  if (!res.ok) {
    const text = await res.text();
    console.error(`Overpass API Error (${res.status}):`, text);
    return;
  }

  const data = await res.json();
  console.log(`Found ${data.elements?.length || 0} parking locations`);
  
  let sql = `
-- Ensure system user exists in both auth and public
INSERT INTO auth.users (id, phone, aud, role, created_at, updated_at) 
VALUES ('${SYSTEM_USER_ID}', '+910000000000', 'authenticated', 'authenticated', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, phone, "createdAt") 
VALUES ('${SYSTEM_USER_ID}', '+910000000000', now())
ON CONFLICT (id) DO NOTHING;

-- Insert parking listings
INSERT INTO public.parking_listings (
  id, name, address, location, type, coverage, status, "moderationStatus", "availableHours", "vehicleTypes", "ownerId", "sourceType", "sourceName", "updatedAt"
) VALUES
`;


  const values = [];
  
  for (const element of (data.elements || [])) {
    const lat = element.lat || element.center?.lat;
    const lng = element.lon || element.center?.lon;
    
    if (!lat || !lng) continue;
    
    const name = element.tags?.name || 
                 element.tags?.['name:en'] || 
                 'Public Parking - Thrissur';
    
    const coverageMap = {
        'multi-storey': 'MULTI',
        'underground': 'MULTI',
        'surface': 'OPEN'
    };

    const coverage = coverageMap[element.tags?.parking] || 
                     (element.tags?.covered === 'yes' ? 'COVERED' : 'OPEN');
    
    const address = [
      element.tags?.['addr:street'],
      element.tags?.['addr:city'] || 'Thrissur',
      element.tags?.['addr:state'] || 'Kerala'
    ].filter(Boolean).join(', ') || 'Thrissur, Kerala';

    const id = `osm-${element.type}-${element.id}`;
    const location = `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
    const availableHours = JSON.stringify({ from: '06:00:00', to: '22:00:00' });
    const vehicleTypes = JSON.stringify(['car', 'bike']);

    values.push(`(
      '${id}', 
      '${escapeSql(name)}', 
      '${escapeSql(address)}', 
      ${location}, 
      'PUBLIC', 
      '${coverage}', 
      'ACTIVE', 
      'APPROVED', 
      '${availableHours}'::jsonb, 
      '${vehicleTypes}'::jsonb, 
      '${SYSTEM_USER_ID}', 
      'BULK_IMPORT', 
      'OpenStreetMap', 
      now()
    )`);
  }

  if (values.length === 0) {
    console.log('No valid parking data to insert.');
    return;
  }

  sql += values.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET "updatedAt" = EXCLUDED."updatedAt";';
  
  const sqlPath = path.join(__dirname, 'import-osm.sql');
  fs.writeFileSync(sqlPath, sql);
  console.log(`Generated SQL at ${sqlPath}`);
}

importParkingData().catch(console.error);
