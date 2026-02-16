import { APIRequestContext } from '@playwright/test';
import { ConvexClient } from '../api/ConvexClient';

export type ResourceType = 'user' | 'item' | 'event' | string;

export interface TrackedResource {
    type: ResourceType;
    id: string;
    metadata?: any;
}

/**
 * ResourceTracker - Generic cleanup utility for API tests
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
    async cleanupAll(convex: ConvexClient): Promise<void> {
        if (!this.hasResources()) {
            console.log('ℹ️  No resources to cleanup');
            return;
        }

        // Reverse order to handle dependencies
        const toCleanup = [...this.resources].reverse();

        console.log(`🧹 Cleaning up ${toCleanup.length} resources...`);

        for (const resource of toCleanup) {
            try {
                await this.cleanupResource(convex, resource);
            } catch (error) {
                console.warn(`⚠️  Failed to cleanup ${resource.type} ${resource.id}:`, error);
            }
        }

        this.resources = [];
        console.log('✅ Cleanup completed');
    }

    private async cleanupResource(convex: ConvexClient, resource: TrackedResource): Promise<void> {
        // Map types to mutations
        switch (resource.type) {
            case 'event':
                // Using cancelEvent as cleanup for now, or use a specific delete mutation if available
                await convex.mutation('events:cancelEvent', { eventId: resource.id });
                break;
            default:
                console.warn(`⚠️  No cleanup handler for resource type: ${resource.type}`);
        }

        console.log(`  ✓ Cleaned up ${resource.type}: ${resource.id}`);
    }
}
