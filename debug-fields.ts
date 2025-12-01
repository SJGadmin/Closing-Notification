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

async function debugFields() {
    const { fetchActiveClients } = await import('./lib/sisu.js');

    console.log('--- Debugging SISU Fields ---\n');

    try {
        const clients = await fetchActiveClients();
        console.log(`Fetched ${clients.length} clients.\n`);

        if (clients.length > 0) {
            console.log('First client full object:');
            console.log(JSON.stringify(clients[0], null, 2));

            console.log('\n\nAll fields in first client:');
            Object.keys(clients[0]).forEach(key => {
                console.log(`  ${key}: ${typeof clients[0][key]} = ${JSON.stringify(clients[0][key])}`);
            });

            // Look for any field that might contain a date
            console.log('\n\nLooking for date fields in first 5 clients:');
            clients.slice(0, 5).forEach((client, idx) => {
                console.log(`\nClient ${idx + 1}: ${client.first_name} ${client.last_name}`);
                Object.keys(client).forEach(key => {
                    const value = client[key];
                    if (value && typeof value === 'string') {
                        // Check if it looks like a date
                        if (value.includes('2025') || value.includes('2024') || value.includes('/') && value.length < 30) {
                            console.log(`  ${key}: "${value}"`);
                        }
                    }
                });
            });
        }

    } catch (error) {
        console.error('Debug failed:', error);
    }
}

debugFields();
