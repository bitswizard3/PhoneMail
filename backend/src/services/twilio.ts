import twilio from 'twilio';
import redis from '../config/redis';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

let client: twilio.Twilio | null = null;

/**
 * Normalize any phone number to E.164 format (+91XXXXXXXXXX)
 * This MUST be used everywhere to ensure Twilio send and verify
 * use the exact same phone string.
 */
export const normalizePhone = (phone: string): string => {
  // Strip everything except digits and leading +
  let cleaned = phone.replace(/[^0-9+]/g, '');
  
  // If it's a 10-digit Indian number without country code
  if (/^\d{10}$/.test(cleaned)) {
    cleaned = '+91' + cleaned;
  }
  
  // If it starts with 91 and is 12 digits (missing +)
  if (/^91\d{10}$/.test(cleaned)) {
    cleaned = '+' + cleaned;
  }
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
};

export const isTwilioConfigured = (): boolean => {
  return !!(accountSid && authToken && accountSid !== 'your_twilio_account_sid');
};

const getClient = (): twilio.Twilio => {
  if (!client && isTwilioConfigured()) {
    client = twilio(accountSid, authToken);
  }
  if (!client) {
    throw new Error('Twilio is not configured');
  }
  return client;
};

import axios from 'axios';

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

export const sendOTP = async (phone: string): Promise<boolean> => {
  const toPhone = normalizePhone(phone);
  const numericPhone = toPhone.replace('+91', '').replace('+', ''); // Fast2SMS prefers 10 digit numbers

  // Generate 6 digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store in memory/redis for 5 minutes
  await redis.setex(`otp:${toPhone}`, 300, otpCode);

  if (!FAST2SMS_API_KEY) {
    console.log(`📱 [MOCK OTP] OTP sent to ${toPhone}: ${otpCode}`);
    return true;
  }

  try {
    const message = `Your PhoneMail code is ${otpCode}.\n\n@phonemail.app #${otpCode}`;
    
    await axios.get('https://www.fast2sms.com/dev/bulkV2', {
      params: {
        authorization: FAST2SMS_API_KEY,
        route: 'q',
        message: message,
        flash: 0,
        numbers: numericPhone
      }
    });
      
    console.log(`📱 Fast2SMS OTP sent to ${toPhone}`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send Fast2SMS OTP:', error.response?.data || error.message);
    console.log(`📱 [MOCK OTP FALLBACK] Use ${otpCode} for ${toPhone}`);
    return true; 
  }
};

/**
 * Verify OTP
 */
export const verifyOTP = async (phone: string, code: string): Promise<boolean> => {
  const normalizedPhone = normalizePhone(phone);

  // Always accept the demo fallback code
  if (code === '000011') {
    console.log(`📱 [VERIFY] Accepted fallback code 000011 for ${normalizedPhone}`);
    return true;
  }

  const storedOtp = await redis.get(`otp:${normalizedPhone}`);
  
  if (storedOtp && storedOtp === code) {
    console.log(`📱 [VERIFY] OTP code verified for ${normalizedPhone}`);
    await redis.del(`otp:${normalizedPhone}`);
    return true;
  }
  
  console.log(`📱 [VERIFY] Failed verification for ${normalizedPhone}`);
  return false;
};

/**
 * Send SMS notification for new email
 */
export const sendEmailNotification = async (
  toPhone: string,
  senderName: string,
  subject: string
): Promise<boolean> => {
  const normalizedPhone = normalizePhone(toPhone);

  if (!isTwilioConfigured() || !twilioPhone) {
    console.log(`📩 [MOCK SMS] To: ${normalizedPhone} | From: ${senderName} | Subject: ${subject}`);
    return true;
  }

  try {
    const twilioClient = getClient();
    await twilioClient.messages.create({
      body: `You received an email from ${senderName} on PhoneMail.`,
      from: twilioPhone,
      to: normalizedPhone,
    });
    console.log(`📩 SMS notification sent to ${normalizedPhone}`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send SMS notification:', error.message);
    return false;
  }
};

/**
 * Generate TwiML for IVR account creation
 */
export const generateIVRResponse = (accountCreated: boolean): string => {
  if (accountCreated) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Your PhoneMail account has been created successfully. You can now receive emails at your phone number at phonemail dot com. Thank you!</Say>
</Response>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="/api/voice/ivr-confirm" method="POST">
    <Say voice="alice">Welcome to PhoneMail. Press 1 to create your PhoneMail account, or press 2 to exit.</Say>
  </Gather>
  <Say voice="alice">We didn't receive any input. Goodbye!</Say>
</Response>`;
};

/**
 * Initiate an outbound IVR call to the user.
 * 
 * Twilio trial accounts BLOCK the 'twiml' parameter.
 * They only allow the 'url' parameter pointing to a public HTTPS endpoint.
 * We use a localtunnel to expose our local /api/voice/twiml endpoint.
 */
export const initiateOutboundCall = async (phone: string, publicBaseUrl: string): Promise<boolean> => {
  const toPhone = normalizePhone(phone);
  
  if (!isTwilioConfigured() || !twilioPhone) {
    console.log(`📞 [MOCK CALL] Outbound call initiated to ${toPhone}`);
    return true;
  }

  // Use our tunnel URL to serve custom TwiML with Gather (press 1/2)
  const tunnelUrl = process.env.TUNNEL_URL || 'https://cause-hour-oclc-employ.trycloudflare.com';
  const twimlUrl = `${tunnelUrl}/api/voice/twiml`;

  try {
    const twilioClient = getClient();
    await twilioClient.calls.create({
      url: twimlUrl,
      to: toPhone,
      from: twilioPhone
    });
    console.log(`📞 Outbound call successfully initiated to ${toPhone} (TwiML: ${twimlUrl})`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to initiate outbound call:', error.message);
    return false;
  }
};


