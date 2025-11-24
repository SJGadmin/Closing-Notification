import nodemailer from 'nodemailer';

// Environment variables
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const NOTIFICATION_EMAIL = 'grant@stewartandjane.com';

export async function sendClosingNotification(
    buyerName: string,
    buyerEmail: string | null,
    closingDate: string
) {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.warn('Missing SMTP credentials. Email not sent.');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465, // true for 465, false for other ports
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });

    const mailOptions = {
        from: `"SISU Notifier" <${SMTP_USER}>`,
        to: NOTIFICATION_EMAIL,
        subject: `🏠 Upcoming Closing: ${buyerName}`,
        text: `
      Hello Grant,

      This is a reminder that a transaction is forecasted to close in 10 days.

      Buyer: ${buyerName}
      Email: ${buyerEmail || 'N/A'}
      Forecasted Closing Date: ${closingDate}

      Best,
      SISU Notifier
    `,
        html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>🏠 Upcoming Closing Reminder</h2>
        <p>Hello Grant,</p>
        <p>This is a reminder that a transaction is forecasted to close in 10 days.</p>
        <ul>
          <li><strong>Buyer:</strong> ${buyerName}</li>
          <li><strong>Email:</strong> ${buyerEmail || 'N/A'}</li>
          <li><strong>Forecasted Closing Date:</strong> ${closingDate}</li>
        </ul>
        <p>Best,<br>SISU Notifier</p>
      </div>
    `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${info.messageId}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}
