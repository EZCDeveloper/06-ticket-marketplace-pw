import { test, expect } from '@/fixtures/base.fixtures';
import { ClerkLoginForm } from '@/support/components/ClerkLoginForm';

/**
 * E2E Tests - Login Flow
 *
 * Validates the complete user login journey through the UI.
 * Uses ClerkLoginForm component directly — this spec IS testing the component.
 */
test.describe('E2E - 1: Login Flow', () => {

    test.use({ storageState: { cookies: [], origins: [] } });

    test('[E2E - 1.1] Complete Login Journey', { tag: ['@auth', '@critical'] }, async ({ page }) => {
        const email = process.env.TEST_USER_EMAIL!;
        const password = process.env.TEST_USER_PASSWORD!;

        await test.step('Step 1: Navigate to homepage', async () => {
            await page.goto('/');
        });

        await test.step('Step 2: Fill and submit login form', async () => {
            const form = new ClerkLoginForm(page);
            await form.fillAndSubmit(email, password);
        });

        await test.step('Step 3: Verify authentication success', async () => {
            await expect(
                page.getByRole('button', { name: 'Open user menu' })
                    .or(page.getByTestId('user-button'))
            ).toBeVisible({ timeout: 15000 });
        });
    });

    test.skip('[E2E - 1.2] Login with Invalid Credentials', { tag: ['@auth', '@negative'] }, async ({ page }) => {
        /**
         * PENDING: Implement once the negative credential path is confirmed.
         * Use ClerkLoginForm.fillAndSubmit() + expectEmailFieldVisible() / error assertion.
         */
        await page.goto('/login');
        const form = new ClerkLoginForm(page);
        await form.open();
        await form.fillEmail('invalid@example.com');
        await form.fillPassword('wrongpassword');
        await expect(page.getByText('Invalid credentials')).toBeVisible();
    });
});
