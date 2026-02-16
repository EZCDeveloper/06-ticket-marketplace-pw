import { test, expect } from '@/fixtures/base.fixtures';
import { EventBuilder } from '@/support/builders/EventBuilder';
import { ConvexClient } from '@/support/api/ConvexClient';

/**
 * [API-2] Event Management API Tests
 */
test.describe('API: Event Management', () => {

    test('[API-2.1.1] Create New Event (Happy Path)', async ({ request, cleanup }) => {
        const convex = new ConvexClient(request);
        const eventData = new EventBuilder().build();
        let eventId: string;

        await test.step('Step 1: Create event via mutation', async () => {
            eventId = await convex.mutation('events:create', eventData);
            expect(eventId).toBeDefined();
            cleanup.track('event', eventId);
        });

        await test.step('Step 2: Verify event exists and data matches', async () => {
            const event = await convex.query('events:getById', { eventId });
            expect(event.name).toBe(eventData.name);
            expect(event.price).toBe(eventData.price);
        });
    });

    test('[API-2.1.2] Cancel Event', async ({ request, cleanup }) => {
        const convex = new ConvexClient(request);
        const eventData = new EventBuilder().build();
        let eventId: string;

        await test.step('Step 1: Create an event', async () => {
            eventId = await convex.mutation('events:create', eventData);
            cleanup.track('event', eventId);
        });

        await test.step('Step 2: Cancel the event', async () => {
            const result = await convex.mutation('events:cancelEvent', { eventId });
            expect(result.success).toBe(true);
        });

        await test.step('Step 3: Verify event status is cancelled', async () => {
            const event = await convex.query('events:getById', { eventId });
            expect(event.is_cancelled).toBe(true);
        });
    });

    test('[API-2.1.3] Prevent Reducing Tickets Below Sold Count', async ({ request, cleanup }) => {
        const convex = new ConvexClient(request);
        const eventData = new EventBuilder().withTickets(10).build();
        let eventId: string;

        await test.step('Step 1: Create event', async () => {
            eventId = await convex.mutation('events:create', eventData);
            cleanup.track('event', eventId);
        });

        await test.step('Step 2: Update event with increased tickets', async () => {
            await convex.mutation('events:updateEvent', {
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
            const updatedEvent = await convex.query('events:getById', { eventId });
            expect(updatedEvent.totalTickets).toBe(20);
        });
    });
});
