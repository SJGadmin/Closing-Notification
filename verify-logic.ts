import { fetchActiveClients, isWithinDays, getDaysUntil } from './lib/sisu';

// Mock env vars for the script execution if needed,
// but we will rely on the user's environment or hardcoded values for the test run.
// We need to make sure process.env is populated when running this.

async function verify() {
    console.log('--- Verifying SISU Logic ---');

    try {
        const clients = await fetchActiveClients();
        console.log(`Fetched ${clients.length} clients.`);

        if (clients.length > 0) {
            console.log('Sample Client:', JSON.stringify(clients[0], null, 2));
        }

        // Test date logic with various dates
        const today = new Date();

        console.log('\n--- Testing Date Logic ---');

        // Test 10 days from now
        const tenDaysFromNow = new Date();
        tenDaysFromNow.setDate(today.getDate() + 10);
        const testDate10 = tenDaysFromNow.toISOString();
        console.log(`Testing isWithinDays with date ${testDate10} (10 days from now, should be true)...`);
        const result10 = isWithinDays(testDate10, 10);
        console.log(`Result: ${result10} - Days until: ${getDaysUntil(testDate10)}`);

        // Test 8 days from now
        const eightDaysFromNow = new Date();
        eightDaysFromNow.setDate(today.getDate() + 8);
        const testDate8 = eightDaysFromNow.toISOString();
        console.log(`Testing isWithinDays with date ${testDate8} (8 days from now, should be true)...`);
        const result8 = isWithinDays(testDate8, 10);
        console.log(`Result: ${result8} - Days until: ${getDaysUntil(testDate8)}`);

        // Test 15 days from now
        const fifteenDaysFromNow = new Date();
        fifteenDaysFromNow.setDate(today.getDate() + 15);
        const testDate15 = fifteenDaysFromNow.toISOString();
        console.log(`Testing isWithinDays with date ${testDate15} (15 days from now, should be false)...`);
        const result15 = isWithinDays(testDate15, 10);
        console.log(`Result: ${result15} - Days until: ${getDaysUntil(testDate15)}`);

        if (result10 && result8 && !result15) {
            console.log('✅ Date logic passed all tests.');
        } else {
            console.error('❌ Date logic failed some tests.');
        }

        // Check real clients
        console.log('\n--- Checking Real Clients ---');
        console.log('Clients closing within the next 10 days:');
        const matches = clients.filter(c => isWithinDays(c.forecasted_closed_dt, 10));
        console.log(`Found ${matches.length} matches.`);
        matches.forEach(m => {
            const daysUntil = getDaysUntil(m.forecasted_closed_dt);
            console.log(`- ${m.first_name} ${m.last_name}: ${m.forecasted_closed_dt} (${daysUntil} days)`);
        });

    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verify();
