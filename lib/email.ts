import nodemailer from 'nodemailer';

// Environment variables
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const NOTIFICATION_EMAILS = ['grant@stewartandjane.com', 'julie@stewartandjane.com', 'justin@stewartandjane.com'];

export interface ClosingInfo {
    buyerName: string;
    buyerEmail: string | null;
    closingDate: string;
    daysUntil: number;
}

export async function sendConsolidatedClosingNotification(closings: ClosingInfo[]) {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.warn('Missing SMTP credentials. Email not sent.');
        return;
    }

    if (closings.length === 0) {
        console.log('No closings to notify about.');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });

    // Sort closings by days until closing (most urgent first)
    const sortedClosings = [...closings].sort((a, b) => a.daysUntil - b.daysUntil);

    // Determine overall urgency based on most urgent closing
    const mostUrgent = sortedClosings[0].daysUntil;
    const urgencyEmoji = mostUrgent <= 2 ? '🚨' : mostUrgent <= 5 ? '⚠️' : '🏠';

    // Create subject line
    const subject = closings.length === 1
        ? `${urgencyEmoji} Closing in ${sortedClosings[0].daysUntil} days: ${sortedClosings[0].buyerName}`
        : `${urgencyEmoji} ${closings.length} Upcoming Closings (next 15 days)`;

    // Build text version
    let textBody = `Hello Grant,\n\nYou have ${closings.length} transaction${closings.length > 1 ? 's' : ''} closing within the next 15 days:\n\n`;

    sortedClosings.forEach((closing, idx) => {
        const daysText = closing.daysUntil === 0 ? 'TODAY' :
                        closing.daysUntil === 1 ? 'tomorrow' :
                        `in ${closing.daysUntil} days`;

        textBody += `${idx + 1}. ${closing.buyerName} - Closes ${daysText}\n`;
        textBody += `   Email: ${closing.buyerEmail || 'N/A'}\n`;
        textBody += `   Closing Date: ${closing.closingDate}\n`;
        textBody += `   Days Until Closing: ${closing.daysUntil}\n\n`;
    });

    textBody += `Best,\nSISU Notifier`;

    // Build HTML version
    let htmlBody = `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px;">
        <h2>${urgencyEmoji} Upcoming Closing Reminder${closings.length > 1 ? 's' : ''}</h2>
        <p>Hello Grant,</p>
        <p>You have <strong>${closings.length} transaction${closings.length > 1 ? 's' : ''}</strong> closing within the next 15 days:</p>
        <div style="margin-top: 20px;">
    `;

    sortedClosings.forEach((closing, idx) => {
        const daysText = closing.daysUntil === 0 ? 'TODAY' :
                        closing.daysUntil === 1 ? 'tomorrow' :
                        `in ${closing.daysUntil} days`;

        const itemUrgencyEmoji = closing.daysUntil <= 2 ? '🚨' : closing.daysUntil <= 5 ? '⚠️' : '🏠';
        const urgencyColor = closing.daysUntil <= 2 ? '#dc2626' : closing.daysUntil <= 5 ? '#ea580c' : '#2563eb';

        htmlBody += `
          <div style="border: 2px solid ${urgencyColor}; border-radius: 8px; padding: 16px; margin-bottom: 16px; background-color: #f9fafb;">
            <h3 style="margin: 0 0 12px 0; color: ${urgencyColor};">
              ${itemUrgencyEmoji} ${closing.buyerName}
            </h3>
            <div style="color: #374151; line-height: 1.6;">
              <div><strong>Closes:</strong> <span style="color: ${urgencyColor}; font-weight: bold;">${daysText}</span></div>
              <div><strong>Email:</strong> ${closing.buyerEmail || 'N/A'}</div>
              <div><strong>Closing Date:</strong> ${closing.closingDate}</div>
              <div><strong>Days Until Closing:</strong> ${closing.daysUntil}</div>
            </div>
          </div>
        `;
    });

    htmlBody += `
        </div>
        <p style="margin-top: 24px;">Best,<br>SISU Notifier</p>
      </div>
    `;

    const mailOptions = {
        from: `"SISU Notifier" <${SMTP_USER}>`,
        to: NOTIFICATION_EMAILS.join(', '),
        subject,
        text: textBody,
        html: htmlBody,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Consolidated email sent: ${info.messageId}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

// Keep the old function for backward compatibility (used by verify-email.ts)
export async function sendClosingNotification(
    buyerName: string,
    buyerEmail: string | null,
    closingDate: string,
    daysUntil: number
) {
    // Just wrap the new consolidated function with a single closing
    return sendConsolidatedClosingNotification([{
        buyerName,
        buyerEmail,
        closingDate,
        daysUntil
    }]);
}
