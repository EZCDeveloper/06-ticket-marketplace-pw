import { Page } from '@playwright/test';

/**
 * Injects a visual indicator script into the browser context.
 * Useful for tutorial videos to highlight user interactions.
 */
export async function injectVisualIndicators(page: Page) {
    await page.addInitScript(() => {
        // Inject Styles
        const style = document.createElement('style');
        style.textContent = `
            .pw-indicator-focus {
                outline: 4px solid #00f2ff !important;
                outline-offset: 2px !important;
                box-shadow: 0 0 15px #00f2ff !important;
                transition: all 0.2s ease-in-out !important;
                z-index: 999998 !important;
            }
            .pw-indicator-typing {
                background-color: rgba(0, 242, 255, 0.1) !important;
                box-shadow: 0 0 20px 5px rgba(0, 242, 255, 0.7) !important;
            }
            .pw-click-pulse {
                position: fixed;
                width: 40px;
                height: 40px;
                border: 4px solid #00f2ff;
                border-radius: 50%;
                background-color: rgba(0, 242, 255, 0.4);
                pointer-events: none;
                z-index: 2147483647;
                transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                transform: translate(-50%, -50%) scale(0.5);
                opacity: 1;
                box-shadow: 0 0 15px rgba(0, 242, 255, 0.8);
            }
        `;
        document.head.appendChild(style);

        // Click Indicator (Pulsing Effect)
        window.addEventListener('mousedown', (event) => {
            const circle = document.createElement('div');
            circle.className = 'pw-click-pulse';
            circle.style.left = `${event.clientX}px`;
            circle.style.top = `${event.clientY}px`;
            document.body.appendChild(circle);

            requestAnimationFrame(() => {
                circle.style.transform = 'translate(-50%, -50%) scale(1.8)';
                circle.style.opacity = '0';
            });

            setTimeout(() => circle.remove(), 400);
        }, true);

        // Focus Indicator
        document.addEventListener('focusin', (event) => {
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                target.classList.add('pw-indicator-focus');
            }
        }, true);

        document.addEventListener('focusout', (event) => {
            const target = event.target as HTMLElement;
            target.classList.remove('pw-indicator-focus');
        }, true);

        // Typing Indicator
        document.addEventListener('input', (event) => {
            const target = event.target as HTMLElement;
            target.classList.add('pw-indicator-typing');
            setTimeout(() => target.classList.remove('pw-indicator-typing'), 300);
        }, true);
    });
}
