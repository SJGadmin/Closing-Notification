// Load environment variables from .env
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            let value = valueParts.join('=');
            // Remove surrounding quotes if present
            if (value && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
                value = value.slice(1, -1);
            }
            if (key && value) {
                process.env[key] = value;
            }
        }
    });
    console.log('Loaded environment variables from .env\n');
}

// Now import after env is loaded
async function debugDates() {
    const { fetchActiveClients } = await import('./lib/sisu.js');

    console.log('--- Debugging SISU Date Formats ---\n');

    try {
        const clients = await fetchActiveClients();
        console.log(`Fetched ${clients.length} clients.\n`);

        // Find clients with closing dates
        const clientsWithDates = clients.filter(c => c.forecasted_closed_dt);

        console.log(`Found ${clientsWithDates.length} clients with forecasted closing dates.\n`);

        // Show the first 5 clients with dates
        console.log('Sample clients with dates:');
        clientsWithDates.slice(0, 5).forEach((client, idx) => {
            console.log(`\n${idx + 1}. ${client.first_name} ${client.last_name}`);
            console.log(`   Raw date value: "${client.forecasted_closed_dt}"`);
            console.log(`   Type: ${typeof client.forecasted_closed_dt}`);

            // Try to parse it
            const parsed = new Date(client.forecasted_closed_dt!);
            console.log(`   Parsed Date object: ${parsed}`);
            console.log(`   ISO String: ${parsed.toISOString()}`);
            console.log(`   Is valid: ${!isNaN(parsed.getTime())}`);

            // Calculate days
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const checkDate = new Date(client.forecasted_closed_dt!);
            checkDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            console.log(`   Days from today: ${diffDays}`);
        });

        // Find the specific Dec 8 closing
        const dec8Clients = clientsWithDates.filter(c => {
            const dateStr = c.forecasted_closed_dt || '';
            return dateStr.includes('12/08/2025') || dateStr.includes('2025-12-08') || dateStr.includes('08 Dec 2025') || dateStr.includes('Dec 08 2025');
        });

        if (dec8Clients.length > 0) {
            console.log('\n\n=== FOUND DECEMBER 8TH CLOSING(S) ===');
            dec8Clients.forEach(client => {
                console.log(`\nClient: ${client.first_name} ${client.last_name}`);
                console.log(`Raw date: "${client.forecasted_closed_dt}"`);
                console.log(`Email: ${client.email}`);
            });
        } else {
            console.log('\n\n=== NO DECEMBER 8TH CLOSINGS FOUND ===');
            console.log('Showing all unique date formats (first 20):');
            const uniqueDates = [...new Set(clientsWithDates.map(c => c.forecasted_closed_dt))];
            uniqueDates.slice(0, 20).forEach(date => {
                console.log(`  - "${date}"`);
            });
        }

    } catch (error) {
        console.error('Debug failed:', error);
    }
}

debugDates();
