import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const sendExternalEmail = async (
  to: string,
  subject: string,
  text: string,
  html: string,
  senderName: string,
  senderLocalEmail: string
): Promise<boolean> => {
  const smtpUser = process.env.EXTERNAL_SMTP_USER;
  const smtpPass = process.env.EXTERNAL_SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.error('❌ Missing EXTERNAL_SMTP_USER or EXTERNAL_SMTP_PASS in .env');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Standard Gmail relay
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // We set the "From" to look like it's from the local address, but authenticated by the real SMTP user
    // We set the "Reply-To" so that if the recipient hits reply, it attempts to send back to the local address.
    const mailOptions = {
      from: `"${senderName}" <${smtpUser}>`, // Gmail overrides 'from' address anyway, so we use the real one but set a custom name
      replyTo: `"${senderName}" <${senderLocalEmail}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ External email sent successfully: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send external email:', error);
    return false;
  }
};
