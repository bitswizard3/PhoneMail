import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
  // Supabase requires SSL; rejectUnauthorized: false allows the self-signed
  // certificate that Supabase's pooler uses.
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL (Supabase)');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

export default pool;
