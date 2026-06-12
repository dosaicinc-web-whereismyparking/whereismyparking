const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  await client.connect();

  const res1 = await client.query(`SELECT COUNT(*) FROM parking_listings WHERE name ILIKE '%Public Parking%' OR name ILIKE '%public parking%'`);
  console.log('STEP 1 Generic Name Count:', res1.rows[0].count);

  const res2 = await client.query(`SELECT COUNT(*) FROM parking_listings`);
  console.log('STEP 2 Total Listings:', res2.rows[0].count);
  
  await client.end();
}

check().catch(console.error);
