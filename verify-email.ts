import { sendClosingNotification } from './lib/email';

async function verifyEmail() {
    console.log('--- Verifying Email Sending ---');

    try {
        console.log('Sending test email to grant@stewartandjane.com...');
        await sendClosingNotification(
            'Test Buyer',
            'testbuyer@example.com',
            '2025-12-25',
            10 // Test with 10 days until closing
        );
        console.log('✅ Email sent successfully!');
    } catch (error) {
        console.error('❌ Email failed:', error);
    }
}

verifyEmail();
