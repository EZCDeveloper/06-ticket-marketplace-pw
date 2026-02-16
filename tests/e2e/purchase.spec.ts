import { test, expect } from '@/fixtures/base.fixtures';
import { EventBuilder } from '@/support/builders/EventBuilder';
import { ConvexClient } from '@/support/api/ConvexClient';

test.describe('E2E: Purchase Flow', () => {

    test('[E2E-2.1.1] Join Queue and Receive Offer', async ({ buyer, convex, cleanup }) => {
        const eventData = new EventBuilder().build();

        let eventId: string;

        await test.step('Step 1: Create an event via API', async () => {
            // Create event via API to isolate Buyer test from Seller UI flakiness
            eventId = await convex.mutation('events:create', {
                name: eventData.name,
                description: eventData.description,
                location: eventData.location,
                eventDate: eventData.eventDate,
                price: eventData.price,
                totalTickets: 1, // Only 1 ticket for this test
                userId: "user_2tW6lJ6R1P6U6V6W6X6Y6Z6A6B" // Use a valid mock user ID or handle auth dynamically if needed
            });
            cleanup.track('event', eventId);
        });

        await test.step('Step 2: Navigate to Event Page', async () => {
            await buyer.navigateToEvent(eventId);
            await expect(buyer.page.getByTestId('event-detail-title')).toContainText(eventData.name);
        });

        await test.step('Step 3: Join the queue', async () => {
            await buyer.joinQueue();
        });

        await test.step('Step 4: Wait for offer and purchase', async () => {
            await buyer.verifyOfferReceived();
            await buyer.purchaseTicket();
        });
    });

    test('[E2E-2.1.2] Sold Out View', async ({ buyer, request, cleanup }) => {
        const convex = new ConvexClient(request);
        const eventData = new EventBuilder().withTickets(0).build();
        let eventId: string;

        await test.step('Step 1: Create a sold out event', async () => {
            eventId = await convex.mutation('events:create', eventData);
            cleanup.track('event', eventId);
        });

        await test.step('Step 2: Navigate to Event Page', async () => {
            await buyer.navigateToEvent(eventId);
        });

        await test.step('Step 3: Verify Sold Out status', async () => {
            await buyer.verifySoldOut();
        });
    });
});
