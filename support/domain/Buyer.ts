import { Page, expect } from '@playwright/test';
import { ConvexClient } from '../api/ConvexClient';
import { WaitManager } from '../utils/WaitManager';

export class Buyer {
    private readonly wait: WaitManager;

    constructor(
        public readonly page: Page,
        private readonly convex: ConvexClient
    ) {
        this.wait = new WaitManager(page);
    }

    async navigateToEvent(eventId: string) {
        await this.page.goto(`/event/${eventId}`);
        // Explicitly wait for any loading state to finish before looking for the title
        await this.wait.waitForLoadingFinished();
        await expect(this.page.getByTestId('event-detail-title')).toBeVisible({ timeout: 20000 });
    }

    async joinQueue() {
        // Wait for loading to finish so button is attached
        await this.wait.waitForLoadingFinished();
        const joinButton = (this.page.getByTestId('buy-ticket-button').or(this.page.getByTestId('join-queue-button'))).first();
        await expect(joinButton).toBeVisible({ timeout: 15000 });
        await joinButton.click({ force: true });

        const queueState = this.page
            .getByText(/You are in the queue|Ticket Offered|Active Offer|Ticket Reserved|Waiting for your turn|Your position/i)
            .first();
        const rateLimitToast = this.page
            .getByText(/Slow down there|joined the waiting list too many times|Please wait .*minutes/i)
            .first();

        // Wait until either success state or rate-limit toast is visible.
        await Promise.race([
            queueState.waitFor({ state: 'visible', timeout: 20000 }),
            rateLimitToast.waitFor({ state: 'visible', timeout: 20000 }),
        ]);

        if (await rateLimitToast.isVisible()) {
            throw new Error('Join queue blocked by rate limiter (Slow down there). Use a fresh test user.');
        }
    }

    async verifyOfferReceived() {
        await expect(this.page.getByText(/Ticket Offered/i)
            .or(this.page.getByText(/Active Offer/i))
            .or(this.page.getByText(/Ticket Reserved/i))
            .or(this.page.getByText(/Purchase Your Ticket Now/i)).first())
            .toBeVisible({ timeout: 20000 });
    }

    async purchaseTicket() {
        const purchaseButton = this.page.getByRole('button', { name: /Buy Ticket/i })
            .or(this.page.getByRole('button', { name: /Purchase/i }))
            .or(this.page.getByTestId('buy-ticket-button'))
            .first();

        await expect(purchaseButton).toBeEnabled();
        await purchaseButton.click({ force: true });

        // Stripe redirection
        await expect(this.page.url()).toContain('checkout.stripe.com');
    }

    async verifySoldOut() {
        await expect(this.page.getByTestId('sold-out-message').or(this.page.getByText(/Sold Out/i)).first()).toBeVisible();
    }
}
