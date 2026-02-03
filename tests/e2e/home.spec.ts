import { test, expect } from "@/fixtures/base.fixtures";

test("Home Page", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await expect(page).toHaveURL("http://localhost:3000/");

    await expect(page).toHaveTitle("Ticketing");
});