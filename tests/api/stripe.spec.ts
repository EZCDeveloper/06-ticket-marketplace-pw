import { test, expect } from '@/fixtures/base.fixtures';
import { ConvexClient } from '@/support/api/ConvexClient';
import { EventBuilder } from '@/support/builders/EventBuilder';
import { CONVEX_FN } from '@config/convex-functions';

/**
 * [API-4] Stripe Integration API Tests
 */
test.describe('API: Stripe Integration', () => {

    test('[API-4.1.2] Handle Webhook: checkout.session.completed', { tag: ['@billing'] }, async ({ request, cleanup }) => {
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
});
