import { test as setup, expect } from '@playwright/test';
import { ClerkLoginForm } from '@/support/components/ClerkLoginForm';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
    await page.goto('/');

    // Guard: skip login if a session is already active.
    const signOutButton = page.getByRole('button', { name: /Sign Out|My Account/i });
    if (await signOutButton.isVisible()) {
        console.log('✅ Already authenticated');
        return;
    }

    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
        throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local');
    }

    const form = new ClerkLoginForm(page);
    await form.fillAndSubmit(email, password);

    // Wait for the seller dashboard entry point as the sign-in success indicator.
    await expect(page.getByTestId('sell-tickets-button')).toBeVisible({ timeout: 15000 });

    await page.context().storageState({ path: authFile });
    console.log(`✅ Authentication state saved to ${authFile}`);
});
