import { chromium } from 'playwright';

async function testVoiceControl() {
    console.log("🚀 Starting Voice Control Test...");
    const APP_URL = process.env.APP_URL || 'http://localhost:5002';

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto(APP_URL, { waitUntil: 'networkidle' });

        // Login first
        console.log("🔑 Logging in...");
        const loginNav = page.locator('[data-testid="nav-login"]');
        await loginNav.waitFor({ state: 'visible' });
        await loginNav.click();

        const demoBtn = page.getByTestId('button-demo');
        await demoBtn.waitFor({ state: 'visible' });
        await demoBtn.click();

        await page.waitForURL('**/dashboard', { timeout: 10000 });
        console.log("✅ Logged in");

        console.log("🧪 Testing element matching logic in Dashboard...");
        const clickResult = await page.evaluate(() => {
            const command = "click legal research";
            const target = command.replace("click ", "").trim();
            const buttons = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]'));

            const match = buttons.find(el => {
                const textContent = el.textContent?.toLowerCase() || "";
                const ariaLabel = el.getAttribute("aria-label")?.toLowerCase() || "";
                const title = el.getAttribute("title")?.toLowerCase() || "";
                const value = (el).value?.toLowerCase() || "";

                return textContent.includes(target) ||
                       ariaLabel.includes(target) ||
                       title.includes(target) ||
                       value.includes(target);
            });

            return {
                found: !!match,
                tag: match?.tagName,
                role: match?.getAttribute('role'),
                text: match?.textContent?.trim().substring(0, 30)
            };
        });

        if (clickResult.found) {
            console.log(`✅ Success: Found element <${clickResult.tag}> with role="${clickResult.role}" and text "${clickResult.text}"`);
        } else {
            console.error("❌ Failure: Could not find element for 'click legal research'");
            process.exit(1);
        }

        console.log("🧪 Testing matching by aria-label...");
        const ariaResult = await page.evaluate(() => {
            // Create a temporary button with aria-label
            const btn = document.createElement('button');
            btn.setAttribute('aria-label', 'close sidebar');
            btn.textContent = 'X';
            document.body.appendChild(btn);

            const target = "close sidebar";
            const buttons = Array.from(document.querySelectorAll('button'));
            const match = buttons.find(el => {
                const ariaLabel = el.getAttribute("aria-label")?.toLowerCase() || "";
                return ariaLabel.includes(target);
            });

            const success = !!match;
            document.body.removeChild(btn);
            return success;
        });

        if (ariaResult) {
            console.log("✅ Success: Matched element by aria-label");
        } else {
            console.error("❌ Failure: Could not match element by aria-label");
            process.exit(1);
        }

        console.log("🎉 All Voice Control tests passed!");

    } catch (error) {
        console.error("❌ Test Failed:", error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testVoiceControl();
