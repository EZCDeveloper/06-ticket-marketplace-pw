import { test, expect } from '@/fixtures/base.fixtures';
import { EventBuilder } from '@/support/builders/EventBuilder';
import { ConvexClient } from '@/support/api/ConvexClient';
import { CONVEX_FN } from '@config/convex-functions';

/**
 * FLOW 4 | API - 4: Queue Management
 *
 * Covers the business logic for the queue system:
 * User → Join Queue → Wait for Position → Receive Timed Offer →
 * Complete Purchase (within 10 minutes) OR Release Offer →
 * Next Person in Queue Gets Offer
 *
 * @see ABOUT_APPLICATION.md — API - 4: Queue Management
 */
test.describe('API - 4: Queue Management', () => {

    test('[API - 4.1] Join Queue - FIFO Validation', { tag: ['@queue', '@critical', '@flow-3'] }, async ({ request, cleanup }) => {
        const convex = new ConvexClient(request);
        const eventData = new EventBuilder().withTickets(1).build();
        let eventId: string;

        await test.step('Step 1: Create event with 1 ticket', async () => {
            eventId = await convex.mutation(CONVEX_FN.events.create, eventData);
            cleanup.track('event', eventId);
        });

        const userA = `user_a_${Date.now()}`;
        const userB = `user_b_${Date.now()}`;

        await test.step('Step 2: User A joins (gets Offered)', async () => {
            const resultA = await convex.mutation(CONVEX_FN.events.joinWaitingList, { eventId, userId: userA });
            expect(resultA.status).toBe('offered');
        });

        await test.step('Step 3: User B joins (gets Waiting)', async () => {
            const resultB = await convex.mutation(CONVEX_FN.events.joinWaitingList, { eventId, userId: userB });
            expect(resultB.status).toBe('waiting');
        });

        await test.step('Step 4: Verify queue positions via query', async () => {
            const queuePosB = await convex.query(CONVEX_FN.waitingList.getQueuePosition, { eventId, userId: userB });
            expect(queuePosB.position).toBe(2);
        });
    });
});
