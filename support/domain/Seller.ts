import { Page, expect } from '@playwright/test';
import { ResourceTracker } from '../cleanup/ResourceTracker';
import { WaitManager } from '../utils/WaitManager';
import { EventForm, EventFormData } from '../components/EventForm';

/**
 * Seller — Domain actor for the event seller journey.
 *
 * Describes WHAT a seller does (navigate, create, verify).
 * Delegates HOW the UI is interacted with to Component Objects (EventForm).
 */
export class Seller {
    private readonly wait: WaitManager;

    constructor(
        public readonly page: Page,
        private readonly cleanup: ResourceTracker
    ) {
        this.wait = new WaitManager(page);
    }

    async navigateToDashboard(): Promise<void> {
        await this.page.goto('/seller');
        await expect(this.page.getByRole('heading', { name: 'Seller Dashboard' })).toBeVisible({ timeout: 15000 });
    }

    /**
     * Creates an event via the seller UI and returns the new event ID extracted
     * from the post-creation redirect URL (/event/<id>).
     * Using the UI guarantees the event is owned by the currently authenticated seller.
     */
    async createEvent(eventData: EventFormData): Promise<string> {
        await this.page.getByTestId('create-event-button').click();

        const form = new EventForm(this.page);
        await form.fill(eventData);
        await form.submit();

        await this.wait.waitForRedirect(/\/event\/[a-z0-9]+/, 30000);

        const match = this.page.url().match(/\/event\/([a-z0-9]+)/);
        return match?.[1] ?? '';
    }

    async verifyEventVisible(eventName: string): Promise<void> {
        await expect(this.page.getByText(eventName).first()).toBeVisible();
    }

    async navigateToEvent(eventId: string): Promise<void> {
        await this.page.goto(`/event/${eventId}`);
        await expect(this.page.getByTestId('event-detail-title')).toBeVisible({ timeout: 15000 });
    }

    /**
     * Navigates to /seller/events, finds the event card by ID, and cancels it.
     * CancelEventButton lives inside SellerEventList — it is NOT on the public event page.
     * Accepts the native window.confirm() dialog automatically.
     *
     * NOTE: Convex mutations run over WebSockets, so waitForLoadState('networkidle')
     * does NOT reliably signal completion. Instead we wait for the visual confirmation
     * badge (event-cancelled-status) to appear in the card, which proves the mutation
     * committed and the real-time UI updated.
     */
    async cancelEventFromList(eventId: string): Promise<void> {
        await this.page.goto('/seller/events');
        await expect(this.page.getByTestId('my-events-page-title')).toBeVisible({ timeout: 15000 });

        const eventCard = this.page.getByTestId(`seller-event-card-${eventId}`);
        await expect(eventCard).toBeVisible({ timeout: 10000 });

        this.page.once('dialog', dialog => dialog.accept());
        await eventCard.getByTestId('cancel-event-button').click();

        // Wait for the real-time UI update that confirms the Convex mutation committed.
        await expect(eventCard.getByTestId('event-cancelled-status')).toBeVisible({ timeout: 15000 });
    }

    /**
     * Navigates to /seller/events and asserts the event card shows the
     * "Event Cancelled & Refunded" badge.
     */
    async verifyEventCancelledInList(eventId: string): Promise<void> {
        await this.page.goto('/seller/events');
        await expect(this.page.getByTestId('my-events-page-title')).toBeVisible({ timeout: 15000 });
        const eventCard = this.page.getByTestId(`seller-event-card-${eventId}`);
        await expect(eventCard).toBeVisible({ timeout: 10000 });
        await expect(eventCard.getByTestId('event-cancelled-status')).toBeVisible({ timeout: 10000 });
    }
}
