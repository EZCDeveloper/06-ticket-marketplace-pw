import { test, expect } from '@/fixtures/base.fixtures';
import { EventBuilder } from '@/support/builders/EventBuilder';
import { ConvexClient } from '@/support/api/ConvexClient';
import { ClerkAdminClient } from '@/support/api/ClerkAdminClient';
import { TEST_EVENT_OWNER_USER_ID } from '@/support/config/testUsers';
import { CONVEX_FN } from '@config/convex-functions';

test.describe('E2E - 3: Queue (buyer flow)', () => {

    test('[E2E - 3.1] Join Queue and Receive Offer', { tag: ['@queue', '@critical'] }, async ({ buyer, convex, cleanup, request }) => {
        const eventData = new EventBuilder().build();
        const clerkAdmin = new ClerkAdminClient(request);
        let tempClerkUserId: string | undefined;

        let eventId: string;
        try {
            await test.step('Step 1: Create an event via API', async () => {
                // Create event via API to isolate Buyer test from Seller UI flakiness
                eventId = await convex.mutation(CONVEX_FN.events.create, {
                    name: eventData.name,
                    description: eventData.description,
                    location: eventData.location,
                    eventDate: eventData.eventDate,
                    price: eventData.price,
                    totalTickets: 1, // Only 1 ticket for this test
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
        } finally {
            if (tempClerkUserId) {
                await clerkAdmin.deleteUser(tempClerkUserId);
            }
        }
    });

    test('[E2E - 3.2] Sold Out View', { tag: ['@queue'] }, async ({ buyer, request, cleanup }) => {
        const convex = new ConvexClient(request);
        const eventData = new EventBuilder().withTickets(0).build();
        let eventId: string;

        await test.step('Step 1: Create a sold out event', async () => {
            eventId = await convex.mutation(CONVEX_FN.events.create, eventData);
            cleanup.track('event', eventId);
        });

        await test.step('Step 2: Navigate to Event Page', async () => {
            await buyer.navigateToEvent(eventId);
        });

        await test.step('Step 3: Verify Sold Out status', async () => {
            await buyer.verifySoldOut();
        });
    });

    test('[E2E - 3.3] Rate Limit Warning on Excessive Queue Attempts', { tag: ['@queue', '@negative'] }, async ({ buyer, convex, cleanup }) => {
        let rateLimitSeen = false;

        await test.step('Step 1: Attempt joins across events until rate limit appears', async () => {
            for (let i = 0; i < 4; i++) {
                const eventData = new EventBuilder().withTickets(1).build();
                const eventId = await convex.mutation(CONVEX_FN.events.create, {
                    ...eventData,
                    userId: TEST_EVENT_OWNER_USER_ID,
                });
                cleanup.track('event', eventId);

                await buyer.navigateToEvent(eventId);
                await buyer.joinQueueExpectRateLimit(2500).then(() => {
                    rateLimitSeen = true;
                }).catch(() => {
                    // Rate limit not hit yet for this iteration.
                });

                if (rateLimitSeen) break;
            }
        });

        await test.step('Step 2: Validate rate-limit feedback is shown', async () => {
            expect(rateLimitSeen).toBe(true);
        });
    });

    test.skip('[E2E - 3.4] Two Buyers Compete for Last Ticket (PENDING)', { tag: ['@queue', '@slow'] }, async () => {
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
