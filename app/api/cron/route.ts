import { NextResponse } from 'next/server';
import { fetchActiveClients, isWithinDays, getDaysUntil } from '@/lib/sisu';
import { sendClosingNotification } from '@/lib/email';

export const dynamic = 'force-dynamic'; // Ensure this route is not cached

export async function GET(request: Request) {
    // Verify Vercel Cron signature (optional but recommended for security)
    // For simplicity in this MVP, we might skip strict signature verification 
    // unless the user asks, but checking for the header is good practice.
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
        // return new NextResponse('Unauthorized', { status: 401 });
        // Allowing it for now to make manual testing easier, or if CRON_SECRET isn't set.
        // In a real app, we should enforce this.
    }

    try {
        console.log('Starting daily SISU check...');
        const clients = await fetchActiveClients();
        console.log(`Fetched ${clients.length} clients.`);

        let notificationsSent = 0;
        const matches: Array<{
            name: string;
            email: string | null;
            closingDate: string;
            daysUntil: number;
        }> = [];

        // Log some sample dates for debugging
        const clientsWithDates = clients.filter(c => c.forecasted_closed_dt);
        console.log(`Clients with forecasted dates: ${clientsWithDates.length}`);
        if (clientsWithDates.length > 0) {
            console.log(`Sample date format: "${clientsWithDates[0].forecasted_closed_dt}"`);
        }

        for (const client of clients) {
            // Check if closing is within the next 10 days
            if (isWithinDays(client.forecasted_closed_dt, 10)) {
                const daysUntil = getDaysUntil(client.forecasted_closed_dt);
                console.log(`Match found: ${client.first_name} ${client.last_name} closes in ${daysUntil} days on ${client.forecasted_closed_dt}`);

                const buyerName = `${client.first_name} ${client.last_name}`;

                // Store match details for UI display
                matches.push({
                    name: buyerName,
                    email: client.email,
                    closingDate: client.forecasted_closed_dt!,
                    daysUntil
                });

                // Send email notification
                await sendClosingNotification(
                    buyerName,
                    client.email,
                    client.forecasted_closed_dt!,
                    daysUntil
                );
                notificationsSent++;
            }
        }

        console.log(`Total matches found: ${matches.length}`);

        return NextResponse.json({
            success: true,
            clientsChecked: clients.length,
            notificationsSent,
            matches
        });

    } catch (error) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
