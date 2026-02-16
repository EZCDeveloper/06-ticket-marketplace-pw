import { Page, expect } from '@playwright/test';

export class WaitManager {
    constructor(private readonly page: Page) { }

    async waitForLoadingFinished() {
        // Wait for any common loading spinners to disappear
        await this.page.locator('[data-testid="spinner"], .spinner, .loading').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
    }

    async waitForState(text: string | RegExp, timeout = 15000) {
        await expect(this.page.locator('body')).toHaveText(text, { timeout });
    }

    async waitForRedirect(pattern: RegExp, timeout = 30000) {
        await this.page.waitForURL(pattern, { timeout });
    }
}
