import { test as base, expect } from '@playwright/test';
import { ResourceTracker } from '../support/cleanup/ResourceTracker';
import { ConvexClient } from '../support/api/ConvexClient';
import { Seller } from '../support/domain/Seller';
import { Buyer } from '../support/domain/Buyer';
import { injectVisualIndicators } from '../support/utils/visual-indicator';

type DomainFixtures = {
    cleanup: ResourceTracker;
    convex: ConvexClient;
    seller: Seller;
    buyer: Buyer;
};

export const test = base.extend<DomainFixtures>({
    /**
     * Convex API Client fixture
     */
    convex: async ({ request }, use) => {
        const client = new ConvexClient(request);
        await use(client);
    },

    /**
     * Cleanup fixture - Automatically tracks and cleans resources
     */
    cleanup: async ({ request }, use) => {
        const tracker = new ResourceTracker();
        await use(tracker);

        // Auto-cleanup after test
        if (tracker.hasResources()) {
            const convex = new ConvexClient(request);
            await tracker.cleanupAll(convex);
            console.log('✅ Cleanup completed');
        }
    },

    /**
     * Page fixture - Extended with visual click indicator for tutorials
     */
    page: async ({ page }, use) => {
        await injectVisualIndicators(page);
        await use(page);
    },

    /**
     * Seller Domain Actor
     */
    seller: async ({ page, cleanup }, use) => {
        const seller = new Seller(page, cleanup);
        await use(seller);
    },

    /**
     * Buyer Domain Actor
     */
    buyer: async ({ page, convex }, use) => {
        const buyer = new Buyer(page, convex);
        await use(buyer);
    }
});

export { expect };
