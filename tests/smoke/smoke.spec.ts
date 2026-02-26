import { test, expect } from '@playwright/test';
import { ClerkLoginForm } from '@/support/components/ClerkLoginForm';

/**
 * Smoke Tests - Critical Health Checks
 * 
 * These tests verify that the most critical paths work.
 * They run first in CI/CD to catch catastrophic failures early.
 */
test.describe('Smoke: Critical Paths', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('[SM - 1.1] Homepage Loads', { tag: ['@smoke', '@critical'] }, async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle(/./); // Has some title
        await expect(page.locator('body')).toBeVisible();
    });

    test('[SM - 1.2] API Route Reachable', { tag: ['@smoke', '@critical'] }, async ({ request }) => {
        // This app does not expose /api/health.
        // Validate an existing API route is present (not 404).
        const response = await request.get('/api/webhooks/stripe');
        expect(response.status()).not.toBe(404);
    });

    test('[SM - 1.3] Login Entry Accessible', { tag: ['@smoke', '@critical', '@auth'] }, async ({ page }) => {
        await page.goto('/');
        const form = new ClerkLoginForm(page);
        await form.open();
        await form.expectEmailFieldVisible();
    });
});
