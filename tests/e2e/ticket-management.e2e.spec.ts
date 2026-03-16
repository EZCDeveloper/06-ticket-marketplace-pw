import { test, expect } from '@/fixtures/base.fixtures';
import { EventBuilder } from '@/support/builders/EventBuilder';
import { ConvexClient } from '@/support/api/ConvexClient';
import { ClerkAdminClient } from '@/support/api/ClerkAdminClient';
import { TEST_EVENT_OWNER_USER_ID } from '@/support/config/testUsers';
import { CONVEX_FN } from '@config/convex-functions';

/**
 * FLOW 6 | E2E - 6: Ticket Management
 *
 * Validates the ticket management journey through the UI:
 * User → My Tickets → View Ticket Details → Access QR Code →
 * Check Event Status → View Purchase History
 *
 * @see ABOUT_APPLICATION.md — E2E - 6: Ticket Management
 */
test.describe('E2E - 6: Ticket Management', () => {

    /**
     * Purchases a ticket for a given user via the Convex API (no Stripe flow).
     * Returns the waiting list entry used, so the caller can track state if needed.
     */
    async function purchaseTicketViaApi(
        convex: ConvexClient,
        eventId: string,
        userId: string,
        price: number
    ): Promise<void> {
        await convex.mutation(CONVEX_FN.events.joinWaitingList, { eventId, userId });

        const entries = await convex.query(CONVEX_FN.events.getUserWaitingList, { userId });
        const entry = entries.find((e: { eventId: string; _id: string }) => e.eventId === eventId);

        await convex.mutation(CONVEX_FN.events.purchaseTicket, {
            eventId,
            userId,
            waitingListId: entry._id,
            paymentInfo: {
                paymentIntentId: `pi_test_${Date.now()}`,
                amount: price,
            },
        });
    }

    test('[E2E - 6.1] View Purchased Ticket and QR Code', { tag: ['@tickets', '@flow-6'] }, async ({ buyer, cleanup, request }) => {
        const convex = new ConvexClient(request);
        const clerkAdmin = new ClerkAdminClient(request);
        const eventData = new EventBuilder().withTickets(1).build();
        let tempClerkUserId: string | undefined;
        let eventId: string;

        try {
            await test.step('Step 1: Create event with 1 ticket via API', async () => {
                eventId = await convex.mutation(CONVEX_FN.events.create, {
                    ...eventData,
                    userId: TEST_EVENT_OWNER_USER_ID,
                });
                cleanup.track('event', eventId);
            });

            await test.step('Step 2: Create temp user and purchase ticket via API', async () => {
                const tempUser = await clerkAdmin.createTempUser();
                tempClerkUserId = tempUser.userId;

                await purchaseTicketViaApi(convex, eventId, tempClerkUserId, eventData.price);

                // Log in as the ticket holder, clearing the pre-configured storageState
                await buyer.loginWithClerkCredentials(tempUser.email, tempUser.password, 'ticket holder');
            });

            await test.step('Step 3: Navigate to My Tickets', async () => {
                await buyer.navigateToMyTickets();
                await buyer.verifyTicketsCount(1);
            });

            await test.step('Step 4: Open the ticket detail page', async () => {
                // The first (and only) card navigates to /tickets/${ticketId}
                await buyer.page.locator('[data-testid^="ticket-card-"]').first().click();
                await buyer.page.waitForURL(/\/tickets\/[a-z0-9]+/, { timeout: 15000 });
            });

            await test.step('Step 5: Verify ticket details and QR code', async () => {
                await buyer.verifyQrCodeVisible();
                await expect(buyer.page.getByTestId('ticket-event-name')).toContainText(eventData.name);
                await expect(buyer.page.getByTestId('ticket-status')).toContainText('Valid Ticket');
            });

        } finally {
            if (tempClerkUserId) {
                await clerkAdmin.deleteUser(tempClerkUserId);
            }
        }
    });

    test('[E2E - 6.2] View Purchase History', { tag: ['@tickets', '@flow-6'] }, async ({ buyer, cleanup, request }) => {
        const convex = new ConvexClient(request);
        const clerkAdmin = new ClerkAdminClient(request);
        const eventA = new EventBuilder().withTickets(1).build();
        const eventB = new EventBuilder().withTickets(1).build();
        let tempClerkUserId: string | undefined;
        let eventIdA: string;
        let eventIdB: string;

        try {
            await test.step('Step 1: Create two events via API', async () => {
                eventIdA = await convex.mutation(CONVEX_FN.events.create, {
                    ...eventA,
                    userId: TEST_EVENT_OWNER_USER_ID,
                });
                cleanup.track('event', eventIdA);

                eventIdB = await convex.mutation(CONVEX_FN.events.create, {
                    ...eventB,
                    userId: TEST_EVENT_OWNER_USER_ID,
                });
                cleanup.track('event', eventIdB);
            });

            await test.step('Step 2: Create temp user and purchase a ticket for each event', async () => {
                const tempUser = await clerkAdmin.createTempUser();
                tempClerkUserId = tempUser.userId;

                // Purchase sequentially to avoid race conditions on the 1-ticket events
                await purchaseTicketViaApi(convex, eventIdA, tempClerkUserId, eventA.price);
                await purchaseTicketViaApi(convex, eventIdB, tempClerkUserId, eventB.price);

                await buyer.loginWithClerkCredentials(tempUser.email, tempUser.password, 'ticket holder');
            });

            await test.step('Step 3: Navigate to My Tickets and verify the count', async () => {
                await buyer.navigateToMyTickets();
                await buyer.verifyTicketsCount(2);
            });

            await test.step('Step 4: Verify both purchases appear in the list', async () => {
                // Both event names should be visible in the upcoming-tickets section
                await expect(
                    buyer.page.getByTestId('ticket-event-name').filter({ hasText: eventA.name })
                ).toBeVisible({ timeout: 10000 });

                await expect(
                    buyer.page.getByTestId('ticket-event-name').filter({ hasText: eventB.name })
                ).toBeVisible({ timeout: 10000 });
            });

            await test.step('Step 5: Verify each ticket card shows the correct status', async () => {
                const allStatusBadges = buyer.page.getByTestId('ticket-status');
                // Both tickets should be valid (not cancelled, not expired)
                const count = await allStatusBadges.count();
                for (let i = 0; i < count; i++) {
                    await expect(allStatusBadges.nth(i)).not.toContainText('Cancelled');
                }
            });

        } finally {
            if (tempClerkUserId) {
                await clerkAdmin.deleteUser(tempClerkUserId);
            }
        }
    });
});
