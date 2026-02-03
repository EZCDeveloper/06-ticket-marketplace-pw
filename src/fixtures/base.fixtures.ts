import { test as base, APIRequestContext } from '@playwright/test';
import { ResourceTracker } from '@/support/cleanup/ResourceTracker';

/**
 * Base Fixtures - Extend Playwright's test with custom fixtures
 * 
 * This provides:
 * - cleanup: Automatic resource tracking and cleanup
 * - Future: Add authenticatedUser, authenticatedAdmin, etc.
 */

type BaseFixtures = {
    cleanup: ResourceTracker;
};

export const test = base.extend<BaseFixtures>({
    /**
     * Cleanup fixture - Automatically tracks and cleans resources
     */
    cleanup: async ({ request }, use) => {
        const tracker = new ResourceTracker();
        await use(tracker);

        // Auto-cleanup after test
        if (tracker.hasResources()) {
            await tracker.cleanupAll(request);
        }
    },
});

export { expect } from '@playwright/test';
