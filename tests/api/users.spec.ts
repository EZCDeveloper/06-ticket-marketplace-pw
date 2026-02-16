import { test, expect } from '@/fixtures/base.fixtures';
import { UserBuilder } from '@/support/builders/UserBuilder';
import { ConvexClient } from '@/support/api/ConvexClient';

/**
 * [API-1] User API Tests
 */
test.describe('API: User Profile', () => {

    test('[API-1.1.1] Create/Update User Profile', async ({ request, cleanup }) => {
        const convex = new ConvexClient(request);
        const userData = new UserBuilder().build();
        const userId = `clerk_${userData.email.split('@')[0]}`;

        await test.step('Step 1: Call updateUser mutation via API', async () => {
            const result = await convex.mutation('users:updateUser', {
                userId,
                name: userData.name,
                email: userData.email
            });
            expect(result).toBeDefined();
            cleanup.track('user', userId);
        });

        await test.step('Step 2: Verify user data via query', async () => {
            const user = await convex.query('users:getUserById', { userId });
            expect(user.name).toBe(userData.name);
            expect(user.email).toBe(userData.email);
        });
    });
});
