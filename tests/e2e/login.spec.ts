import { test, expect } from '@/fixtures/base.fixtures';
import { UserBuilder } from '@/support/builders/UserBuilder';
import { AuthClient } from '@/support/api/AuthClient';

/**
 * E2E Tests - Login Flow
 * 
 * These tests validate the complete user login journey through the UI.
 * They use API setup for speed and focus on UI interactions (30%).
 */
test.describe('E2E: Login Flow', () => {

    test.use({ storageState: { cookies: [], origins: [] } });

    test('[E2E-1.1.1] Complete Login Journey', async ({ page, request, cleanup }) => {
        const email = process.env.TEST_USER_EMAIL!;
        const password = process.env.TEST_USER_PASSWORD!;

        await test.step('Step 1: Navigate to login page', async () => {
            await page.goto('/');
            await page.getByTestId('desktop-sign-in-button').click();
        });

        await test.step('Step 2: Fill login form', async () => {
            await page.getByPlaceholder('Enter your email address').fill(email);
            await page.getByRole('button', { name: 'Continue', exact: true }).click();
            await page.getByPlaceholder('Enter your password').fill(password);
            await page.getByRole('button', { name: 'Continue', exact: true }).click();
        });

        await test.step('Step 3: Verify authentication success', async () => {
            await expect(page.getByRole('button', { name: 'Open user menu' }).or(page.getByTestId('user-button'))).toBeVisible({ timeout: 15000 });
        });
    });

    test.skip('[E2E-1.1.2] Login with Invalid Credentials', async ({ page }) => {
        // ✅ ACT: Navigate and attempt login with invalid credentials
        await page.goto('/login');

        await page.getByLabel('Email').fill('invalid@example.com');
        await page.getByLabel('Password').fill('wrongpassword');
        await page.getByRole('button', { name: 'Login' }).click();

        // ✅ ASSERT: Error message displayed
        await expect(page.getByText('Invalid credentials')).toBeVisible();
    });
});
