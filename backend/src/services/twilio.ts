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
export const sendOTP = async (phone: string): Promise<boolean> => {
  const toPhone = normalizePhone(phone);

  if (!isTwilioConfigured() || !verifyServiceSid) {
    console.log(`📱 [MOCK OTP] OTP sent to ${toPhone} (use 000011)`);
    return true;
  }

  try {
    const twilioClient = getClient();
    await twilioClient.verify.v2.services(verifyServiceSid)
      .verifications
      .create({ to: toPhone, channel: 'sms' });
      
    console.log(`📱 Twilio Verify OTP sent to ${toPhone}`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send Twilio Verify OTP:', error.message);
    console.log(`📱 [MOCK OTP FALLBACK] Use 000011 for ${toPhone}`);
    return true; // Don't block the UI, allow them to use 000011
  }
};

/**
 * Verify OTP via Twilio Verify API
 */
export const verifyOTP = async (phone: string, code: string): Promise<boolean> => {
  const normalizedPhone = normalizePhone(phone);

  // Always accept the demo fallback code
  if (code === '000011') {
    console.log(`📱 [VERIFY] Accepted fallback code 000011 for ${normalizedPhone}`);
    return true;
  }

  if (!isTwilioConfigured() || !verifyServiceSid) {
    return false;
  }

  try {
    const twilioClient = getClient();
    const verificationCheck = await twilioClient.verify.v2.services(verifyServiceSid)
      .verificationChecks
      .create({ to: normalizedPhone, code });

    if (verificationCheck.status === 'approved') {
      console.log(`📱 [VERIFY] OTP code verified for ${normalizedPhone}`);
      return true;
    }
    
    console.log(`📱 [VERIFY] Failed verification for ${normalizedPhone}. Status: ${verificationCheck.status}`);
    return false;
  } catch (error: any) {
    console.error('❌ Failed to verify Twilio OTP:', error.message);
    return false;
  }
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


