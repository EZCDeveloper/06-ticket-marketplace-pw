import { test, expect } from '@/fixtures/base.fixtures';
import { EventBuilder } from '@/support/builders/EventBuilder';
import { ConvexClient } from '@/support/api/ConvexClient';
import { CONVEX_FN } from '@config/convex-functions';

/**
 * FLOW 5 | API - 5: Event Cancellation
 *
 * Covers the business logic for the cancellation flow:
 * Event Owner → View My Events → Select Event → Cancel Event →
 * System Processes Refunds → Notify All Ticket Holders → Update Event Status
 *
 * @see ABOUT_APPLICATION.md — API - 5: Event Cancellation
 */
test.describe('API - 5: Event Cancellation', () => {

    test('[API - 5.1] Cancel Event', { tag: ['@events', '@flow-4'] }, async ({ request, cleanup }) => {
        const convex = new ConvexClient(request);
        const eventData = new EventBuilder().build();
        let eventId: string;

        await test.step('Step 1: Create an event', async () => {
            eventId = await convex.mutation(CONVEX_FN.events.create, eventData);
            cleanup.track('event', eventId);
        });

        await test.step('Step 2: Cancel the event', async () => {
            const result = await convex.mutation(CONVEX_FN.events.cancelEvent, { eventId });
            expect(result.success).toBe(true);
        });

        await test.step('Step 3: Verify event status is cancelled', async () => {
            const event = await convex.query(CONVEX_FN.events.getById, { eventId });
            expect(event.is_cancelled).toBe(true);
        });
    });
});
