import { test, expect } from '@playwright/test';
import { ConvexClient } from '@/support/api/ConvexClient';
import { CONVEX_FN } from '@config/convex-functions';

const CLEANUP_OPT_IN = 'ALLOW_DESTRUCTIVE_CLEANUP';

/**
 * [DB-CLEANUP] Database Cleanup Utilities
 *
 * Destructive Convex mutations. Skipped unless process.env.ALLOW_DESTRUCTIVE_CLEANUP === 'true'
 * (e.g. `ALLOW_DESTRUCTIVE_CLEANUP=true npm run cleanup`). Never set that in CI or production env files.
 */
test.describe('Utility: Database Cleanup', () => {
    test.describe.configure({ retries: 0 });

    test.skip(
        () => process.env[CLEANUP_OPT_IN] !== 'true',
        `Set ${CLEANUP_OPT_IN}=true to run (destructive). See .env.example.`,
    );

    let convex: ConvexClient;

    test.beforeEach(async ({ request }) => {
        convex = new ConvexClient(request);
    });

    test('Remove event and all related data by Event ID', async () => {
        // 🛠️ CONFIGURATION: pick ONE shape; replace PASTE_EVENT_ID_HERE before running
        // const input: string | string[] = ['id_one', 'id_two', 'id_three'];
        const input: string | string[] = 'http://localhost:3000/event/PASTE_EVENT_ID_HERE';

        // Accepts a raw ID or a full URL — strips the path if needed
        const normalize = (entry: string): string =>
            entry.startsWith('http') ? entry.split('/').at(-1)! : entry;

        const eventIds = (Array.isArray(input) ? input : [input]).map(normalize);

        const hasPlaceholder = eventIds.some(
            (id) => id.includes('PASTE_') || id === 'id_one' || id === 'id_two' || id === 'id_three',
        );
        if (hasPlaceholder) {
            throw new Error(
                'Edit `input` in db-cleanup.spec.ts: use real Convex event IDs (no PASTE_* or example ids).',
            );
        }

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

    test('Remove tickets by creation date range', async () => {
        // 🛠️ CONFIGURATION: set both dates (YYYY-MM-DD) before running
        const startDateStr = 'YYYY-MM-DD';
        const endDateStr = 'YYYY-MM-DD';

        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateStr) || !/^\d{4}-\d{2}-\d{2}$/.test(endDateStr)) {
            throw new Error('Set startDateStr and endDateStr to real dates (YYYY-MM-DD) before running.');
        }

        const startDate = new Date(startDateStr).getTime();
        const endDate = new Date(endDateStr).getTime();

        if (Number.isNaN(startDate) || Number.isNaN(endDate)) {
            throw new Error('Invalid date range — use YYYY-MM-DD.');
        }

        process.stdout.write(`\n🧹 Cleaning up tickets between ${startDateStr} and ${endDateStr}...\n`);

        const result = await convex.mutation(CONVEX_FN.dbCleanup.removeTicketsByDate, { startDate, endDate });

        expect(result.success).toBe(true);
        process.stdout.write(`✅ Successfully removed ${result.deletedCount} tickets.\n`);
    });
});
