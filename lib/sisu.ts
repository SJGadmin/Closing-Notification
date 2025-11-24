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
 * Uses the specific parameters found during exploration to ensure data retrieval.
 */
export async function fetchActiveClients(): Promise<SisuClient[]> {
    const endpoint = `${BASE_URL}/client/list`;

    const body = {
        market_id: SISU_MARKET_ID,
        context: 'agent',
        context_id: SISU_AGENT_ID,
        column_filter: 'appt_set_dt', // Required parameter
        limit: 1000, // Fetch enough to cover active deals
        add_return_columns: [
            'client_id',
            'first_name',
            'last_name',
            'email',
            'forecasted_closed_dt',
            'status_code',
            'pipeline_status',
            'appt_set_dt'
        ]
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': SISU_AUTH_HEADER!,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`SISU API Error: ${response.status} ${response.statusText} - ${text}`);
            throw new Error(`Failed to fetch clients: ${response.statusText}`);
        }

        const data = (await response.json()) as SisuListResponse;

        if (!data.clients) {
            console.warn('SISU API returned no clients array:', data);
            return [];
        }

        return data.clients;
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
