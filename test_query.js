const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_3MGE4ZypxhLi@ep-broad-fire-aohzu6cr-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const client = new Client({
  connectionString: connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL.');
    
    console.log('Altering current_daily_maintenance_status...');
    await client.query('ALTER TABLE current_daily_maintenance_status ADD COLUMN IF NOT EXISTS remarks TEXT;');
    console.log('Successfully added remarks column to current_daily_maintenance_status table.');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
