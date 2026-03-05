import { test, expect } from '@/fixtures/base.fixtures';
import { EventBuilder } from '@/support/builders/EventBuilder';
import { ConvexClient } from '@/support/api/ConvexClient';
import { TEST_EVENT_OWNER_USER_ID } from '@/support/config/testUsers';
import { CONVEX_FN } from '@config/convex-functions';

/**
 * Flow 3 | E2E Tests — Queue Management
 *
 * Validates edge cases and non-happy-path scenarios of the queue system:
 * User → Join Queue → Wait for Position → Receive Timed Offer →
 * Complete Purchase (within 10 minutes) OR Release Offer →
 * Next Person in Queue Gets Offer
 *
 * @see ABOUT_APPLICATION.md — Flow 3: Queue Management Flow
 */
test.describe('Flow 3 | E2E: Queue Management', () => {

    test('[F3-E2E-1] Sold Out View', { tag: ['@queue', '@flow-3'] }, async ({ buyer, request, cleanup }) => {
        const convex = new ConvexClient(request);
        const eventData = new EventBuilder().withTickets(0).build();
        let eventId: string;

        await test.step('Step 1: Create a sold out event', async () => {
            eventId = await convex.mutation(CONVEX_FN.events.create, eventData);
            cleanup.track('event', eventId);
        });

        await test.step('Step 2: Navigate to Event Page', async () => {
            await buyer.navigateToEvent(eventId);
        });

        await test.step('Step 3: Verify Sold Out status', async () => {
            await buyer.verifySoldOut();
        });
    });

    test('[F3-E2E-2] Rate Limit Warning on Excessive Queue Attempts', { tag: ['@queue', '@negative', '@flow-3'] }, async ({ buyer, convex, cleanup }) => {
        let rateLimitSeen = false;

        await test.step('Step 1: Attempt joins across events until rate limit appears', async () => {
            for (let i = 0; i < 4; i++) {
                const eventData = new EventBuilder().withTickets(1).build();
                const eventId = await convex.mutation(CONVEX_FN.events.create, {
                    ...eventData,
                    userId: TEST_EVENT_OWNER_USER_ID,
                });
                cleanup.track('event', eventId);

                await buyer.navigateToEvent(eventId);
                await buyer.joinQueueExpectRateLimit(2500).then(() => {
                    rateLimitSeen = true;
                }).catch(() => {
                    // Rate limit not hit yet for this iteration.
                });

                if (rateLimitSeen) break;
            }
        });

        await test.step('Step 2: Validate rate-limit feedback is shown', async () => {
            expect(rateLimitSeen).toBe(true);
        });
    });

    test.skip('[F3-E2E-3] Two Buyers Compete for Last Ticket (PENDING)', { tag: ['@queue', '@slow', '@flow-3'] }, async () => {
        /**
         * PENDING: Multi-user visual concurrency scenario.
         *
         * Proposed implementation (same spec, no new file):
         * 1) Create event with exactly 1 ticket.
         * 2) Open two isolated browser contexts (Buyer Persona 1 / Buyer Persona 2).
         * 3) Authenticate each buyer with different credentials.
         * 4) Both navigate to same event and join queue.
         * 5) Buyer 1 completes purchase.
         * 6) Validate Buyer 2 cannot purchase and sees waiting/sold-out state.
         *
         * Notes:
         * - Requires dedicated env vars for two accounts.
         * - Prefer deterministic synchronization to reduce flakiness.
         */
    });
});
