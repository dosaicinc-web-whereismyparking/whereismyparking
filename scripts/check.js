const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: 'postgresql://postgres:parking_production_secure_pass_2026@10.0.0.2:5432/postgres?sslmode=disable'
  });
  
  await client.connect();

  const res1 = await client.query(`SELECT COUNT(*) FROM parking_listings WHERE name ILIKE '%Public Parking%' OR name ILIKE '%public parking%'`);
  console.log('STEP 1 Generic Name Count:', res1.rows[0].count);

  const res2 = await client.query(`SELECT COUNT(*) FROM parking_listings`);
  console.log('STEP 2 Total Listings:', res2.rows[0].count);
  
  await client.end();
}

check().catch(console.error);
