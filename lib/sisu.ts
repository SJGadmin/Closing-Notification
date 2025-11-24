import { z } from 'zod';

const BASE_URL = 'https://api.sisu.co/api/v1';

// Environment variables
const SISU_AUTH_HEADER = process.env.SISU_AUTH_HEADER;
const SISU_AGENT_ID = parseInt(process.env.SISU_AGENT_ID || '186897');
const SISU_MARKET_ID = parseInt(process.env.SISU_MARKET_ID || '0');

if (!SISU_AUTH_HEADER) {
    throw new Error('Missing SISU_AUTH_HEADER environment variable');
}

// Types
export interface SisuClient {
    client_id: number;
    first_name: string;
    last_name: string;
    email: string | null;
    forecasted_closed_dt: string | null; // Format: "Thu, 18 Sep 2025 00:00:00 GMT" or ISO
    status_code: string | null;
    pipeline_status: string | null;
}

interface SisuListResponse {
    clients: SisuClient[];
    status: string;
}

/**
 * Fetches active clients/transactions from SISU.
 * Uses a two-step process:
 * 1. Fetch list of clients (IDs).
 * 2. Fetch details for each client (to get closing date).
 */
export async function fetchActiveClients(): Promise<SisuClient[]> {
    const listEndpoint = `${BASE_URL}/client/list`;

    // Step 1: Get the list (IDs only)
    const body = {
        market_id: 0,
        context: 'team',
        context_id: 3168, // Team ID
        column_filter: 'appt_set_dt',
        limit: 1000,
        // add_return_columns removed as it breaks the query
    };

    try {
        console.log('Fetching client list...');
        const response = await fetch(listEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': SISU_AUTH_HEADER!,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`SISU List Error: ${response.status} ${text}`);
            throw new Error(`Failed to fetch client list: ${response.statusText}`);
        }

        const data = (await response.json()) as any;
        const basicClients = data.clients || [];
        console.log(`Found ${basicClients.length} clients in list. Fetching details...`);

        // Step 2: Fetch details for each client in batches
        const detailedClients: SisuClient[] = [];
        const BATCH_SIZE = 10;

        for (let i = 0; i < basicClients.length; i += BATCH_SIZE) {
            const batch = basicClients.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (c: any) => {
                try {
                    const detailRes = await fetch(`${BASE_URL}/client/edit-client/${c.id}`, {
                        headers: { 'Authorization': SISU_AUTH_HEADER! }
                    });
                    if (detailRes.ok) {
                        return await detailRes.json();
                    }
                    return null;
                } catch (e) {
                    console.error(`Failed to fetch details for ${c.id}`, e);
                    return null;
                }
            });

            const results = await Promise.all(batchPromises);
            const validResults = results.filter(r => r !== null);
            detailedClients.push(...validResults);
            console.log(`Fetched details for batch ${i / BATCH_SIZE + 1}/${Math.ceil(basicClients.length / BATCH_SIZE)}`);
        }

        return detailedClients;

    } catch (error) {
        console.error('Error fetching SISU clients:', error);
        throw error;
    }
}

/**
 * Checks if a date string is exactly N days from today (ignoring time).
 */
export function isDaysAway(dateString: string | null, days: number): boolean {
    if (!dateString) return false;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    targetDate.setHours(0, 0, 0, 0);

    const checkDate = new Date(dateString);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate.getTime() === targetDate.getTime();
}
