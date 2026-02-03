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

    test('[E2E-1.1.1] Complete Login Journey', async ({ page, request, cleanup }) => {
        // ✅ ARRANGE: Create user via API (fast setup)
        const userData = new UserBuilder().build();
        const authClient = new AuthClient(request);
        await authClient.register(userData);

        // ✅ ACT: Navigate to login page
        await page.goto('/');
        await page.getByTestId('desktop-sign-in-button').click();

        // Fill login form (Clerk Modal)
        await page.getByPlaceholder('Enter your email address').fill('waltertestcustomer@gmail.com');
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await page.getByPlaceholder('Enter your password').fill('123***man');
        await page.getByRole('button', { name: 'Continue', exact: true }).click();

        // ✅ ASSERT: User is redirected and authenticated
        await expect(page.getByRole('button', { name: 'Open user menu' }).or(page.getByTestId('user-button'))).toBeVisible({ timeout: 15000 });
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
