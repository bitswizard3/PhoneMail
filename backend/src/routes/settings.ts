import { Router, Response } from 'express';
import pool from '../config/database';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();

const SMTP_DOMAIN = process.env.SMTP_DOMAIN || 'phonemail.local';

// All settings routes require authentication
router.use(authMiddleware);

/**
 * GET /api/settings
 * Get user settings
 */
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
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

    const aliases = await pool.query(
      'SELECT id, alias_email, display_name, is_active, created_at FROM aliases WHERE user_id = $1',
      [req.userId]
    );

    res.json({
      settings: {
        ...result.rows[0],
        aliases: aliases.rows,
      },
    });
  } catch (error) {
    console.error('❌ Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/settings
 * Update user settings
 */
router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { displayName, language, profilePicture, hasMobileApp } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (displayName !== undefined) {
      updates.push(`display_name = $${paramCount++}`);
      values.push(displayName);
    }
    if (language !== undefined) {
      updates.push(`language = $${paramCount++}`);
      values.push(language);
    }
    if (profilePicture !== undefined) {
      updates.push(`profile_picture = $${paramCount++}`);
      values.push(profilePicture);
    }
    if (hasMobileApp !== undefined) {
      updates.push(`has_mobile_app = $${paramCount++}`);
      values.push(hasMobileApp);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      res.status(400).json({ error: 'No updates provided' });
      return;
    }

    values.push(req.userId);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    res.json({ message: 'Settings updated' });
  } catch (error) {
    console.error('❌ Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/settings/password
 * Change password
 */
router.put('/password', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const user = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
    if (user.rows[0].password_hash && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.rows[0].password_hash);
      if (!isMatch) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, req.userId]);

    res.json({ message: 'Password updated' });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/settings/aliases
 * Create a new alias email
 */
router.post('/aliases', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { aliasName, displayName } = req.body;

    if (!aliasName) {
      res.status(400).json({ error: 'Alias name is required' });
      return;
    }

    const aliasEmail = `${aliasName}@${SMTP_DOMAIN}`;

    // Check if alias already exists
    const existing = await pool.query('SELECT id FROM aliases WHERE alias_email = $1', [aliasEmail]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'This alias is already taken' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO aliases (user_id, alias_email, display_name)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.userId, aliasEmail, displayName || aliasName]
    );

    res.status(201).json({ alias: result.rows[0] });
  } catch (error) {
    console.error('❌ Create alias error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/settings/aliases/:id
 * Delete an alias
 */
router.delete('/aliases/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM aliases WHERE id = $1 AND user_id = $2', [id, req.userId]);
    res.json({ message: 'Alias deleted' });
  } catch (error) {
    console.error('❌ Delete alias error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
