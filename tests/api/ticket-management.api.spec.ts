import { test, expect } from '@/fixtures/base.fixtures';
import { UserBuilder } from '@/support/builders/UserBuilder';
import { ConvexClient } from '@/support/api/ConvexClient';
import { CONVEX_FN } from '@config/convex-functions';

/**
 * FLOW 6 | API - 6: Ticket Management
 *
 * Covers the business logic for the ticket management flow:
 * User → My Tickets → View Ticket Details → Access QR Code →
 * Check Event Status → View Purchase History
 *
 * @see ABOUT_APPLICATION.md — API - 6: Ticket Management
 */
test.describe('API - 6: Ticket Management', () => {

    test('[API - 6.1] Create/Update User Profile', { tag: ['@tickets', '@flow-6'] }, async ({ request, cleanup }) => {
        const convex = new ConvexClient(request);
        const userData = new UserBuilder().build();
        const userId = `clerk_${userData.email.split('@')[0]}`;

        await test.step('Step 1: Call updateUser mutation via API', async () => {
            const result = await convex.mutation(CONVEX_FN.users.updateUser, {
                userId,
                name: userData.name,
                email: userData.email
            });
            expect(result).toBeDefined();
            cleanup.track('user', userId);
        });

        await test.step('Step 2: Verify user data via query', async () => {
            const user = await convex.query(CONVEX_FN.users.getUserById, { userId });
            expect(user.name).toBe(userData.name);
            expect(user.email).toBe(userData.email);
        });
    });
});
