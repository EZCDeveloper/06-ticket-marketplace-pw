import { test, expect } from '@playwright/test';
import { EventBuilder } from '@/support/builders/EventBuilder';
import { UserBuilder } from '@/support/builders/UserBuilder';
import { ConvexClient } from '@/support/api/ConvexClient';

/**
 * [API-3] Queue Logic API Tests
 */
test.describe('API: Queue Logic', () => {
    let convex: ConvexClient;

    test.beforeEach(async ({ request }) => {
        convex = new ConvexClient(request);
    });

    test('[API-3.1.1] Join Searching Queue (FIFO Validation)', async () => {
        // ✅ ARRANGE: Create event with 1 ticket
        const eventData = new EventBuilder().withTickets(1).build();
        const eventId = await convex.mutation('events:create', eventData);

        const userA = `user_a_${Date.now()}`;
        const userB = `user_b_${Date.now()}`;

        // ✅ ACT: User A joins first, then User B
        const resultA = await convex.mutation('events:joinWaitingList', { eventId, userId: userA });
        const resultB = await convex.mutation('events:joinWaitingList', { eventId, userId: userB });

        // ✅ ASSERT: User A gets OFFERED (since 1 ticket available), User B gets WAITING
        expect(resultA.status).toBe('offered');
        expect(resultB.status).toBe('waiting');

        // Verify queue positions via query
        const queuePosB = await convex.query('waitingList:getQueuePosition', { eventId, userId: userB });
        // User A is at position 1 (OFFERED), User B is at position 2 (WAITING)
        expect(queuePosB.position).toBe(2);
    });

    test('[API-3.1.3] Sold Out Prevention', async () => {
        // ✅ ARRANGE: Event with 1 ticket, User A has offer
        const eventData = new EventBuilder().withTickets(1).build();
        const eventId = await convex.mutation('events:create', eventData);

        const userA = `user_a_${Date.now()}`;
        const userB = `user_b_${Date.now()}`;

        const resultA = await convex.mutation('events:joinWaitingList', { eventId, userId: userA });
        const resultB = await convex.mutation('events:joinWaitingList', { eventId, userId: userB });

        // We need the waitingListId for User A to purchase
        // In a real scenario, we'd query for it
        const userAEntries = await convex.query('events:getUserWaitingList', { userId: userA });
        const entryA = userAEntries.find((e: any) => e.eventId === eventId);

        // ✅ ACT: User A purchases
        await convex.mutation('events:purchaseTicket', {
            eventId,
            userId: userA,
            waitingListId: entryA._id,
            paymentInfo: {
                paymentIntentId: `pi_${Date.now()}`,
                amount: eventData.price
            }
        });

        // ✅ ASSERT: User B still in WAITING (since 0 tickets left)
        const statusB = await convex.query('waitingList:getQueuePosition', { eventId, userId: userB });
        expect(statusB.status).toBe('waiting'); // status from constants.ts is WAITING = "waiting"
    });
});
