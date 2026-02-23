import { Page, expect } from '@playwright/test';

/**
 * QueueWidget — Ticket queue component on the event detail page.
 *
 * Encapsulates the join-queue button and all queue status states:
 * offered, waiting, sold-out, and rate-limited.
 *
 * The app uses two different test IDs for the join button depending on
 * whether tickets are available (`buy-ticket-button`) or the event is in
 * queue mode (`join-queue-button`). Both are handled transparently here.
 */
export class QueueWidget {
    constructor(private readonly page: Page) {}

    // ─── Locators ─────────────────────────────────────────────────────────────

    private get joinButton() {
        return this.page
            .getByTestId('buy-ticket-button')
            .or(this.page.getByTestId('join-queue-button'))
            .first();
    }

    private get queueActiveState() {
        return this.page
            .getByText(/You are in the queue|Ticket Offered|Active Offer|Ticket Reserved|Waiting for your turn|Your position/i)
            .first();
    }

    private get rateLimitToast() {
        return this.page
            .getByText(/Slow down there|joined the waiting list too many times|Please wait .*minutes/i)
            .first();
    }

    private get offerState() {
        return this.page.getByText(/Ticket Offered/i)
            .or(this.page.getByText(/Active Offer/i))
            .or(this.page.getByText(/Ticket Reserved/i))
            .or(this.page.getByText(/Purchase Your Ticket Now/i))
            .first();
    }

    private get soldOutState() {
        return this.page
            .getByTestId('sold-out-message')
            .or(this.page.getByText(/Sold Out/i))
            .first();
    }

    // ─── Actions ──────────────────────────────────────────────────────────────

    /** Clicks the join/buy-ticket button. Waits for it to be visible first. */
    async clickJoin(): Promise<void> {
        await expect(this.joinButton).toBeVisible({ timeout: 15000 });
        await this.joinButton.click({ force: true });
    }

    // ─── Assertions ───────────────────────────────────────────────────────────

    /**
     * Waits for either a successful queue state or a rate-limit toast.
     * Throws if the rate limiter fires so callers can react (e.g. skip or fail).
     */
    async expectQueuedOrRateLimit(): Promise<void> {
        await Promise.race([
            this.queueActiveState.waitFor({ state: 'visible', timeout: 20000 }),
            this.rateLimitToast.waitFor({ state: 'visible', timeout: 20000 }),
        ]);

        if (await this.rateLimitToast.isVisible()) {
            throw new Error('QueueWidget: join blocked by rate limiter. Use a fresh test user.');
        }
    }

    /**
     * Asserts that the rate-limit toast appears within the given timeout.
     * Use in tests that intentionally trigger the rate limiter.
     */
    async expectRateLimit(timeoutMs = 10000): Promise<void> {
        await expect(this.rateLimitToast).toBeVisible({ timeout: timeoutMs });
    }

    /** Asserts that the ticket offer state is visible (offered / active / reserved). */
    async expectOfferVisible(): Promise<void> {
        await expect(this.offerState).toBeVisible({ timeout: 20000 });
    }

    /** Asserts that the sold-out state is visible. */
    async expectSoldOut(): Promise<void> {
        await expect(this.soldOutState).toBeVisible();
    }
}
