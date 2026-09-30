// ⚠️ IMPORTANT: env.ts MUST be the first import so all other modules
// (database.ts, twilio.ts, etc.) can access process.env when they load.
import './config/env';

import dns from 'node:dns';
// Force IPv4 DNS resolution first to fix Docker/WSL2 IPv6 timeout issues with Supabase
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';
import settingsRoutes from './routes/settings';
import contactsRoutes from './routes/contacts';
import voiceRoutes from './routes/voice';

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 4000;

// Middleware — Dynamic CORS: allow any origin in development so mobile
// devices on the same WiFi can reach the API (fixes the "works on
// desktop but not on mobile" problem).
app.use(cors({
  origin: true, // Allow any origin for Hackathon demo purposes
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PhoneMail Backend',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/voice', voiceRoutes);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: err.message, stack: err.stack });
});

// Bind to 0.0.0.0 so the server is reachable from other devices on the
// same network (fixes MacBook / mobile same-WiFi issue)
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   📧 PhoneMail Backend API              ║
  ║   Running on port ${PORT}                  ║
  ║   Listening on 0.0.0.0 (all interfaces) ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}           ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
