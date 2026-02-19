import { APIRequestContext } from '@playwright/test';

export type TempClerkUser = {
    userId: string;
    email: string;
    password: string;
};

export class ClerkAdminClient {
    private readonly clerkApiUrl: string;
    private readonly secretKey?: string;

    constructor(private readonly request: APIRequestContext) {
        this.clerkApiUrl = process.env.CLERK_API_URL || 'https://api.clerk.com/v1';
        this.secretKey = process.env.CLERK_SECRET_KEY;
    }

    private assertSecretKey() {
        if (!this.secretKey) {
            throw new Error('CLERK_SECRET_KEY is required in .env.local for temporary Clerk user creation.');
        }
    }

    private buildTempUserCredentials(): { email: string; password: string } {
        const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        return {
            email: `pw.temp.${suffix}@example.com`,
            password: `Pw!${suffix}Aa1`,
        };
    }

    async createTempUser(): Promise<TempClerkUser> {
        this.assertSecretKey();
        const credentials = this.buildTempUserCredentials();
        const response = await this.request.post(`${this.clerkApiUrl}/users`, {
            headers: {
                Authorization: `Bearer ${this.secretKey}`,
                'Content-Type': 'application/json',
            },
            data: {
                email_address: [credentials.email],
                password: credentials.password,
                skip_password_checks: true,
            },
        });

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed creating Clerk temp user: ${response.status()} ${body}`);
        }

        const user = await response.json();
        return {
            userId: user.id as string,
            email: credentials.email,
            password: credentials.password,
        };
    }

    async deleteUser(userId: string): Promise<void> {
        if (!this.secretKey) return;

        try {
            const response = await this.request.delete(`${this.clerkApiUrl}/users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                },
            });

            if (!response.ok() && response.status() !== 404) {
                const body = await response.text();
                console.warn(`Failed deleting Clerk temp user ${userId}: ${response.status()} ${body}`);
            }
        } catch (error: any) {
            // Best effort cleanup: do not fail tests if request context is already disposed.
            if (!String(error?.message || '').includes('Target page, context or browser has been closed')) {
                console.warn(`Failed deleting Clerk temp user ${userId}: ${error?.message ?? error}`);
            }
        }
    }
}
