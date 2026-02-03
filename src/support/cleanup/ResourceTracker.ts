import { APIRequestContext } from '@playwright/test';

export type ResourceType = 'user' | 'item' | string;

export interface TrackedResource {
    type: ResourceType;
    id: string;
    metadata?: any;
}

/**
 * ResourceTracker - Generic cleanup utility for API tests
 * 
 * Tracks created resources and automatically deletes them in reverse order (LIFO).
 * This ensures proper cleanup of test data without manual try-finally blocks.
 * 
 * @example
 * ```typescript
 * const tracker = new ResourceTracker();
 * const user = await createUser(request);
 * tracker.track('user', user.id);
 * 
 * // At the end of test
 * await tracker.cleanupAll(request);
 * ```
 */
export class ResourceTracker {
    private resources: TrackedResource[] = [];

    /**
     * Track a resource for auto-cleanup
     */
    track(type: ResourceType, id: string, metadata?: any): void {
        this.resources.push({ type, id, metadata });
        console.log(`✅ Tracked ${type} with ID: ${id}`);
    }

    /**
     * Check if there are resources to clean
     */
    hasResources(): boolean {
        return this.resources.length > 0;
    }

    /**
     * Get count of tracked resources
     */
    count(): number {
        return this.resources.length;
    }

    /**
     * Cleanup all tracked resources in reverse order (LIFO)
     */
    async cleanupAll(request: APIRequestContext): Promise<void> {
        if (!this.hasResources()) {
            console.log('ℹ️  No resources to cleanup');
            return;
        }

        // Reverse order to handle dependencies (e.g. delete items before user)
        const toCleanup = [...this.resources].reverse();

        console.log(`🧹 Cleaning up ${toCleanup.length} resources...`);

        for (const resource of toCleanup) {
            try {
                await this.cleanupResource(request, resource);
            } catch (error) {
                console.warn(`⚠️  Failed to cleanup ${resource.type} ${resource.id}:`, error);
            }
        }

        this.resources = [];
        console.log('✅ Cleanup completed');
    }

    private async cleanupResource(request: APIRequestContext, resource: TrackedResource): Promise<void> {
        // 🗺️ ENDPOINT MAPPING (Configurable)
        // In a real project, this could come from a config file
        const endpoints: Record<string, string> = {
            'user': '/api/users',
            'item': '/api/items',
            // Add your domain-specific resources here
            // Example:
            // 'project': '/api/projects',
            // 'task': '/api/tasks',
        };

        const endpoint = endpoints[resource.type];

        if (!endpoint) {
            console.warn(`⚠️  No endpoint mapped for resource type: ${resource.type}`);
            return;
        }

        const response = await request.delete(`${endpoint}/${resource.id}`);

        if (!response.ok() && response.status() !== 404) {
            throw new Error(`API responded with ${response.status()}`);
        }

        console.log(`  ✓ Deleted ${resource.type}: ${resource.id}`);
    }
}
