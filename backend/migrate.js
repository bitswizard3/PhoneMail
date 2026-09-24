const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const connectionString = 'postgresql://postgres.rdogopfvbrgkjkyxsvhw:SVRnitt%40123@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to Supabase!');
    
    const sqlPath = path.join(__dirname, 'src', 'db', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing init.sql...');
    await client.query(sql);
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
