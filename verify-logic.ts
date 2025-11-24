import { fetchActiveClients, isDaysAway } from './lib/sisu';

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

        // Test date logic with a fake date
        const today = new Date();
        const tenDaysFromNow = new Date();
        tenDaysFromNow.setDate(today.getDate() + 10);
        const testDateStr = tenDaysFromNow.toISOString();

        console.log(`Testing isDaysAway with date ${testDateStr} (should be true)...`);
        const result = isDaysAway(testDateStr, 10);
        console.log(`Result: ${result}`);

        if (result) {
            console.log('✅ Date logic passed.');
        } else {
            console.error('❌ Date logic failed.');
        }

        // Check real clients
        console.log('Checking real clients for 10-day matches...');
        const matches = clients.filter(c => isDaysAway(c.forecasted_closed_dt, 10));
        console.log(`Found ${matches.length} matches.`);
        matches.forEach(m => console.log(`- ${m.first_name} ${m.last_name}: ${m.forecasted_closed_dt}`));

    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verify();
