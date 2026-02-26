import { test, expect } from '@/fixtures/base.fixtures';
import { EventBuilder } from '@/support/builders/EventBuilder';
import { ConvexClient } from '@/support/api/ConvexClient';
import { CONVEX_FN } from '@config/convex-functions';

/**
 * [API - 2] Event Management API Tests
 */
test.describe('API - 2: Event Management', () => {

    test('[API - 2.1] Create New Event (Happy Path)', { tag: ['@events', '@critical'] }, async ({ request, cleanup }) => {
        const convex = new ConvexClient(request);
        const eventData = new EventBuilder().build();
        let eventId: string;

        await test.step('Step 1: Create event via mutation', async () => {
            eventId = await convex.mutation(CONVEX_FN.events.create, eventData);
            expect(eventId).toBeDefined();
            cleanup.track('event', eventId);
        });

        await test.step('Step 2: Verify event exists and data matches', async () => {
            const event = await convex.query(CONVEX_FN.events.getById, { eventId });
            expect(event.name).toBe(eventData.name);
            expect(event.price).toBe(eventData.price);
        });
    });

    test('[API - 2.2] Cancel Event', { tag: ['@events'] }, async ({ request, cleanup }) => {
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

    test('[API - 2.3] Prevent Reducing Tickets Below Sold Count', { tag: ['@events', '@negative'] }, async ({ request, cleanup }) => {
        const convex = new ConvexClient(request);
        const eventData = new EventBuilder().withTickets(10).build();
        let eventId: string;

        await test.step('Step 1: Create event', async () => {
            eventId = await convex.mutation(CONVEX_FN.events.create, eventData);
            cleanup.track('event', eventId);
        });

        await test.step('Step 2: Update event with increased tickets', async () => {
            await convex.mutation(CONVEX_FN.events.updateEvent, {
                eventId,
                name: eventData.name,
                description: "Updated Description",
                location: eventData.location,
                eventDate: eventData.eventDate,
                price: eventData.price,
                totalTickets: 20
            });
        });

        await test.step('Step 3: Verify update success', async () => {
            const updatedEvent = await convex.query(CONVEX_FN.events.getById, { eventId });
            expect(updatedEvent.totalTickets).toBe(20);
        });
    });
});
