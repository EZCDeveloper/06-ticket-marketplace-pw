import { test, expect } from '@/fixtures/base.fixtures';
import { EventBuilder } from '@/support/builders/EventBuilder';
import { ConvexClient } from '@/support/api/ConvexClient';
import { CONVEX_FN } from '@config/convex-functions';

/**
 * [API - 3] Queue Logic API Tests
 */
test.describe('API - 3: Queue Logic', () => {

    test('[API - 3.1] Join Searching Queue (FIFO Validation)', { tag: ['@queue', '@critical'] }, async ({ request, cleanup }) => {
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

    test('[API - 3.2] Sold Out Prevention', { tag: ['@queue', '@critical'] }, async ({ request, cleanup }) => {
        const convex = new ConvexClient(request);
        const eventData = new EventBuilder().withTickets(1).build();
        let eventId: string;

        await test.step('Step 1: Create event with 1 ticket', async () => {
            eventId = await convex.mutation(CONVEX_FN.events.create, eventData);
            cleanup.track('event', eventId);
        });

        const userA = `user_a_${Date.now()}`;
        const userB = `user_b_${Date.now()}`;

        await test.step('Step 2: Users join the queue', async () => {
            await convex.mutation(CONVEX_FN.events.joinWaitingList, { eventId, userId: userA });
            await convex.mutation(CONVEX_FN.events.joinWaitingList, { eventId, userId: userB });
        });

        await test.step('Step 3: User A purchases the ticket', async () => {
            const userAEntries = await convex.query(CONVEX_FN.events.getUserWaitingList, { userId: userA });
            const entryA = userAEntries.find((e: any) => e.eventId === eventId);

            await convex.mutation(CONVEX_FN.events.purchaseTicket, {
                eventId,
                userId: userA,
                waitingListId: entryA._id,
                paymentInfo: {
                    paymentIntentId: `pi_${Date.now()}`,
                    amount: eventData.price
                }
            });
        });

        await test.step('Step 4: Verify User B is still in waiting status (sold out)', async () => {
            const statusB = await convex.query(CONVEX_FN.waitingList.getQueuePosition, { eventId, userId: userB });
            expect(statusB.status).toBe('waiting');
        });
    });
});
