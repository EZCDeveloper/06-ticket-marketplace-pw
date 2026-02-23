import { Page, expect } from '@playwright/test';

export interface EventFormData {
    name: string;
    description: string;
    location: string;
    eventDate: Date;
    price: number;
    totalTickets: number;
}

/**
 * EventForm — Event creation/editing form component.
 *
 * Encapsulates all form field locators and the smart submit strategy.
 *
 * Why a smart submit? Next.js apps can enter a window where the DOM is rendered
 * but React has not yet attached event handlers (hydration gap). A standard
 * Playwright click on the submit button during this window is silently ignored.
 * The `submit()` method detects this and falls back to a JS-level form dispatch.
 */
export class EventForm {
    constructor(private readonly page: Page) {}

    // ─── Locators ─────────────────────────────────────────────────────────────

    private get nameInput()        { return this.page.getByTestId('event-name-input'); }
    private get descriptionInput() { return this.page.getByTestId('event-description-input'); }
    private get locationInput()    { return this.page.getByTestId('event-location-input'); }
    private get dateInput()        { return this.page.getByTestId('event-date-input'); }
    private get priceInput()       { return this.page.getByTestId('event-price-input'); }
    private get ticketsInput()     { return this.page.getByTestId('event-tickets-input'); }
    private get submitButton()     { return this.page.getByTestId('event-form-submit-button'); }

    // ─── Actions ──────────────────────────────────────────────────────────────

    /** Fills every field in the event form. Does not submit. */
    async fill(data: EventFormData): Promise<void> {
        await this.nameInput.fill(data.name);
        await this.descriptionInput.fill(data.description);
        await this.locationInput.fill(data.location);

        // Date inputs in React/Next.js require a `change` event dispatch after fill.
        await this.dateInput.fill(data.eventDate.toISOString().split('T')[0]);
        await this.dateInput.dispatchEvent('change');

        await this.priceInput.fill(data.price.toString());
        await this.ticketsInput.fill(data.totalTickets.toString());
    }

    /**
     * Submits the form.
     *
     * Strategy:
     * 1. Standard Playwright click — works when hydration is complete.
     * 2. JS fallback via `requestSubmit()` — fires if the page URL has not changed
     *    after 2 seconds, which indicates the click was dropped during hydration.
     *
     * The fallback is NOT a workaround for bad selectors — it handles a known
     * Next.js behaviour where RSC hydration can delay event handler attachment.
     */
    async submit(): Promise<void> {
        await expect(this.submitButton).toBeEnabled();
        await this.submitButton.hover();
        await this.submitButton.click({ force: false });

        // Give React time to process the click before checking whether navigation occurred.
        await this.page.waitForTimeout(2000);

        if (this.page.url().includes('seller/new-event')) {
            console.log('⚠️ EventForm: submit click dropped (hydration gap). Using JS fallback...');
            await this.page.evaluate(() => {
                const form = document.querySelector('form');
                if (form) form.requestSubmit();
                const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
                if (btn) btn.click();
            });
        }
    }
}
