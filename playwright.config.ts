import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

/**
 * Playwright Configuration - SaaS Turbo Template
 * 
 * This configuration embodies the "Quality Speed" philosophy:
 * - Fast execution with parallelization
 * - Reliable retries for flaky tests
 * - Clear reporting
 */
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
        },
        // Uncomment to enable Firefox and WebKit
        // {
        //   name: 'firefox',
        //   use: { ...devices['Desktop Firefox'], storageState: 'playwright/.auth/user.json' },
        //   dependencies: ['setup'],
        // },
        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'], storageState: 'playwright/.auth/user.json' },
        //   dependencies: ['setup'],
        // },
    ],

    // Run local dev server before starting tests (optional)
    // webServer: {
    //   command: 'npm run dev',
    //   url: 'http://localhost:3000',
    //   reuseExistingServer: !process.env.CI,
    // },
});
