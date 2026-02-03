import { APIRequestContext, expect } from '@playwright/test';
import { UserData } from '@/support/builders/UserBuilder';

/**
 * AuthClient - API client for authentication operations
 * 
 * Provides helper methods for user registration and login.
 * Adapt these endpoints to match your API.
 */
export class AuthClient {
    constructor(private request: APIRequestContext) { }

    /**
     * Register a new user
     */
    async register(userData: UserData): Promise<any> {
        const response = await this.request.post('/api/auth/register', {
            data: userData
        });

        expect(response.ok()).toBeTruthy();
        const user = await response.json();

        console.log(`✅ User registered: ${user.email || user.id}`);
        return user;
    }

    /**
     * Login a user and return authenticated context
     */
    async login(credentials: { email: string; password: string }): Promise<APIRequestContext> {
        const response = await this.request.post('/api/auth/login', {
            data: credentials
        });

        expect(response.ok()).toBeTruthy();

        console.log(`✅ User logged in: ${credentials.email}`);

        // Return the request context (it now has auth cookies/tokens)
        return this.request;
    }
}
