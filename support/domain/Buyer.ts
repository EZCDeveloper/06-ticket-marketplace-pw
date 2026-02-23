import { Page } from '@playwright/test';
import { ConvexClient } from '../api/ConvexClient';
import { WaitManager } from '../utils/WaitManager';
import { ClerkLoginForm } from '../components/ClerkLoginForm';
import { QueueWidget } from '../components/QueueWidget';

/**
 * Buyer — Domain actor for the ticket buyer journey.
 *
 * Describes WHAT a buyer does (log in, navigate to event, join queue, purchase).
 * Delegates HOW the UI is interacted with to Component Objects
 * (ClerkLoginForm, QueueWidget).
 */
export class Buyer {
    private readonly wait: WaitManager;

    constructor(
        public readonly page: Page,
        private readonly convex: ConvexClient
    ) {
        this.wait = new WaitManager(page);
    }

    async navigateToEvent(eventId: string): Promise<void> {
        await this.page.goto(`/event/${eventId}`);
        await this.wait.waitForLoadingFinished();
        await this.page.getByTestId('event-detail-title').waitFor({ state: 'visible', timeout: 20000 });
    }

    /**
     * Logs in with Clerk credentials, clearing any existing session first.
     * Use this when the test needs a specific user (e.g. a temporary Clerk user
     * created via ClerkAdminClient) rather than the pre-authenticated storageState.
     */
    async loginWithClerkCredentials(email: string, password: string, label = 'test user'): Promise<void> {
        const form = new ClerkLoginForm(this.page);
        await form.clearSession();
        await form.fillAndSubmit(email, password);
        await form.expectSuccess(label);
    }

    /** Joins the queue and asserts success. Throws if the rate limiter fires. */
    async joinQueue(): Promise<void> {
        await this.joinQueueExpectSuccess();
    }

    /** Joins the queue and asserts success. Throws if the rate limiter fires. */
    async joinQueueExpectSuccess(): Promise<void> {
        await this.wait.waitForLoadingFinished();
        const queue = new QueueWidget(this.page);
        await queue.clickJoin();
        await queue.expectQueuedOrRateLimit();
    }

    /** Joins the queue and asserts that the rate limiter fires within the given timeout. */
    async joinQueueExpectRateLimit(timeoutMs = 10000): Promise<void> {
        await this.wait.waitForLoadingFinished();
        const queue = new QueueWidget(this.page);
        await queue.clickJoin();
        await queue.expectRateLimit(timeoutMs);
    }

    /** Asserts that the ticket offer state is visible (offered / active / reserved). */
    async verifyOfferReceived(): Promise<void> {
        const queue = new QueueWidget(this.page);
        await queue.expectOfferVisible();
    }

    /** Asserts that the sold-out state is visible. */
    async verifySoldOut(): Promise<void> {
        const queue = new QueueWidget(this.page);
        await queue.expectSoldOut();
    }
}
