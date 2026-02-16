import { faker } from '@faker-js/faker';

/**
 * BaseBuilder - Abstract builder class for fluent test data creation
 * 
 * Extend this class to create domain-specific builders with:
 * - Smart defaults using Faker
 * - Fluent API for overrides
 * - Type safety
 * 
 * @example
 * ```typescript
 * class UserBuilder extends BaseBuilder<UserData> {
 *   protected defaults(): UserData {
 *     return {
 *       email: faker.internet.email(),
 *       name: faker.person.fullName(),
 *       password: 'Password123!'
 *     };
 *   }
 * 
 *   withAdmin(): this {
 *     return this.set('role', 'admin');
 *   }
 * }
 * ```
 */
export abstract class BaseBuilder<T> {
    protected data: T;

    constructor() {
        this.data = this.defaults();
    }

    /**
     * Define default values for the entity.
     * Use Faker for dynamic data generation.
     */
    protected abstract defaults(): T;

    /**
     * Return the built object (creates a copy to prevent mutation)
     */
    build(): T {
        return { ...this.data };
    }

    /**
     * Generic setter for fluent API
     * 
     * @example
     * builder.set('email', 'test@example.com')
     */
    protected set<K extends keyof T>(key: K, value: T[K]): this {
        this.data[key] = value;
        return this;
    }

    /**
     * Set multiple properties at once
     * 
     * @example
     * builder.setMany({ email: 'test@example.com', name: 'John' })
     */
    protected setMany(partial: Partial<T>): this {
        Object.assign(this.data, partial);
        return this;
    }
}
