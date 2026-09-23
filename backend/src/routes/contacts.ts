import { Router, Response } from 'express';
import pool from '../config/database';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

const SMTP_DOMAIN = process.env.SMTP_DOMAIN || 'phonemail.local';

/**
 * GET /api/contacts
 * Get all contacts for the authenticated user
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, favorites } = req.query;

    let query = 'SELECT * FROM contacts WHERE user_id = $1';
    const params: any[] = [req.userId];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (contact_name ILIKE $${params.length} OR contact_phone ILIKE $${params.length} OR contact_email ILIKE $${params.length})`;
    }

    if (favorites === 'true') {
      query += ' AND is_favorite = TRUE';
    }

    query += ' ORDER BY contact_name ASC, contact_phone ASC';

    const result = await pool.query(query, params);

    res.json({
      contacts: result.rows.map(row => ({
        id: row.id,
        phone: row.contact_phone,
        email: row.contact_email,
        name: row.contact_name,
        isFavorite: row.is_favorite,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('❌ Get contacts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/contacts
 * Add a new contact
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { phone, name } = req.body;

    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const contactEmail = `${cleanPhone.replace(/[^0-9]/g, '').slice(-10)}@${SMTP_DOMAIN}`;

    // Check if contact already exists
    const existing = await pool.query(
      'SELECT id FROM contacts WHERE user_id = $1 AND contact_phone = $2',
      [req.userId, cleanPhone]
    );

    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Contact already exists' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO contacts (user_id, contact_phone, contact_email, contact_name)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.userId, cleanPhone, contactEmail, name || cleanPhone]
    );

    const contact = result.rows[0];
    res.status(201).json({
      message: 'Contact added successfully',
      contact: {
        id: contact.id,
        phone: contact.contact_phone,
        email: contact.contact_email,
        name: contact.contact_name,
        isFavorite: contact.is_favorite,
        createdAt: contact.created_at,
      },
    });
  } catch (error) {
    console.error('❌ Add contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/contacts/:id
 * Update a contact
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, isFavorite } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`contact_name = $${paramIndex++}`);
      params.push(name);
    }

    if (isFavorite !== undefined) {
      updates.push(`is_favorite = $${paramIndex++}`);
      params.push(isFavorite);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    updates.push(`updated_at = NOW()`);
    params.push(id, req.userId);

    const result = await pool.query(
      `UPDATE contacts SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }

    const contact = result.rows[0];
    res.json({
      message: 'Contact updated',
      contact: {
        id: contact.id,
        phone: contact.contact_phone,
        email: contact.contact_email,
        name: contact.contact_name,
        isFavorite: contact.is_favorite,
      },
    });
  } catch (error) {
    console.error('❌ Update contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/contacts/:id
 * Delete a contact
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM contacts WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }

    res.json({ message: 'Contact deleted' });
  } catch (error) {
    console.error('❌ Delete contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/contacts/sync
 * Bulk sync contacts from phone (mobile app)
 */
router.post('/sync', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { contacts } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      res.status(400).json({ error: 'Contacts array is required' });
      return;
    }

    const synced: any[] = [];

    for (const c of contacts) {
      if (!c.phone) continue;
      const cleanPhone = c.phone.replace(/[^0-9+]/g, '');
      const contactEmail = `${cleanPhone.replace(/[^0-9]/g, '').slice(-10)}@${SMTP_DOMAIN}`;

      try {
        const result = await pool.query(
          `INSERT INTO contacts (user_id, contact_phone, contact_email, contact_name)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, contact_phone) DO UPDATE SET
             contact_name = COALESCE(EXCLUDED.contact_name, contacts.contact_name),
             updated_at = NOW()
           RETURNING *`,
          [req.userId, cleanPhone, contactEmail, c.name || cleanPhone]
        );
        synced.push(result.rows[0]);
      } catch (e) {
        // Skip individual contact errors
        console.error('Skipping contact sync error:', e);
      }
    }

    res.json({
      message: `${synced.length} contacts synced`,
      count: synced.length,
    });
  } catch (error) {
    console.error('❌ Sync contacts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
