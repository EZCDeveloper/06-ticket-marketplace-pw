import { APIRequestContext } from '@playwright/test';
import { UserData } from '@/support/builders/UserBuilder';
import { ConvexClient } from './ConvexClient';
import { CONVEX_FN } from '../../config/convex-functions';

/**
 * AuthClient - API client for authentication operations
 * 
 * Re-implemented to use Convex mutations for this application.
 */
export class AuthClient {
    private convex: ConvexClient;

    constructor(private request: APIRequestContext) {
        this.convex = new ConvexClient(request);
    }

    /**
     * Register/Update a user profile
     */
    async register(userData: UserData): Promise<any> {
        // Use the Convex mutation instead of /api/auth/register
        // In this app, users are created/updated via users:updateUser
        const userId = `clerk_${userData.email.split('@')[0]}`;

        await this.convex.mutation(CONVEX_FN.users.updateUser, {
            userId,
            name: userData.name,
            email: userData.email
        });

        console.log(`✅ User registered via Convex: ${userData.email}`);

        // Return a mock user object that matches expectations
        return {
            id: userId,
            email: userData.email,
            name: userData.name
        };
    }

    /**
     * Login - Mocked for API testing purposes
     */
    async login(credentials: { email: string; password: string }): Promise<APIRequestContext> {
        console.log(`✅ User login simulated: ${credentials.email}`);
        // Return context (in real scenario would set cookies/tokens)
        return this.request;
    }
}
