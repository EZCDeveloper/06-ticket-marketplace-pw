import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local'), quiet: true });

const isCI = !!process.env.CI;

export default defineConfig({
    testDir: './tests',
    testIgnore: ['**/examples/**'],

    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? (process.env.CI_WORKERS ? parseInt(process.env.CI_WORKERS) : 4) : undefined,

    reporter: isCI
        ? [['github'], ['html', { open: 'never' }]]
        : [['html'], ['list']],

    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
        extraHTTPHeaders: {
            'Accept': 'application/json',
        },
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        viewport: { width: 1280, height: 720 },
        // In CI only keep recordings for failed tests to save time and storage.
        // Locally, keep recordings always on for demo/tutorial videos.
        video: {
            mode: isCI ? 'retain-on-failure' : 'on',
            size: { width: 1280, height: 720 },
        },
        // slowMo is only useful when recording tutorial videos locally.
        // Never slow down tests in CI or regular local runs.
        launchOptions: {
            slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
        },
    },

    projects: [
        // ─── Auth setup (runs once, saves storageState) ───────────────────────
        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
        },

        // ─── Smoke: fast health checks (~15s), fail fast ──────────────────────
        {
            name: 'smoke',
            testMatch: /smoke\/.*\.spec\.ts/,
            timeout: 15_000,
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
        },

        // ─── API: business logic validation (~10s), no browser overhead ───────
        {
            name: 'api',
            testMatch: /api\/.*\.spec\.ts/,
            timeout: 10_000,
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['smoke'],
        },

        // ─── E2E: critical user journeys (~60s), real browser ─────────────────
        {
            name: 'e2e',
            testMatch: /e2e\/.*\.spec\.ts/,
            timeout: 60_000,
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['smoke'],
        },

        // ─── Scripts: manual maintenance tasks, run explicitly only ───────────
        {
            name: 'scripts',
            testMatch: /scripts\/.*\.spec\.ts/,
            timeout: 30_000,
            use: {
                storageState: 'playwright/.auth/user.json',
            },
        },
    ],
});
