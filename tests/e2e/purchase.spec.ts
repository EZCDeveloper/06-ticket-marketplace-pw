import { test, expect } from '@/fixtures/base.fixtures';
import { EventBuilder } from '@/support/builders/EventBuilder';
import { ConvexClient } from '@/support/api/ConvexClient';
import { AuthClient } from '@/support/api/AuthClient';

/**
 * E2E Tests - Purchase Flow
 * 
 * Verifies the complete buyer journey:
 * 1. Join Queue
 * 2. Receive Offer
 * 3. Proceed to Purchase
 */
test.describe('E2E: Purchase Flow', () => {

    test('[E2E-2.1.1] Join Queue and Receive Offer', async ({ page, request, cleanup }) => {
        const convex = new ConvexClient(request);
        const auth = new AuthClient(request);

        // ✅ ARRANGE: Create an event with 1 ticket
        const eventData = new EventBuilder().withTickets(1).build();
        const eventId = await convex.mutation('events:create', eventData);
        cleanup.track('event', eventId);

        // ✅ ACT: Navigate to Event Page
        await page.goto(`/event/${eventId}`);

        // Assert event details
        await expect(page.getByTestId('event-detail-title')).toContainText(eventData.name);

        // Since we are not logged in, we should see 'Sign In to Buy'
        const buyButton = page.getByTestId('sign-in-to-buy-button');
        await expect(buyButton).toBeVisible();
        await buyButton.click();

        // Login (using demo credentials for simplicity in this environment)
        await page.getByPlaceholder('Enter your email address').fill('waltertestcustomer@gmail.com');
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await page.getByPlaceholder('Enter your password').fill('123***man');
        await page.getByRole('button', { name: 'Continue', exact: true }).click();

        // After login, we should be back on the event page and able to join the queue
        const joinQueueButton = page.getByTestId('buy-ticket-button');
        await expect(joinQueueButton).toBeVisible({ timeout: 15000 });
        await joinQueueButton.click();

        // ✅ ASSERT: Status transitions to 'Offered' or similar (active offer message appears)
        // We can check for the presence of the purchase/pay button or the specific message
        await expect(page.getByText(/active offer/i).or(page.getByRole('button', { name: /Purchase/i }))).toBeVisible({ timeout: 15000 });
    });

    test('[E2E-2.1.2] Sold Out View', async ({ page, request }) => {
        const convex = new ConvexClient(request);

        // ✅ ARRANGE: Create a sold out event
        const eventData = new EventBuilder().withTickets(0).build();
        const eventId = await convex.mutation('events:create', eventData);

        // ✅ ACT: Navigate to Event Page
        await page.goto(`/event/${eventId}`);

        // ✅ ASSERT: Verify sold out indicator
        // Wait for title to ensure page loaded
        await expect(page.getByTestId('event-detail-title')).toBeVisible();

        // Use sold-out-badge which is visible to anonymous users in the EventCard
        const soldOut = page.getByTestId('sold-out-badge').first()
        await expect(soldOut).toHaveText('Sold Out')

        await expect(page.getByTestId('event-availability').first()).toContainText('0 / 0 available');

    });
});
