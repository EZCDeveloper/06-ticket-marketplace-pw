import { test } from '@/fixtures/base.fixtures';
import { EventBuilder } from '@/support/builders/EventBuilder';

/**
 * FLOW 5 | E2E - 5: Event Cancellation
 *
 * Validates the cancellation journey through the UI:
 * Event Owner → View My Events → Select Event → Cancel Event →
 * System Processes Refunds → Notify All Ticket Holders → Update Event Status
 *
 * @see ABOUT_APPLICATION.md — E2E - 5: Event Cancellation
 */
test.describe('E2E - 5: Event Cancellation', () => {

    test('[E2E - 5.1] Cancel Event from Seller Dashboard', { tag: ['@events', '@flow-5'] }, async ({ seller, cleanup }) => {
        const eventData = new EventBuilder().build();
        let eventId: string;

        await test.step('Step 1: Create event via seller UI (ensures ownership by the authenticated user)', async () => {
            await seller.navigateToDashboard();
            eventId = await seller.createEvent({ ...eventData, eventDate: new Date(eventData.eventDate) });
            cleanup.track('event', eventId);
        });

        await test.step('Step 2: Cancel the event from the seller events list', async () => {
            // CancelEventButton only exists in SellerEventList (/seller/events), not on the public event page.
            await seller.cancelEventFromList(eventId);
        });

        await test.step('Step 3: Verify the "Event Cancelled & Refunded" badge', async () => {
            await seller.verifyEventCancelledInList(eventId);
        });
    });

    test.skip('[E2E - 5.2] Ticket Holder Sees Refund Notice After Cancellation', { tag: ['@events', '@flow-5'] }, async () => {
        /**
         * BLOCKED — requires Stripe test mode integration.
         *
         * Root cause: the Convex `cancelEvent` mutation (convex/events.ts:479) throws
         * "Cannot cancel event with active tickets. Please refund all tickets first."
         * when any ticket with status "valid" or "used" exists for the event.
         *
         * In this test environment, tickets are purchased via API with a fake
         * paymentIntentId (pi_test_...). When the seller tries to cancel, Convex
         * correctly rejects the operation because valid tickets exist — the intended
         * refund flow requires a real Stripe PaymentIntent to process the refund first.
         *
         * To implement this test:
         * 1. Configure STRIPE_SECRET_KEY in .env.local (test mode key).
         * 2. Use the Stripe test API to create a real PaymentIntent before purchasing.
         * 3. After purchasing with the real PI, cancel the event — Stripe will process
         *    the refund and Convex will mark the event as is_cancelled = true.
         * 4. The ticket holder navigates to /tickets and verifies:
         *    - event-cancelled-message badge in TicketCard
         *    - ticket-status = "Cancelled"
         */
    });
});
