import { test, expect } from '@/fixtures/base.fixtures';
import { EventBuilder } from '@/support/builders/EventBuilder';

/**
 * E2E Tests - Seller Flow
 * 
 * Verifies that a seller can:
 * 1. Access the seller dashboard
 * 2. Create a new event
 * 3. View their events
 */
test.describe('E2E: Seller Flow', () => {

    test('[E2E-3.1.1] Create New Event via Dashboard', async ({ page }) => {
        // ✅ ARRANGE: Use demo credentials for seller login
        await page.goto('/');
        await page.getByTestId('desktop-sign-in-button').click();

        await page.getByPlaceholder('Enter your email address').fill('waltertestcustomer@gmail.com');
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await page.getByPlaceholder('Enter your password').fill('123***man');
        await page.getByRole('button', { name: 'Continue', exact: true }).click();

        // ✅ ACT: Navigate to Seller Dashboard
        // Clicking the explicit 'Sell Tickets' button in the header
        await page.getByTestId('sell-tickets-button').click();

        await expect(page).toHaveURL(/\/seller/);

        // Click create event button
        await page.getByTestId('create-event-nav-button').or(page.getByRole('button', { name: /Create Event/i })).click();

        // Fill form using data-testids
        const eventData = new EventBuilder().build();
        await page.getByTestId('event-name-input').fill(eventData.name);
        await page.getByTestId('event-description-input').fill(eventData.description);
        await page.getByTestId('event-location-input').fill(eventData.location);
        await page.getByTestId('event-price-input').fill(eventData.price.toString());
        await page.getByTestId('event-tickets-input').fill(eventData.totalTickets.toString());

        // Date input using data-testid
        const eventDateStr = new Date(eventData.eventDate).toISOString().split('T')[0];
        await page.getByTestId('event-date-input').fill(eventDateStr);

        await page.getByTestId('event-form-submit-button').click();

        // ✅ ASSERT: Event is created and visible in dashboard
        await expect(page.getByText(eventData.name)).toBeVisible({ timeout: 15000 });
    });
});
