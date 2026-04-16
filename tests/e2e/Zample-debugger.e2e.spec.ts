import { test, expect } from '@/fixtures/base.fixtures';

// Run this spec as a "guest" (no preloaded auth storageState).
test.use({ storageState: { cookies: [], origins: [] } });

test('[SAMPLE 2] Verify Header text Upcomming Events', async ({ page }) => {

    test.setTimeout(5000);
    await page.goto('/');
    await page.getByRole('heading', { name: 'Upcoming Events' }).click();

})