import dotenv from 'dotenv';
import { SMTPServer } from 'smtp-server';
import { simpleParser, ParsedMail } from 'mailparser';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://phonemail:phonemail_secret_2026@localhost:5432/phonemail_db',
});

const SMTP_DOMAIN = process.env.SMTP_DOMAIN || 'phonemail.local';

/**
 * Process incoming email and store in database
 */
async function processEmail(parsedMail: ParsedMail, envelope: any): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const senderEmail = envelope.mailFrom?.address || parsedMail.from?.value?.[0]?.address || 'unknown@unknown.com';
    const subject = parsedMail.subject || '(No Subject)';
    const textBody = parsedMail.text || '';
    const htmlBody = parsedMail.html || textBody;

    // Find or create sender
    let senderId = null;
    const senderResult = await client.query('SELECT id FROM users WHERE email = $1', [senderEmail]);
    if (senderResult.rows.length > 0) {
      senderId = senderResult.rows[0].id;
    }

    // Process each recipient
    const recipients = envelope.rcptTo || [];
    for (const rcpt of recipients) {
      const recipientEmail = rcpt.address;

      // Verify recipient exists in our system
      const recipientUser = await client.query(
        'SELECT id, phone, has_mobile_app FROM users WHERE email = $1',
        [recipientEmail]
      );

      if (recipientUser.rows.length === 0) {
        console.log(`⚠️ Unknown recipient: ${recipientEmail}`);
        continue;
      }

      const recipientData = recipientUser.rows[0];

      // Find or create conversation
      let conversationId: string;
      if (senderId) {
        const existingConv = await client.query(
          `SELECT c.id FROM conversations c
           JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
           JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
           WHERE cp1.user_id = $1 AND cp2.user_id = $2 AND c.is_group = FALSE
           LIMIT 1`,
          [senderId, recipientData.id]
        );

        if (existingConv.rows.length > 0) {
          conversationId = existingConv.rows[0].id;
        } else {
          const convResult = await client.query(
            'INSERT INTO conversations (is_group, last_message_at) VALUES (FALSE, NOW()) RETURNING id'
          );
          conversationId = convResult.rows[0].id;

          await client.query(
            'INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)',
            [conversationId, senderId]
          );
          await client.query(
            'INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)',
            [conversationId, recipientData.id]
          );
        }
      } else {
        const convResult = await client.query(
          'INSERT INTO conversations (is_group, last_message_at) VALUES (FALSE, NOW()) RETURNING id'
        );
        conversationId = convResult.rows[0].id;
        await client.query(
          'INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)',
          [conversationId, recipientData.id]
        );
      }

      // Update conversation timestamp
      await client.query(
        'UPDATE conversations SET last_message_at = NOW() WHERE id = $1',
        [conversationId]
      );

      // Insert email
      const emailResult = await client.query(
        `INSERT INTO emails (conversation_id, sender_id, sender_email, subject, body, html_body, has_attachments)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [conversationId, senderId, senderEmail, subject, textBody, htmlBody, 
         (parsedMail.attachments && parsedMail.attachments.length > 0)]
      );

      // Insert recipient
      await client.query(
        `INSERT INTO email_recipients (email_id, recipient_email, recipient_type)
         VALUES ($1, $2, 'to')`,
        [emailResult.rows[0].id, recipientEmail]
      );

      // Handle attachments
      if (parsedMail.attachments) {
        for (const attachment of parsedMail.attachments) {
          await client.query(
            `INSERT INTO attachments (email_id, filename, mime_type, size_bytes, storage_path)
             VALUES ($1, $2, $3, $4, $5)`,
            [emailResult.rows[0].id, attachment.filename || 'untitled',
             attachment.contentType, attachment.size, `/attachments/${emailResult.rows[0].id}/${attachment.filename}`]
          );
        }
      }

      // SMS notification for non-mobile users
      if (!recipientData.has_mobile_app) {
        console.log(`📩 SMS notification would be sent to ${recipientData.phone}: New email from ${senderEmail}, Subject: ${subject}`);
        // In production, call Twilio here
      }

      console.log(`✅ Email stored: ${senderEmail} → ${recipientEmail} | Subject: ${subject}`);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error processing email:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Create SMTP server
const server = new SMTPServer({
  name: SMTP_DOMAIN,
  banner: `PhoneMail SMTP Server - ${SMTP_DOMAIN}`,
  authOptional: true,
  disabledCommands: ['STARTTLS'],
  size: 10 * 1024 * 1024, // 10MB max email size

  onConnect(session, callback) {
    console.log(`📡 SMTP connection from ${session.remoteAddress}`);
    callback();
  },

  onMailFrom(address, session, callback) {
    console.log(`📤 Mail from: ${address.address}`);
    callback();
  },

  onRcptTo(address, session, callback) {
    // Only accept emails for our domain
    if (address.address.endsWith(`@${SMTP_DOMAIN}`)) {
      console.log(`📥 Recipient: ${address.address}`);
      callback();
    } else {
      callback(new Error(`We do not accept emails for ${address.address}`));
    }
  },

  onData(stream, session, callback) {
    let emailData = '';
    stream.on('data', (chunk) => {
      emailData += chunk;
    });
    stream.on('end', async () => {
      try {
        const parsedMail = await simpleParser(emailData);
        await processEmail(parsedMail, session.envelope);
        callback();
      } catch (error) {
        console.error('❌ Error processing email data:', error);
        callback(new Error('Error processing email'));
      }
    });
  },
});

// Start SMTP server
const SMTP_PORT = 2525;
server.listen(SMTP_PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   📬 PhoneMail SMTP Server              ║
  ║   Listening on port ${SMTP_PORT}                ║
  ║   Domain: ${SMTP_DOMAIN.padEnd(28)}║
  ╚══════════════════════════════════════════╝
  `);
});

server.on('error', (err) => {
  console.error('❌ SMTP Server error:', err);
});
