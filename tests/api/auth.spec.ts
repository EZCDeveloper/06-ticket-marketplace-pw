import { test, expect } from '@/fixtures/base.fixtures';
import { UserBuilder } from '@/support/builders/UserBuilder';
import { AuthClient } from '@/support/api/AuthClient';

/**
 * API Tests - Authentication
 * 
 * These tests validate the authentication API endpoints.
 * They are fast, reliable, and form the foundation of your test suite (70%).
 */
test.describe('API: Authentication', () => {

    test('[API-1.1.1] User Registration - Success', async ({ request, cleanup }) => {
        // ✅ ARRANGE: Build test data using builder
        const userData = new UserBuilder().build();
        const authClient = new AuthClient(request);

        // ✅ ACT: Register user via API
        const user = await authClient.register(userData);

        // ✅ ASSERT: Validate response
        expect(user).toHaveProperty('id');
        expect(user.email).toBe(userData.email);
        expect(user.name).toBe(userData.name);

        // ✅ CLEANUP: Track for auto-cleanup
        cleanup.track('user', user.id);
    });

    test('[API-1.1.2] User Registration - Invalid Email', async ({ request }) => {
        // ✅ ARRANGE: Build user with invalid email
        const userData = new UserBuilder().withInvalidEmail().build();

        // ✅ ACT: Attempt registration
        const response = await request.post('/api/auth/register', {
            data: userData
        });

        // ✅ ASSERT: Expect validation error
        expect(response.status()).toBe(400);
    });

    test('[API-1.2.1] User Login - Success', async ({ request, cleanup }) => {
        // ✅ ARRANGE: Create and register user
        const userData = new UserBuilder().build();
        const authClient = new AuthClient(request);
        const user = await authClient.register(userData);
        cleanup.track('user', user.id);

        // ✅ ACT: Login
        const authContext = await authClient.login({
            email: userData.email,
            password: userData.password
        });

        // ✅ ASSERT: Context is authenticated
        expect(authContext).toBeDefined();
    });
});
