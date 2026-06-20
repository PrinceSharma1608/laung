const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_mhZOa5oqs1Ip@ep-jolly-sound-adauhrow-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

const client = new Client({
  connectionString: connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL.');
    
    const res = await client.query('SELECT user_id, user_name, user_role, user_password FROM users ORDER BY user_id ASC;');
    console.log('All Users in DB:');
    res.rows.forEach(r => {
      console.log(`ID: ${r.user_id} | Name: ${r.user_name} | Role: ${r.user_role} | Password: ${r.user_password}`);
    });
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
