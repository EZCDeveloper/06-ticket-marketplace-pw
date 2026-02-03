/**
 * API Endpoint Configuration
 * 
 * Centralize all API endpoints for easy maintenance and updates.
 * Update these to match your application's API structure.
 */
export const API_ENDPOINTS = {
    auth: {
        login: '/api/auth/login',
        register: '/api/auth/register',
        logout: '/api/auth/logout',
    },
    users: {
        base: '/api/users',
        byId: (id: string) => `/api/users/${id}`,
    },
    items: {
        base: '/api/items',
        byId: (id: string) => `/api/items/${id}`,
    },
    // Add your domain-specific endpoints here
    // Example:
    // projects: {
    //   base: '/api/projects',
    //   byId: (id: string) => `/api/projects/${id}`,
    //   tasks: (projectId: string) => `/api/projects/${projectId}/tasks`,
    // },
};

/**
 * Environment configuration
 */
export const ENV = {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    apiUrl: process.env.API_URL || 'http://localhost:3000',
};
