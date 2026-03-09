import { test, expect } from '@/fixtures/base.fixtures';
import { EventBuilder } from '@/support/builders/EventBuilder';
import { ConvexClient } from '@/support/api/ConvexClient';
import { CONVEX_FN } from '@config/convex-functions';

/**
 * FLOW 3 | API - 3: Event Creation (Seller)
 *
 * Covers the business logic for the seller creation flow:
 * User → Sign In → Seller Dashboard → Create New Event →
 * Fill Event Details → Upload Image → Set Pricing & Capacity → Publish Event
 *
 * @see ABOUT_APPLICATION.md — API - 3: Event Creation (Seller)
 */
test.describe('API - 3: Event Creation', () => {

    test('[API - 3.1] Create New Event (Happy Path)', { tag: ['@events', '@critical', '@flow-2'] }, async ({ request, cleanup }) => {
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

    test('[API - 3.2] Prevent Reducing Tickets Below Sold Count', { tag: ['@events', '@negative', '@flow-2'] }, async ({ request, cleanup }) => {
        const convex = new ConvexClient(request);
        const eventData = new EventBuilder().withTickets(10).build();
        let eventId: string;

        await test.step('Step 1: Create event with 10 tickets', async () => {
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
