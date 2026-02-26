import { test, expect } from '@/fixtures/base.fixtures';
import { EventBuilder } from '@/support/builders/EventBuilder';
import { ConvexClient } from '@/support/api/ConvexClient';
import { CONVEX_FN } from '@config/convex-functions';

test.describe('E2E - 3: Seller Flow', () => {

    test('[E2E - 3.1] Create New Event via Dashboard', { tag: ['@events', '@critical'] }, async ({ seller, cleanup, request }) => {
        const convex = new ConvexClient(request);
        const eventData = new EventBuilder().build();

        await test.step('Step 1: Navigate to Seller Dashboard', async () => {
            await seller.navigateToDashboard();
        });

        await test.step('Step 2: Create event via dashboard', async () => {
            await seller.createEvent({
                ...eventData,
                eventDate: new Date(eventData.eventDate)
            });
        });

        await test.step('Step 3: Verify event creation and track for cleanup', async () => {
            await seller.verifyEventVisible(eventData.name);

            // Capture ID for cleanup
            const events = await convex.query(CONVEX_FN.events.get, {});
            const createdEvent = events.find((e: any) => e.name === eventData.name);
            if (createdEvent) {
                cleanup.track('event', createdEvent._id);
            }
        });
    });
});
