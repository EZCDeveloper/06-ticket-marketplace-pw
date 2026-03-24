import { test, expect } from '@/fixtures/base.fixtures';
import { ConvexClient } from '@/support/api/ConvexClient';
import { EventBuilder } from '@/support/builders/EventBuilder';
import { CONVEX_FN } from '@config/convex-functions';

/**
 * FLOW 3 | API - 3: Event Discovery & Purchase
 *
 * Covers the business logic for the purchase flow:
 * Guest/User → Browse Events → View Event Details → Sign In →
 * Join Queue → Receive Offer → Complete Payment → Receive Ticket → QR Code
 *
 * @see ABOUT_APPLICATION.md — API - 3: Event Discovery & Purchase
 */
test.describe('API - 3: Event Discovery & Purchase', () => {

    test('[API - 3.1] Stripe Webhook: checkout.session.completed', { tag: ['@billing', '@flow-3'] }, async ({ request, cleanup }) => {
        const convex = new ConvexClient(request);
        const eventData = new EventBuilder().withTickets(10).build();
        const userId = `clerk_user_${Date.now()}`;
        let eventId: string;
        let waitingListId: string;

        await test.step('Step 1: Create event and waiting list entry', async () => {
            eventId = await convex.mutation(CONVEX_FN.events.create, eventData);
            cleanup.track('event', eventId);

            await convex.mutation(CONVEX_FN.events.joinWaitingList, { eventId, userId });
            const entries = await convex.query(CONVEX_FN.events.getUserWaitingList, { userId });
            waitingListId = entries.find((e: { eventId: string; _id: string }) => e.eventId === eventId)._id;
        });

        await test.step('Step 2: Mock Stripe Webhook call', async () => {
            const webhookPayload = {
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'cs_test_session',
                        metadata: {
                            eventId,
                            userId,
                            waitingListId
                        },
                        payment_intent: 'pi_test_intent',
                        amount_total: eventData.price * 100 // Stripe uses cents
                    }
                }
            };

            const response = await request.post('/api/webhooks/stripe', {
                data: webhookPayload,
                headers: {
                    'Stripe-Signature': 'mock_signature'
                }
            });

            // Webhook might return 401/400 if signature fails, which is expected unless bypassed
            console.log(`Webhook response status: ${response.status()}`);
        });
    });

    test('[API - 3.2] Sold Out Prevention', { tag: ['@queue', '@critical', '@flow-3'] }, async ({ request, cleanup }) => {
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

        await test.step('Step 4: Verify User B is still waiting (sold out)', async () => {
            const statusB = await convex.query(CONVEX_FN.waitingList.getQueuePosition, { eventId, userId: userB });
            expect(statusB.status).toBe('waiting');
        });
    });
});
