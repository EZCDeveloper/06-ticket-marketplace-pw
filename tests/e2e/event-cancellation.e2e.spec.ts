import { test, expect } from '@/fixtures/base.fixtures';
import { EventBuilder } from '@/support/builders/EventBuilder';
import { ConvexClient } from '@/support/api/ConvexClient';
import { ClerkAdminClient } from '@/support/api/ClerkAdminClient';
import { TEST_EVENT_OWNER_USER_ID } from '@/support/config/testUsers';
import { CONVEX_FN } from '@config/convex-functions';

/**
 * Flow 4 | E2E Tests — Event Cancellation
 *
 * Validates the cancellation journey through the UI:
 * Event Owner → View My Events → Select Event → Cancel Event →
 * System Processes Refunds → Notify All Ticket Holders → Update Event Status
 *
 * @see ABOUT_APPLICATION.md — Flow 4: Event Cancellation Flow
 */
test.describe('Flow 4 | E2E: Event Cancellation', () => {

    test('[F4-E2E-1] Cancel Event from Seller Dashboard', { tag: ['@events', '@flow-4'] }, async ({ seller, cleanup, request }) => {
        const convex = new ConvexClient(request);
        const eventData = new EventBuilder().build();
        let eventId: string;

        await test.step('Step 1: Create event via API (as the authenticated seller)', async () => {
            eventId = await convex.mutation(CONVEX_FN.events.create, {
                ...eventData,
                userId: TEST_EVENT_OWNER_USER_ID,
            });
            cleanup.track('event', eventId);
        });

        await test.step('Step 2: Navigate to the event page as the owner', async () => {
            await seller.navigateToEvent(eventId);
        });

        await test.step('Step 3: Cancel the event via the UI', async () => {
            // CancelEventButton uses window.confirm() — handled by Seller.cancelCurrentEvent()
            await seller.cancelCurrentEvent();
        });

        await test.step('Step 4: Verify the "Event Cancelled & Refunded" badge in My Events list', async () => {
            await seller.verifyEventCancelledInList(eventId);
        });
    });

    test('[F4-E2E-2] Ticket Holder Sees Refund Notice After Cancellation', { tag: ['@events', '@flow-4'] }, async ({ buyer, cleanup, request }) => {
        const convex = new ConvexClient(request);
        const clerkAdmin = new ClerkAdminClient(request);
        const eventData = new EventBuilder().withTickets(1).build();
        let tempClerkUserId: string | undefined;
        let tempUserEmail: string;
        let tempUserPassword: string;
        let eventId: string;

        try {
            await test.step('Step 1: Create event with 1 ticket via API', async () => {
                eventId = await convex.mutation(CONVEX_FN.events.create, {
                    ...eventData,
                    userId: TEST_EVENT_OWNER_USER_ID,
                });
                cleanup.track('event', eventId);
            });

            await test.step('Step 2: Create temp Clerk user and purchase a ticket via API', async () => {
                const tempUser = await clerkAdmin.createTempUser();
                tempClerkUserId = tempUser.userId;
                tempUserEmail = tempUser.email;
                tempUserPassword = tempUser.password;

                // Join waiting list — with 1 ticket available, user immediately gets "offered" status
                await convex.mutation(CONVEX_FN.events.joinWaitingList, {
                    eventId,
                    userId: tempClerkUserId,
                });

                // Retrieve the waiting list entry to get the ID needed for purchase
                const entries = await convex.query(CONVEX_FN.events.getUserWaitingList, {
                    userId: tempClerkUserId,
                });
                const entry = entries.find((e: { eventId: string; _id: string }) => e.eventId === eventId);

                // Complete the purchase via API (no Stripe flow needed in tests)
                await convex.mutation(CONVEX_FN.events.purchaseTicket, {
                    eventId,
                    userId: tempClerkUserId,
                    waitingListId: entry._id,
                    paymentInfo: {
                        paymentIntentId: `pi_test_${Date.now()}`,
                        amount: eventData.price,
                    },
                });
            });

            await test.step('Step 3: Cancel the event via API (seller action)', async () => {
                await convex.mutation(CONVEX_FN.events.cancelEvent, { eventId });
            });

            await test.step('Step 4: Log in as the ticket holder', async () => {
                await buyer.loginWithClerkCredentials(tempUserEmail, tempUserPassword, 'ticket holder');
            });

            await test.step('Step 5: Navigate to My Tickets', async () => {
                await buyer.navigateToMyTickets();
                await expect(buyer.page.getByTestId('total-tickets-count')).toBeVisible({ timeout: 10000 });
            });

            await test.step('Step 6: Open the cancelled ticket detail', async () => {
                // The first (and only) ticket in the list belongs to the cancelled event
                await buyer.page.locator('[data-testid^="ticket-card-"]').first().click();
                await buyer.page.waitForURL(/\/tickets\/[a-z0-9]+/, { timeout: 15000 });
            });

            await test.step('Step 7: Verify the cancellation notice and refund status', async () => {
                await buyer.verifyTicketCancelled();
            });

        } finally {
            if (tempClerkUserId) {
                await clerkAdmin.deleteUser(tempClerkUserId);
            }
        }
    });
});
