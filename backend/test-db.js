// Quick test script to verify Supabase connection
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function test() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Supabase!');
    
    // Test query
    const result = await client.query("SELECT 1 as test");
    console.log('✅ Query works:', result.rows);
    
    // Test users table
    const users = await client.query("SELECT COUNT(*) FROM users");
    console.log('✅ Users table exists, count:', users.rows[0].count);
    
    // Test the actual query that's failing
    const phone = '+919876543210';
    const email = '9876543210@phonemail.local';
    const sendOtpQuery = await client.query(
      'SELECT id FROM users WHERE phone = $1 OR email = $2', 
      [phone, email]
    );
    console.log('✅ send-otp query works, results:', sendOtpQuery.rows.length);
    
    client.release();
    await pool.end();
    console.log('\n✅ ALL TESTS PASSED!');
  } catch (err) {
    console.error('❌ ERROR:', err);
    await pool.end();
  }
}

test();
