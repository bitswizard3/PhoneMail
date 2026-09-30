const twilio = require('twilio');
const dotenv = require('dotenv');
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const testPhone = '+918797135590';

const client = twilio(accountSid, authToken);

async function run() {
  console.log('Testing Verify API...');
  try {
    await client.verify.v2.services(verifyServiceSid).verifications.create({ to: testPhone, channel: 'sms' });
    console.log('✅ Verify API Success!');
  } catch (err) {
    console.error('❌ Verify API Error:', err.message);
  }

  console.log('\nTesting Programmable SMS...');
  try {
    await client.messages.create({
      body: 'Test Message',
      from: twilioPhone,
      to: testPhone,
    });
    console.log('✅ Programmable SMS Success!');
  } catch (err) {
    console.error('❌ Programmable SMS Error:', err.message);
  }
}

run();
