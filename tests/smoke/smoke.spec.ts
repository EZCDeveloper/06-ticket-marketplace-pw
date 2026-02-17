import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Critical Health Checks
 * 
 * These tests verify that the most critical paths work.
 * They run first in CI/CD to catch catastrophic failures early.
 */
test.describe('Smoke: Critical Paths', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('[SM-1.1.1] Homepage Loads', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle(/./); // Has some title
        await expect(page.locator('body')).toBeVisible();
    });

    test('[SM-1.1.2] API Route Reachable', async ({ request }) => {
        // This app does not expose /api/health.
        // Validate an existing API route is present (not 404).
        const response = await request.get('/api/webhooks/stripe');
        expect(response.status()).not.toBe(404);
    });

    test('[SM-1.1.3] Login Entry Accessible', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('desktop-sign-in-button').click();

        await expect(page.getByPlaceholder('Enter your email address')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();
    });
});
