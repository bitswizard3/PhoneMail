import { Router, Request, Response } from 'express';
import twilio from 'twilio';
import pool from '../config/database';
import { normalizePhone, initiateOutboundCall } from '../services/twilio';

const router = Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

const SMTP_DOMAIN = process.env.SMTP_DOMAIN || 'phonemail.app';

const phoneToEmail = (phone: string): string => {
  const cleaned = phone.replace(/[^0-9]/g, '');
  return `${cleaned.slice(-10)}@${SMTP_DOMAIN}`;
};

// Fallback host if env is not set (ngrok or render URL is required for Twilio)
// Twilio sends a webhook here when someone calls the number.
router.post('/incoming', (req: Request, res: Response) => {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    numDigits: 1,
    action: '/api/voice/process',
    method: 'POST',
    timeout: 5
  });

  gather.say(
    { voice: 'Polly.Salli' }, // 'Polly.Salli' is a premium sounding AI voice
    'Welcome to Alpha Stack PhoneMail. To instantly activate your premium email account, please press 1.'
  );

  // If the user doesn't enter input, loop back to the same menu
  twiml.redirect('/api/voice/incoming');

  res.type('text/xml');
  res.send(twiml.toString());
});

router.post('/process', async (req: Request, res: Response) => {
  const twiml = new VoiceResponse();
  const digits = req.body.Digits;
  const callerPhone = req.body.From; // The phone number of the person calling

  if (digits === '1') {
    try {
      const normalizedPhone = normalizePhone(callerPhone);
      // Create user if they don't exist
      const checkUser = await pool.query('SELECT * FROM users WHERE phone = $1', [normalizedPhone]);
      
      if (checkUser.rows.length === 0) {
        const defaultEmail = phoneToEmail(normalizedPhone);
        const cleanPhone = normalizedPhone.replace(/[^0-9]/g, '');
        await pool.query(
          `INSERT INTO users (phone, email, display_name, registration_method, has_mobile_app) 
           VALUES ($1, $2, $3, 'ivr', false)`,
          [normalizedPhone, defaultEmail, cleanPhone.slice(-10)]
        );
        
        twiml.say(
          { voice: 'Polly.Salli' },
          'Congratulations! Your PhoneMail account has been successfully created and activated. You can now log into our mobile or web app using this phone number. Goodbye!'
        );
      } else {
        twiml.say(
          { voice: 'Polly.Salli' },
          'Your account is already active. You can log into the PhoneMail app at any time. Goodbye!'
        );
      }
    } catch (error) {
      console.error('Error creating user via IVR:', error);
      twiml.say(
        { voice: 'Polly.Salli' },
        'We encountered a system error while setting up your account. Please try again later.'
      );
    }
  } else {
    twiml.say({ voice: 'Polly.Salli' }, 'Invalid selection.');
    twiml.redirect('/api/voice/incoming');
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// SIMULATE ENDPOINT FOR DEMO PURPOSES
router.post('/simulate', async (req: Request, res: Response) => {
  const callerPhone = req.body.phone;
  
  if (!callerPhone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const normalizedPhone = normalizePhone(callerPhone);
    const checkUser = await pool.query('SELECT * FROM users WHERE phone = $1', [normalizedPhone]);
    
    if (checkUser.rows.length === 0) {
      const defaultEmail = phoneToEmail(normalizedPhone);
      const cleanPhone = normalizedPhone.replace(/[^0-9]/g, '');
      await pool.query(
        `INSERT INTO users (phone, email, display_name, registration_method, has_mobile_app) 
         VALUES ($1, $2, $3, 'ivr', false)`,
        [normalizedPhone, defaultEmail, cleanPhone.slice(-10)]
      );
      res.json({ success: true, message: 'Account successfully activated via Simulated IVR Call!' });
    } else {
      res.json({ success: true, message: 'Your account is already active. No need to call again!' });
    }
  } catch (error) {
    console.error('Error simulating IVR:', error);
    res.status(500).json({ error: 'Failed to simulate IVR call' });
  }
});

// SERVE TWIML FOR OUTBOUND CALL
router.get('/twiml', (req: Request, res: Response) => {
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const confirmUrl = `${protocol}://${host}/api/voice/ivr-confirm`;
  
  console.log(`📞 [TwiML] Serving IVR TwiML. Confirm URL: ${confirmUrl}`);
  
  res.type('text/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="${confirmUrl}" method="POST" timeout="10">
    <Say voice="alice">Welcome to Phone Mail. To activate your Phone Mail account and convert your phone number into an email address, please press 1. To cancel, press 2.</Say>
  </Gather>
  <Say voice="alice">We didn't receive any input. Goodbye!</Say>
</Response>`);
});

// INITIATE OUTBOUND CALL
router.post('/initiate-call', async (req: Request, res: Response): Promise<void> => {
  const { phone, baseUrl } = req.body;
  if (!phone) {
    res.status(400).json({ error: 'Phone number is required' });
    return;
  }
  
  const success = await initiateOutboundCall(phone, baseUrl || 'http://localhost:4000');
  
  if (success) {
    res.json({ success: true, message: 'Call initiated' });
  } else {
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});

// HANDLE DIGIT PRESS FROM OUTBOUND CALL
router.post('/ivr-confirm', async (req: Request, res: Response) => {
  const twiml = new VoiceResponse();
  const digits = req.body.Digits;
  // For outbound calls, 'To' is the user's phone. For inbound, 'From' is.
  const callerPhone = req.body.To || req.body.From;
  
  console.log(`📞 [IVR-Confirm] Digits: ${digits}, Phone: ${callerPhone}`);

  if (digits === '1') {
    try {
      const normalizedPhone = normalizePhone(callerPhone);
      const checkUser = await pool.query('SELECT * FROM users WHERE phone = $1', [normalizedPhone]);
      
      if (checkUser.rows.length === 0) {
        const defaultEmail = phoneToEmail(normalizedPhone);
        const cleanPhone = normalizedPhone.replace(/[^0-9]/g, '');
        await pool.query(
          `INSERT INTO users (phone, email, display_name, registration_method, has_mobile_app) 
           VALUES ($1, $2, $3, 'ivr', false)`,
          [normalizedPhone, defaultEmail, cleanPhone.slice(-10)]
        );
        console.log(`✅ Account created via IVR for ${normalizedPhone}`);
      }
      twiml.say(
        { voice: 'alice' },
        'Thank you! Your Phone Mail account has been activated successfully. You can now log into the Phone Mail app using this phone number. Goodbye!'
      );
    } catch (error) {
      console.error('Error creating user via Outbound IVR:', error);
      twiml.say(
        { voice: 'alice' },
        'We encountered a system error. Please try again later. Goodbye!'
      );
    }
  } else if (digits === '2') {
    twiml.say({ voice: 'alice' }, 'Your request has been cancelled. Thank you for calling Phone Mail. Goodbye!');
  } else {
    twiml.say({ voice: 'alice' }, 'Invalid selection. Goodbye!');
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

export default router;

