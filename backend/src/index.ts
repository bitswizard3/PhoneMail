import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';
import settingsRoutes from './routes/settings';
import contactsRoutes from './routes/contacts';
import voiceRoutes from './routes/voice';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8081', 'http://localhost:19006'],
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
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   📧 PhoneMail Backend API              ║
  ║   Running on port ${PORT}                  ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}           ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
