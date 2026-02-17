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

        await test.step('Step 4: Verify checkout transition state only (no Stripe flow assertion)', async () => {
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

    test('[E2E-2.1.3] Rate Limit Warning on Excessive Queue Attempts', async ({ buyer, convex, cleanup }) => {
        let rateLimitSeen = false;

        await test.step('Step 1: Attempt joins across events until rate limit appears', async () => {
            for (let i = 0; i < 4; i++) {
                const eventData = new EventBuilder().withTickets(1).build();
                const eventId = await convex.mutation('events:create', {
                    ...eventData,
                    userId: "user_2tW6lJ6R1P6U6V6W6X6Y6Z6A6B"
                });
                cleanup.track('event', eventId);

                await buyer.navigateToEvent(eventId);
                await buyer.page.getByTestId('buy-ticket-button').click({ force: true });

                const toast = buyer.page.getByText(/Slow down there|joined the waiting list too many times|Please wait .*minutes/i).first();
                if (await toast.isVisible({ timeout: 2500 }).catch(() => false)) {
                    rateLimitSeen = true;
                    break;
                }
            }
        });

        await test.step('Step 2: Validate rate-limit feedback is shown', async () => {
            expect(rateLimitSeen).toBe(true);
        });
    });

    test.skip('[E2E-2.1.4] Two Buyers Compete for Last Ticket (PENDING)', async () => {
        /**
         * PENDING: Multi-user visual concurrency scenario.
         *
         * Proposed implementation (same spec, no new file):
         * 1) Create event with exactly 1 ticket.
         * 2) Open two isolated browser contexts (Buyer Persona 1 / Buyer Persona 2).
         * 3) Authenticate each buyer with different credentials.
         * 4) Both navigate to same event and join queue.
         * 5) Buyer 1 completes purchase.
         * 6) Validate Buyer 2 cannot purchase and sees waiting/sold-out state.
         *
         * Notes:
         * - Requires dedicated env vars for two accounts.
         * - Prefer deterministic synchronization to reduce flakiness.
         */
    });
});
