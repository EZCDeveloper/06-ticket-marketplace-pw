import { Page, expect } from '@playwright/test';

/**
 * ClerkLoginForm — Clerk authentication form component.
 *
 * Single source of truth for all Clerk login UI locators and interactions.
 * Used by: auth.setup.ts · login.spec.ts · Buyer (via loginWithClerkCredentials)
 *
 * If Clerk ever changes its form UI (new placeholders, button labels, test IDs),
 * update this file only — all callers are fixed automatically.
 */
export class ClerkLoginForm {
    constructor(private readonly page: Page) {}

    // ─── Locators ─────────────────────────────────────────────────────────────

    private get signInButton() {
        return this.page.getByTestId('desktop-sign-in-button');
    }

    private get emailInput() {
        return this.page.getByPlaceholder('Enter your email address');
    }

    private get passwordInput() {
        return this.page.getByPlaceholder('Enter your password');
    }

    private get continueButton() {
        return this.page.getByRole('button', { name: 'Continue', exact: true });
    }

    private get signedInIndicator() {
        return this.page.getByTestId('sell-tickets-button')
            .or(this.page.getByTestId('my-tickets-button'))
            .or(this.page.getByRole('button', { name: 'Open user menu' }))
            .or(this.page.getByTestId('user-button'));
    }

    private get invalidPasswordError() {
        return this.page
            .getByText(/Password is incorrect|Try again, or use another method/i)
            .first();
    }

    // ─── Session management ───────────────────────────────────────────────────

    /**
     * Clears cookies and storage to force a signed-out state before login.
     * Use this when the page may already have a session loaded (e.g. from storageState).
     */
    async clearSession(): Promise<void> {
        await this.page.context().clearCookies();
        await this.page.goto('/', { waitUntil: 'domcontentloaded' });
        await this.page.evaluate(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
        });
        await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    }

    // ─── Actions ──────────────────────────────────────────────────────────────

    /** Opens the Clerk sign-in modal from the navbar. */
    async open(): Promise<void> {
        await this.signInButton.click();
    }

    /** Fills the email step and advances to the password step. */
    async fillEmail(email: string): Promise<void> {
        await this.emailInput.fill(email);
        await this.continueButton.click();
    }

    /** Fills the password step and submits. */
    async fillPassword(password: string): Promise<void> {
        await this.passwordInput.fill(password);
        await this.continueButton.click();
    }

    /** Opens the modal, fills email and password, and submits — full happy path. */
    async fillAndSubmit(email: string, password: string): Promise<void> {
        await this.open();
        await this.fillEmail(email);
        await this.fillPassword(password);
    }

    // ─── Assertions ───────────────────────────────────────────────────────────

    /**
     * Waits for a post-login indicator to appear.
     * Throws with a clear message if Clerk reports an invalid password.
     *
     * @param label - descriptive label used in error messages (e.g. "temporary buyer")
     */
    async expectSuccess(label = 'test user'): Promise<void> {
        await Promise.race([
            this.signedInIndicator.first().waitFor({ state: 'visible', timeout: 15000 }),
            this.invalidPasswordError.waitFor({ state: 'visible', timeout: 15000 }),
        ]);

        if (await this.invalidPasswordError.isVisible()) {
            throw new Error(`Login failed for ${label}. Clerk reported invalid password.`);
        }

        await expect(this.signedInIndicator.first()).toBeVisible();
    }

    /**
     * Asserts that the email input field of the login form is visible.
     * Useful in smoke tests to verify the auth entry point is reachable.
     */
    async expectEmailFieldVisible(): Promise<void> {
        await expect(this.emailInput).toBeVisible();
        await expect(this.continueButton).toBeVisible();
    }
}
