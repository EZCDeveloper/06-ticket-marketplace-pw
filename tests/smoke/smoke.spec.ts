import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Critical Health Checks
 * 
 * These tests verify that the most critical paths work.
 * They run first in CI/CD to catch catastrophic failures early.
 */
test.describe('Smoke: Critical Paths', () => {

    test('[SM-1.1.1] Homepage Loads', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle(/./); // Has some title
        await expect(page.locator('body')).toBeVisible();
    });

    test('[SM-1.1.2] API Health Check', async ({ request }) => {
        const response = await request.get('/api/health');

        expect(response.ok()).toBeTruthy();
    });

    test('[SM-1.1.3] Login Page Accessible', async ({ page }) => {
        await page.goto('/login');

        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    });
});
