import { APIRequestContext } from '@playwright/test';

/**
 * ConvexClient - Abstraction for calling Convex functions via HTTP API.
 * Uses the Convex POST /api/mutation and /api/query endpoints.
 */
function requireConvexUrl(): string {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
    if (!url) {
        throw new Error(
            'NEXT_PUBLIC_CONVEX_URL must be set in .env.local (your Convex deployment URL, no trailing slash).',
        );
    }
    return url.replace(/\/$/, '');
}

export class ConvexClient {
    private convexUrl: string;

    constructor(private request: APIRequestContext) {
        this.convexUrl = requireConvexUrl();
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
