import { test, expect } from '@playwright/test';
import { ConvexClient } from '@/support/api/ConvexClient';

/**
 * [DB-CLEANUP] Database Cleanup Utilities
 * 
 * These tests are designed to be run manually to clean up test data.
 * They are skipped by default to prevent accidental data loss during CI runs.
 */
test.describe('Utility: Database Cleanup', () => {
    let convex: ConvexClient;

    test.beforeEach(async ({ request }) => {
        convex = new ConvexClient(request);
    });

    /**
     * Helper to extract Event ID from a URL
     * Example: http://localhost:3000/event/jh7292enhwy0f43dkp7r24qw3980eqve
     */
    const extractEventId = (url: string): string => {
        const parts = url.split('/');
        return parts[parts.length - 1];
    };

    test.skip('Remove event and all related data by Event ID', async ({ baseURL }) => {
        // 🛠️ CONFIGURATION: Set the event URL here
        const event = 'jh77j5q9r5qzk98zxrfw4a3xzh812651';
        const eventUrl = `${baseURL}/event/${event}`;
        const eventId = extractEventId(eventUrl);

        process.stdout.write(`\n🧹 Cleaning up event: ${eventId}...\n`);

        try {
            // ✅ ACT: Call the cleanup mutation
            const result = await convex.mutation('dbCleanup:removeEventAndTickets', { eventId });

            // Check if result is valid
            if (!result) {
                process.stdout.write(`⚠️  Event not found: ${eventId}\n`);
                process.stdout.write(`   The event may have already been deleted.\n`);
                return;
            }

            // ✅ ASSERT: Success and log result
            expect(result.success).toBe(true);
            process.stdout.write(`✅ Successfully removed:\n`);
            process.stdout.write(`   - Event: ${result.deletedEvent ? '1' : '0'}\n`);
            process.stdout.write(`   - Tickets: ${result.deletedTickets}\n`);
            process.stdout.write(`   - Waiting list entries: ${result.deletedWaitingListEntries}\n`);
        } catch (error: any) {
            // Handle case where event doesn't exist
            if (error.message?.includes('not found') || error.message?.includes('Document not found') || error.message?.includes('Event not found')) {
                process.stdout.write(`⚠️  Event not found: ${eventId}\n`);
                process.stdout.write(`   The event may have already been deleted.\n`);
            } else {
                throw error; // Re-throw unexpected errors
            }
        }
    });

    test.skip('Remove tickets by creation date range', async () => {
        // 🛠️ CONFIGURATION: Set the dates here (YYYY-MM-DD)
        const startDateStr = '2023-01-01';
        const endDateStr = '2023-12-31';

        const startDate = new Date(startDateStr).getTime();
        const endDate = new Date(endDateStr).getTime();

        process.stdout.write(`\n🧹 Cleaning up tickets between ${startDateStr} and ${endDateStr}...\n`);

        // ✅ ACT: Call the cleanup mutation
        const result = await convex.mutation('dbCleanup:removeTicketsByDate', { startDate, endDate });

        // ✅ ASSERT: Success and log result
        expect(result.success).toBe(true);
        process.stdout.write(`✅ Successfully removed ${result.deletedCount} tickets.\n`);
    });
});
