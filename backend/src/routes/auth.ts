import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import redis from '../config/redis';
import { sendOTP, verifyOTP, generateIVRResponse, isTwilioConfigured } from '../services/twilio';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

const SMTP_DOMAIN = process.env.SMTP_DOMAIN || 'phonemail.local';
const JWT_SECRET = process.env.JWT_SECRET || 'alphastack-phonemail-jwt-secret-key-2026';
const JWT_EXPIRES_IN = 604800; // 7 days in seconds

/**
 * POST /api/auth/register
 * Register a new account with phone number
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password, method = 'web' } = req.body;

    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: 'Account with this phone number already exists' });
      return;
    }

    // Generate email from phone number
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const email = `${cleanPhone.slice(-10)}@${SMTP_DOMAIN}`;

    // If using OTP-based auth
    if (!password && isTwilioConfigured()) {
      const sent = await sendOTP(phone);
      if (!sent) {
        res.status(500).json({ error: 'Failed to send OTP' });
        return;
      }
      // Store pending registration in Redis
      await redis.setex(`pending_reg:${phone}`, 600, JSON.stringify({ phone, email, method }));
      res.json({ message: 'OTP sent', requiresOTP: true, email });
      return;
    }

    // Password-based auth
    if (!password) {
      res.status(400).json({ error: 'Password is required (Twilio not configured for OTP)' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (phone, email, password_hash, display_name, registration_method)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, phone, email, display_name, created_at`,
      [phone, email, passwordHash, cleanPhone, method]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, phone: user.phone },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        displayName: user.display_name,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP — auto-creates account if new user, logs in if existing
 */
router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      res.status(400).json({ error: 'Phone and OTP code are required' });
      return;
    }

    const isValid = await verifyOTP(phone, code);
    if (!isValid) {
      res.status(400).json({ error: 'Invalid OTP' });
      return;
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);

    if (existingUser.rows.length > 0) {
      // Existing user — login
      const user = existingUser.rows[0];
      const token = jwt.sign(
        { userId: user.id, email: user.email, phone: user.phone },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      res.json({
        message: 'Login successful',
        isNewUser: false,
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          displayName: user.display_name,
          profilePicture: user.profile_picture,
          language: user.language,
        },
        token,
      });
      return;
    }

    // New user — auto-create account
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const email = `${cleanPhone.slice(-10)}@${SMTP_DOMAIN}`;

    // Check which method was stored, default to 'web'
    const pendingData = await redis.get(`pending_reg:${phone}`);
    const method = pendingData ? JSON.parse(pendingData).method || 'web' : 'web';

    const result = await pool.query(
      `INSERT INTO users (phone, email, display_name, registration_method)
       VALUES ($1, $2, $3, $4) RETURNING id, phone, email, display_name, created_at`,
      [phone, email, cleanPhone, method]
    );

    if (pendingData) await redis.del(`pending_reg:${phone}`);

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, phone: user.phone },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Account created successfully',
      isNewUser: true,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        displayName: user.display_name,
      },
      token,
    });
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/send-otp
 * Send OTP for login or registration — works for both new & existing users
 */
router.post('/send-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, method = 'web' } = req.body;
    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    const isNewUser = existingUser.rows.length === 0;

    // Store registration intent in Redis (for tracking method)
    if (isNewUser) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const email = `${cleanPhone.slice(-10)}@${SMTP_DOMAIN}`;
      await redis.setex(`pending_reg:${phone}`, 600, JSON.stringify({ phone, email, method }));
    }

    const sent = await sendOTP(phone);
    if (!sent) {
      res.status(500).json({ error: 'Failed to send OTP' });
      return;
    }

    res.json({
      message: 'OTP sent successfully',
      isNewUser,
      // In dev mode, hint the OTP code
      ...(process.env.NODE_ENV !== 'production' && { devHint: 'Use OTP: 123456' }),
    });
  } catch (error) {
    console.error('❌ Send OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Login with phone + password
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body;

    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    const user = result.rows[0];

    // If user has password, verify it
    if (user.password_hash) {
      if (!password) {
        res.status(400).json({ error: 'Password is required' });
        return;
      }
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid password' });
        return;
      }
    } else {
      // OTP-based login
      if (!isTwilioConfigured()) {
        res.status(400).json({ error: 'This account uses OTP login but Twilio is not configured' });
        return;
      }
      const sent = await sendOTP(phone);
      if (!sent) {
        res.status(500).json({ error: 'Failed to send OTP' });
        return;
      }
      res.json({ message: 'OTP sent', requiresOTP: true });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, phone: user.phone },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        displayName: user.display_name,
        profilePicture: user.profile_picture,
        language: user.language,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/ivr
 * Twilio IVR webhook - initial call handling
 */
router.post('/ivr', (req: Request, res: Response): void => {
  res.type('text/xml');
  res.send(generateIVRResponse(false));
});

/**
 * POST /api/auth/ivr-confirm
 * Twilio IVR webhook - handle user input
 */
router.post('/ivr-confirm', async (req: Request, res: Response): Promise<void> => {
  try {
    const digit = req.body.Digits;
    const callerPhone = req.body.From;

    if (digit === '1' && callerPhone) {
      const cleanPhone = callerPhone.replace(/[^0-9]/g, '');
      const email = `${cleanPhone.slice(-10)}@${SMTP_DOMAIN}`;

      // Check if already exists
      const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [callerPhone]);
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO users (phone, email, display_name, registration_method)
           VALUES ($1, $2, $3, 'ivr')`,
          [callerPhone, email, cleanPhone]
        );
      }

      res.type('text/xml');
      res.send(generateIVRResponse(true));
    } else {
      res.type('text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response><Say voice="alice">Thank you for calling. Goodbye!</Say></Response>`);
    }
  } catch (error) {
    console.error('❌ IVR error:', error);
    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response><Say voice="alice">An error occurred. Please try again later.</Say></Response>`);
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, phone, email, display_name, profile_picture, language, 
              registration_method, has_mobile_app, created_at
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0];
    
    // Get aliases
    const aliases = await pool.query(
      'SELECT id, alias_email, display_name, is_active FROM aliases WHERE user_id = $1',
      [req.userId]
    );

    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        displayName: user.display_name,
        profilePicture: user.profile_picture,
        language: user.language,
        registrationMethod: user.registration_method,
        hasMobileApp: user.has_mobile_app,
        createdAt: user.created_at,
        aliases: aliases.rows,
      },
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
