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

    async createEvent(eventData: EventFormData): Promise<void> {
        await this.page.getByTestId('create-event-button').click();

        const form = new EventForm(this.page);
        await form.fill(eventData);
        await form.submit();

        await this.wait.waitForRedirect(/\/event\/[a-z0-9]+/, 30000);
    }

    async verifyEventVisible(eventName: string): Promise<void> {
        await expect(this.page.getByText(eventName).first()).toBeVisible();
    }
}
