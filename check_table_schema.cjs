const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_3MGE4ZypxhLi@ep-broad-fire-aohzu6cr-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const client = new Client({
  connectionString: connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected.');

    const res = await client.query(`
      SELECT machine_id, frequency_days, delay_count 
      FROM machine_checklists;
    `);
    
    console.log('Rows in machine_checklists:');
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
