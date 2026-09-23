import { Router, Request, Response } from 'express';
import twilio from 'twilio';
import pool from '../config/database';

const router = Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

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
      // Create user if they don't exist
      const checkUser = await pool.query('SELECT * FROM users WHERE phone = $1', [callerPhone]);
      
      if (checkUser.rows.length === 0) {
        // Create new user (using phone as email prefix by default if needed, though they usually pick an alias later)
        const defaultEmail = `${callerPhone.replace(/[^0-9]/g, '').slice(-10)}@phonemail.local`;
        await pool.query(
          `INSERT INTO users (phone, email, is_verified, has_mobile_app) 
           VALUES ($1, $2, true, false)`,
          [callerPhone, defaultEmail]
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
    const checkUser = await pool.query('SELECT * FROM users WHERE phone = $1', [callerPhone]);
    
    if (checkUser.rows.length === 0) {
      const defaultEmail = `${callerPhone.replace(/[^0-9]/g, '').slice(-10)}@phonemail.local`;
      await pool.query(
        `INSERT INTO users (phone, email, is_verified, has_mobile_app) 
         VALUES ($1, $2, true, false)`,
        [callerPhone, defaultEmail]
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

export default router;
