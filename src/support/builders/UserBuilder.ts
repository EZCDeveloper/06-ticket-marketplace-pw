import { BaseBuilder } from './BaseBuilder';
import { faker } from '@faker-js/faker';

export interface UserData {
    email: string;
    name: string;
    password: string;
    role?: 'user' | 'admin';
}

/**
 * UserBuilder - Example builder for user test data
 * 
 * @example
 * ```typescript
 * const user = new UserBuilder()
 *   .withAdmin()
 *   .build();
 * ```
 */
export class UserBuilder extends BaseBuilder<UserData> {
    protected defaults(): UserData {
        return {
            email: faker.internet.email(),
            name: faker.person.fullName(),
            password: 'Password123!',
            role: 'user'
        };
    }

    /**
     * Create an admin user
     */
    withAdmin(): this {
        return this.set('role', 'admin');
    }

    /**
     * Create a user with invalid email (for negative tests)
     */
    withInvalidEmail(): this {
        return this.set('email', 'invalid-email');
    }

    /**
     * Create a user with a specific email
     */
    withEmail(email: string): this {
        return this.set('email', email);
    }

    /**
     * Create a user with a specific name
     */
    withName(name: string): this {
        return this.set('name', name);
    }
}
