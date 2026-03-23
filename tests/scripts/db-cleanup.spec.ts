import { test, expect } from '@playwright/test';
import { ConvexClient } from '@/support/api/ConvexClient';
import { CONVEX_FN } from '@config/convex-functions';

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

    test.skip('Remove event and all related data by Event ID', async () => {
        // 🛠️ CONFIGURATION: activate ONE option, comment out the others
        // const input: string | string[] = ['id_one', 'id_two', 'id_three'];
        // const input: string | string[] = 'http://localhost:3000/event/PASTE_ID_HERE';
        const input: string | string[] = ['http://localhost:3000/event/jh7dceennrhd60vfew67watwtx82bbr8'];

        // Accepts a raw ID or a full URL — strips the path if needed
        const normalize = (entry: string): string =>
            entry.startsWith('http') ? entry.split('/').at(-1)! : entry;

        const eventIds = (Array.isArray(input) ? input : [input]).map(normalize);

        process.stdout.write(`\n🧹 Starting cleanup for ${eventIds.length} event(s)...\n`);

        for (const eventId of eventIds) {
            process.stdout.write(`\n🔹 Processing: ${eventId}\n`);
            try {
                const result = await convex.mutation(CONVEX_FN.dbCleanup.removeEventAndTickets, { eventId });

                if (!result) {
                    process.stdout.write(`⚠️  Not found: ${eventId} (may already be deleted)\n`);
                    continue;
                }

                expect(result.success).toBe(true);
                process.stdout.write(`✅ Removed — Event: ${result.deletedEvent ? 1 : 0} | Tickets: ${result.deletedTickets} | Waiting list: ${result.deletedWaitingListEntries}\n`);

            } catch (error: any) {
                const isNotFound = ['not found', 'Document not found', 'Event not found']
                    .some(msg => error.message?.includes(msg));

                if (isNotFound) {
                    process.stdout.write(`⚠️  Not found: ${eventId} (may already be deleted)\n`);
                } else {
                    throw error;
                }
            }
        }
    });

    test.skip('Remove tickets by creation date range', async () => {
        // 🛠️ CONFIGURATION: Set the dates here (YYYY-MM-DD)
        const startDateStr = '2026-03-16';
        const endDateStr = '2026-03-16';

        const startDate = new Date(startDateStr).getTime();
        const endDate = new Date(endDateStr).getTime();

        process.stdout.write(`\n🧹 Cleaning up tickets between ${startDateStr} and ${endDateStr}...\n`);

        // ✅ ACT: Call the cleanup mutation
        const result = await convex.mutation(CONVEX_FN.dbCleanup.removeTicketsByDate, { startDate, endDate });

        // ✅ ASSERT: Success and log result
        expect(result.success).toBe(true);
        process.stdout.write(`✅ Successfully removed ${result.deletedCount} tickets.\n`);
    });
});
