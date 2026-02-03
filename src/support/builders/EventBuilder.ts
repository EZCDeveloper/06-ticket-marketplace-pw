import { BaseBuilder } from './BaseBuilder';
import { faker } from '@faker-js/faker';

export interface EventData {
    name: string;
    description: string;
    location: string;
    eventDate: number;
    price: number;
    totalTickets: number;
    userId: string;
}

/**
 * EventBuilder - Builder for event test data
 */
export class EventBuilder extends BaseBuilder<EventData> {
    protected defaults(): EventData {
        // Future date (next 30 days)
        const futureDate = faker.date.soon({ days: 30 }).getTime();

        return {
            name: `${faker.commerce.productName()} Concert`,
            description: faker.commerce.productDescription(),
            location: `${faker.location.city()}, ${faker.location.country()}`,
            eventDate: futureDate,
            price: faker.number.int({ min: 10, max: 200 }),
            totalTickets: faker.number.int({ min: 1, max: 100 }),
            userId: `user_${faker.string.alphanumeric(10)}`
        };
    }

    withTickets(count: number): this {
        return this.set('totalTickets', count);
    }

    withPrice(price: number): this {
        return this.set('price', price);
    }

    withUserId(userId: string): this {
        return this.set('userId', userId);
    }

    pastEvent(): this {
        return this.set('eventDate', faker.date.past().getTime());
    }
}
