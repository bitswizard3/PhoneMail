// This file loads environment variables BEFORE anything else.
// It must be imported first in index.ts.
import dotenv from 'dotenv';
import path from 'path';

// Try multiple .env locations for cross-platform compatibility
// __dirname = backend/src/config when running via ts-node-dev
const envPaths = [
  path.resolve(__dirname, '../../../.env'),  // backend/src/config -> AlphaStack/.env (3 levels up)
  path.resolve(__dirname, '../../.env'),     // backend/src/config -> backend/.env (2 levels up)
  path.resolve(process.cwd(), '.env'),       // cwd fallback (usually backend/)
  path.resolve(process.cwd(), '../.env'),    // one level above cwd (AlphaStack/.env)
];

let loaded = false;
for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`✅ Loaded .env from: ${envPath}`);
    loaded = true;
    break;
  }
}

if (!loaded) {
  console.warn('⚠️  No .env file found, using system environment variables');
}
