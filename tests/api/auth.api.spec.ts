import { test, expect } from '@/fixtures/base.fixtures';
import { UserBuilder } from '@/support/builders/UserBuilder';
import { AuthClient } from '@/support/api/AuthClient';

/**
 * API Tests - Authentication
 * 
 * These tests validate the authentication API endpoints.
 * They are fast, reliable, and form the foundation of your test suite (70%).
 */
test.describe('API - 1: Authentication', () => {

    test('[API - 1.1] User Registration - Success', { tag: ['@auth'] }, async ({ request, cleanup }) => {
        const userData = new UserBuilder().build();
        const authClient = new AuthClient(request);
        let user: any;

        await test.step('Step 1: Register user via API', async () => {
            user = await authClient.register(userData);
            expect(user).toHaveProperty('id');
            cleanup.track('user', user.id);
        });

        await test.step('Step 2: Validate user data matches', async () => {
            expect(user.email).toBe(userData.email);
            expect(user.name).toBe(userData.name);
        });
    });

    test('[API - 1.2] User Login - Success', { tag: ['@auth', '@critical'] }, async ({ request, cleanup }) => {
        const userData = new UserBuilder().build();
        const authClient = new AuthClient(request);

        await test.step('Step 1: Create and register user', async () => {
            const user = await authClient.register(userData);
            cleanup.track('user', user.id);
        });

        await test.step('Step 2: Perform login and verify context', async () => {
            const authContext = await authClient.login({
                email: userData.email,
                password: userData.password
            });
            expect(authContext).toBeDefined();
        });
    });
});
