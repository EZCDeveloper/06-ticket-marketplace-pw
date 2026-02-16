import { APIRequestContext, expect } from '@playwright/test';

/**
 * ConvexClient - Abstraction for calling Convex functions via HTTP API.
 * Uses the Convex POST /api/mutation and /api/query endpoints.
 */
export class ConvexClient {
    private convexUrl: string;

    constructor(private request: APIRequestContext) {
        this.convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://majestic-sparrow-23.convex.cloud';
    }

    /**
     * Call a Convex mutation
     */
    async mutation(path: string, args: Record<string, any> = {}): Promise<any> {
        const url = `${this.convexUrl}/api/mutation`;
        const response = await this.request.post(url, {
            data: {
                path,
                args
            }
        });

        if (!response.ok()) {
            const text = await response.text();
            throw new Error(`Convex Mutation Failed: ${path}\nStatus: ${response.status()}\nError: ${text}`);
        }

        const result = await response.json();
        return result.value;
    }

    /**
     * Call a Convex query
     */
    async query(path: string, args: Record<string, any> = {}): Promise<any> {
        const url = `${this.convexUrl}/api/query`;
        const response = await this.request.post(url, {
            data: {
                path,
                args
            }
        });

        if (!response.ok()) {
            const text = await response.text();
            throw new Error(`Convex Query Failed: ${path}\nStatus: ${response.status()}\nError: ${text}`);
        }

        const result = await response.json();
        return result.value;
    }
}
