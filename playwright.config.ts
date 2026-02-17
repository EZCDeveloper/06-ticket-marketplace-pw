import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });


export default defineConfig({
    testDir: './tests',

    // Maximum time one test can run
    timeout: 30 * 1000,

    // Test configuration
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,

    // Reporter configuration
    reporter: [
        ['html'],
        ['list']
    ],

    // Shared settings for all projects
    use: {
        // Base URL for tests
        baseURL: process.env.BASE_URL || 'http://localhost:3000',

        // API base URL
        extraHTTPHeaders: {
            'Accept': 'application/json',
        },

        // Collect trace when retrying the failed test
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        viewport: { width: 1280, height: 720 },
        video: {
            mode: 'on',
            size: { width: 1280, height: 720 }
        },
        launchOptions: {
            slowMo: 1000,
        }
    },

    // Configure projects for different browsers
    projects: [
        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
        },
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Use prepared auth state.
                storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
        }
    ]
});
