import { test, expect } from '@/fixtures/base.fixtures';
import { EventBuilder } from '@/support/builders/EventBuilder';
import { ClerkLoginForm } from '@/support/components/ClerkLoginForm';
import { EventForm } from '@/support/components/EventForm';

/**
 * 🎓 EDUCATIONAL SAMPLE: Seller Flow
 *
 * This file is a reference for new contributors. It is named `.example.ts`
 * and lives in `tests/examples/` so Playwright ignores it during all test runs.
 *
 * It shows the three-layer model in action:
 *   Test → Domain Actor (Seller) → Component (EventForm) → Playwright locators
 *
 * For real tests, use the Seller domain actor from base.fixtures
 * instead of calling components directly (see tests/e2e/seller.spec.ts).
 */
test.describe('E2E: Seller Flow (Sample)', () => {

    test('[SAMPLE] Create New Event via Dashboard', async ({ page }) => {

        // ARRANGE: Log in using the ClerkLoginForm component.
        // In production tests, use pre-authenticated storageState instead.
        await page.goto('/');
        const loginForm = new ClerkLoginForm(page);
        await loginForm.fillAndSubmit('myemailhere@gmail.com', '123456789');

        // ACT: Navigate to seller dashboard and open the event creation form.
        await page.getByTestId('sell-tickets-button').click();
        await expect(page).toHaveURL(/\/seller/);
        await page.getByTestId('create-event-button').click();

        // Fill and submit the form using the EventForm component.
        const eventData = new EventBuilder().build();
        const eventForm = new EventForm(page);
        await eventForm.fill({
            ...eventData,
            eventDate: new Date(eventData.eventDate),
        });
        await eventForm.submit();

        // ASSERT: Event is created and visible on the event page.
        await expect(page.getByTestId('event-title').filter({ hasText: eventData.name })).toBeVisible({ timeout: 15000 });
    });
});
