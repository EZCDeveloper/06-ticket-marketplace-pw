import { test, expect } from '@playwright/test';
import { UserBuilder } from '@/support/builders/UserBuilder';
import { ConvexClient } from '@/support/api/ConvexClient';

/**
 * [API-1] User API Tests
 */
test.describe('API: User Profile', () => {
    let convex: ConvexClient;

    test.beforeEach(async ({ request }) => {
        convex = new ConvexClient(request);
    });

    test('[API-1.1.1] Create/Update User Profile', async () => {
        // ✅ ARRANGE: Build user data
        const userData = new UserBuilder().build();

        // ✅ ACT: Call updateUser mutation
        // Since we don't have Clerk auth headers in pure API tests easily,
        // we'll use a fixed userId or see if the mutation requires auth context.
        // Looking at users.ts, it seems to take args.
        const result = await convex.mutation('users:updateUser', {
            userId: `clerk_${userData.email.split('@')[0]}`,
            name: userData.name,
            email: userData.email
        });

        // ✅ ASSERT: Validate result
        expect(result).toBeDefined();

        // Verify via query
        const user = await convex.query('users:getUserById', {
            userId: `clerk_${userData.email.split('@')[0]}`
        });

        expect(user.name).toBe(userData.name);
        expect(user.email).toBe(userData.email);
    });
});
