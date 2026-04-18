const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgresql://postgres:postgres@localhost:54322/postgres";
const migrationPath = path.join(__dirname, '../supabase/migrations/05_otp_sessions.sql');

async function applyMigration() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('Applying migration...');
    
    await client.query(sql);
    console.log('Migration applied successfully');
  } catch (err) {
    console.error('Error applying migration:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
