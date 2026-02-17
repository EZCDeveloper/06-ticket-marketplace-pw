import { Page, TestInfo } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Utility to capture screenshots during a test flow and stitch them into a single tutorial image.
 */
export class ScreenshotStitcher {
    private screenshots: string[] = [];
    private tempDir: string;

    constructor(private page: Page, private testInfo: TestInfo) {
        // Create a temporary directory for individual step screenshots
        this.tempDir = path.join(testInfo.outputDir, 'temp-screenshots');
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Captures a screenshot of the current page state.
     * @param name - Descriptive name for the step (e.g., 'login-modal-empty')
     */
    async captureStep(name: string) {
        const screenshotPath = path.join(this.tempDir, `${this.screenshots.length + 1}-${name}.png`);
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        this.screenshots.push(screenshotPath);
        console.log(`Captured step: ${name} -> ${screenshotPath}`);
    }

    /**
     * Stitches collected screenshots into a single horizontal image on a white background.
     * @param outputFilename - Name of the final file (e.g., 'login-tutorial.png')
     */
    async stitch(outputFilename: string) {
        if (this.screenshots.length === 0) {
            console.warn('No screenshots to stitch.');
            return;
        }

        // Generate HTML content embedding images as base64
        const imagesHtml = this.screenshots.map((src, index) => {
            const bitmap = fs.readFileSync(src);
            const base64 = Buffer.from(bitmap).toString('base64');
            const imgData = `data:image/png;base64,${base64}`;

            let arrow = '';
            if (index < this.screenshots.length - 1) {
                arrow = `<div style="font-size: 60px; color: #333; margin: 0 40px;">➜</div>`;
            }

            return `
                <div style="display: flex; flex-direction: column; align-items: center; margin: 20px;">
                    <img src="${imgData}" style="max-height: 600px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; border-radius: 12px;">
                    <div style="margin-top: 10px; font-family: sans-serif; color: #666; font-size: 14px;">Step ${index + 1}</div>
                </div>
                ${arrow}
             `;
        }).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        background-color: white;
                        display: flex;
                        flex-direction: row;
                        align-items: center;
                        justify-content: center;
                        padding: 60px;
                        margin: 0;
                        width: fit-content;
                        min-width: 100vw;
                        min-height: 100vh;
                    }
                </style>
            </head>
            <body>
                ${imagesHtml}
            </body>
            </html>
        `;

        // Render the stitched HTML
        await this.page.setContent(htmlContent);

        // Ensure output directory exists
        const outputDir = path.resolve(process.cwd(), 'playwright/screenshots');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const finalPath = path.join(outputDir, outputFilename);

        // Capture the full stitched page
        await this.page.screenshot({ path: finalPath, fullPage: true });
        console.log(`✅ Stitched tutorial screenshot saved to: ${finalPath}`);
    }
}
