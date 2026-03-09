import { test, expect } from '@/fixtures/base.fixtures';
import { EventBuilder } from '@/support/builders/EventBuilder';
import { ClerkAdminClient } from '@/support/api/ClerkAdminClient';
import { TEST_EVENT_OWNER_USER_ID } from '@/support/config/testUsers';
import { CONVEX_FN } from '@config/convex-functions';

/**
 * FLOW 2 | E2E - 2: Event Discovery & Purchase
 *
 * Validates the complete buyer journey through the UI:
 * Guest/User → Browse Events → View Event Details → Sign In →
 * Join Queue → Receive Offer → Complete Payment → Receive Ticket → QR Code
 *
 * Event is created via API to isolate this flow from Seller UI flakiness.
 *
 * @see ABOUT_APPLICATION.md — E2E - 2: Event Discovery & Purchase
 */
test.describe('E2E - 2: Event Discovery & Purchase', () => {

    test('[E2E - 2.1] Join Queue and Receive Offer', { tag: ['@queue', '@critical', '@flow-1'] }, async ({ buyer, convex, cleanup, request }) => {
        const eventData = new EventBuilder().build();
        const clerkAdmin = new ClerkAdminClient(request);
        let tempClerkUserId: string | undefined;
        let eventId: string;

        try {
            await test.step('Step 1: Create an event via API', async () => {
                eventId = await convex.mutation(CONVEX_FN.events.create, {
                    name: eventData.name,
                    description: eventData.description,
                    location: eventData.location,
                    eventDate: eventData.eventDate,
                    price: eventData.price,
                    totalTickets: 1,
                    userId: TEST_EVENT_OWNER_USER_ID,
                });
                cleanup.track('event', eventId);
            });

            await test.step('Step 2: Create temporary Clerk user and log in', async () => {
                const tempUser = await clerkAdmin.createTempUser();
                tempClerkUserId = tempUser.userId;
                await buyer.loginWithClerkCredentials(tempUser.email, tempUser.password, 'temporary Clerk test user');
                await buyer.navigateToEvent(eventId);
                await expect(buyer.page.getByTestId('event-detail-title')).toContainText(eventData.name);
            });

            await test.step('Step 3: Join the queue (success path)', async () => {
                await buyer.joinQueueExpectSuccess();
            });

            await test.step('Step 4: Verify checkout transition state (no Stripe flow assertion)', async () => {
                await buyer.verifyOfferReceived();

                const purchaseButton = buyer.page.getByTestId('purchase-ticket-button');
                await expect(purchaseButton).toBeEnabled();
                await purchaseButton.click({ force: true });
                await expect.soft(purchaseButton).toContainText(/Redirecting to checkout/i);

                // Avoid cross-test flakiness: ensure Stripe navigation does not remain in-flight.
                await Promise.race([
                    buyer.page.waitForURL(/checkout\.stripe\.com/i, { timeout: 5000 }).catch(() => null),
                    buyer.page.waitForTimeout(500),
                ]);

                if (/checkout\.stripe\.com/i.test(buyer.page.url())) {
                    await buyer.page.goto('/', { waitUntil: 'domcontentloaded' });
                }
            });
        } finally {
            if (tempClerkUserId) {
                await clerkAdmin.deleteUser(tempClerkUserId);
            }
        }
    });
});
