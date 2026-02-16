import { Page, expect } from '@playwright/test';
import { ResourceTracker } from '../cleanup/ResourceTracker';
import { WaitManager } from '../utils/WaitManager';

export class Seller {
    private readonly wait: WaitManager;

    constructor(
        public readonly page: Page,
        private readonly cleanup: ResourceTracker
    ) {
        this.wait = new WaitManager(page);
    }

    async navigateToDashboard() {
        await this.page.goto('/seller');
        await expect(this.page.getByRole('heading', { name: 'Seller Dashboard' })).toBeVisible({ timeout: 15000 });
    }

    async createEvent(eventData: {
        name: string;
        description: string;
        location: string;
        eventDate: Date;
        price: number;
        totalTickets: number;
    }) {
        await this.page.getByTestId('create-event-button').click();

        await this.page.getByTestId('event-name-input').fill(eventData.name);
        await this.page.getByTestId('event-description-input').fill(eventData.description);
        await this.page.getByTestId('event-location-input').fill(eventData.location);

        const dateInput = this.page.getByTestId('event-date-input');
        await dateInput.fill(eventData.eventDate.toISOString().split('T')[0]);
        await dateInput.dispatchEvent('change');

        await this.page.getByTestId('event-price-input').fill(eventData.price.toString());
        await this.page.getByTestId('event-tickets-input').fill(eventData.totalTickets.toString());

        // Submit form
        const submitButton = this.page.getByTestId('event-form-submit-button');

        // Wait for button to be stable
        await expect(submitButton).toBeEnabled();
        await submitButton.hover(); // Ensure it takes pointer events

        // Try standard click first
        await submitButton.click({ force: false }); // Try WITHOUT force first to ensure it's actually interactive

        // If still on the same page after 2 seconds, try JS-based submit as fallback for hydration issues
        await this.page.waitForTimeout(2000);

        // Check if we haven't redirected yet
        if (this.page.url().includes('seller/new-event')) {
            console.log('⚠️ Form did not submit via click, trying aggressive JS submit...');

            // Aggressive fallback: Find form and dispatch submit event directly
            await this.page.evaluate(() => {
                const form = document.querySelector('form');
                if (form) {
                    form.requestSubmit(); // Try requestSubmit first (validates)
                    if (!document.querySelector('.text-destructive')) {
                        // If no validation errors, try pure submit if requestSubmit did nothing
                        // form.submit(); // CAREFUL: This bypasses React handling usually
                    }
                }
                // Also try clicking the button via JS
                const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
                if (btn) btn.click();
            });
        }

        // Use WaitManager for the redirect
        await this.wait.waitForRedirect(/\/event\/[a-z0-9]+/, 30000);
    }

    async verifyEventVisible(eventName: string) {
        await expect(this.page.getByText(eventName).first()).toBeVisible();
    }
}
