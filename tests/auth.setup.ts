import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Check if we are already logged in (unlikely in a clean setup but good practice)
    const signOutButton = page.getByRole('button', { name: /Sign Out|My Account/i });
    if (await signOutButton.isVisible()) {
        console.log('✅ Already authenticated');
        return;
    }

    // Click sign in button
    await page.getByTestId('desktop-sign-in-button').click();

    // Fill credentials (using environment variables)
    const email = process.env.TEST_USER_EMAIL!;
    const password = process.env.TEST_USER_PASSWORD!;

    if (!email || !password) {
        throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local');
    }

    await page.getByPlaceholder('Enter your email address').fill(email);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    await page.getByPlaceholder('Enter your password').fill(password);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // Verify login success - wait for a specific element that appears after login
    // For example, the "Sell Tickets" button or "My Tickets"
    await expect(page.getByTestId('sell-tickets-button')).toBeVisible({ timeout: 15000 });

    // End of authentication steps.
    await page.context().storageState({ path: authFile });
    console.log(`✅ Authentication state saved to ${authFile}`);
});
