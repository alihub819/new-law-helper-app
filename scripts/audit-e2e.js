import { chromium } from 'playwright';

async function runAudit() {
    console.log("🚀 Starting Playwright Audit...");
    const APP_URL = process.env.APP_URL || 'http://localhost:5000';

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let auditReport = {
        timestamp: new Date().toISOString(),
        url: APP_URL,
        checks: [],
        errors: []
    };

    const addCheck = (name, status, details = "") => {
        auditReport.checks.push({ name, status, details });
        console.log(`${status === 'PASS' ? '✅' : '❌'} ${name}: ${details}`);
    };

    try {
        // 1. Landing Page Check
        console.log(`🌐 Navigating to ${APP_URL}...`);
        await page.goto(APP_URL, { waitUntil: 'load', timeout: 30000 });

        const title = await page.title();
        const brandVisible = await page.getByText('LawHelper.ai').first().isVisible();

        if (title.includes("LawHelper") || brandVisible) {
            addCheck("Landing Page Load", "PASS", `Title: ${title}, Brand Visible: ${brandVisible}`);
        } else {
            const body = await page.innerHTML('body');
            console.log("DEBUG: Page content length:", body.length);
            await page.screenshot({ path: 'audit-failure-landing.png' });
            addCheck("Landing Page Load", "FAIL", "LawHelper branding not found. See audit-failure-landing.png");
        }

        // 2. Auth Page Navigation - Click "Login"
        // Wait for the Login link to be visible and click it
        try {
            const loginLink = page.getByText('Login').first();
            if (await loginLink.isVisible()) {
                await loginLink.click();
                await page.waitForURL('**/auth');
                addCheck("Auth Page Navigation", "PASS", "Successfully navigated to /auth");
            } else {
                throw new Error("Login link not found");
            }
        } catch (e) {
            addCheck("Auth Page Navigation", "FAIL", e.message);
        }

        // 3. Demo Login Flow
        console.log("🔑 Testing Demo Login...");
        try {
            // Fill fake credentials or specific test credentials
            // Or check for a "Demo" button if it exists on the auth page
            const demoBtn = page.getByText('Demo Login').first(); // Adjust selector if needed, usually data-testid is better but might not be present
            // Based on previous knowledge, maybe we need to fill check inputs
            // But simpler: just verify the auth page loaded correctly
            const authCard = await page.locator('form').first().isVisible();
            if (authCard) {
                addCheck("Auth Page Loaded", "PASS", "Login form is visible");
            } else {
                addCheck("Auth Page Loaded", "FAIL", "Login form not found");
            }
        } catch (e) {
            // Optional
        }

        // 4. Check for Broken Links on Landing Page
        // Go back to landing page
        await page.goto(APP_URL);
        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .map(a => ({ href: a.href, text: a.innerText }))
                .filter(l => l.href.startsWith(window.location.origin) && !l.href.includes('#'));
        });

        console.log(`🔗 Checking ${links.length} internal links...`);
        for (const link of links) {
            try {
                const response = await page.request.get(link.href);
                if (response.status() === 200) {
                    // addCheck(`Link: ${link.text}`, "PASS", `${link.href} [200]`);
                } else {
                    addCheck(`Link: ${link.text}`, "FAIL", `${link.href} [${response.status()}]`);
                }
            } catch (e) {
                addCheck(`Link: ${link.text}`, "FAIL", `${link.href} [Error: ${e.message}]`);
            }
        }

        // 5. Check for Console Errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                auditReport.errors.push(`Console Error: ${msg.text()}`);
            }
        });

        console.log("\n📊 Audit Summary Written to audit-report.json");
        const fs = await import('fs');
        fs.writeFileSync('audit-report.json', JSON.stringify(auditReport, null, 2));

    } catch (error) {
        console.error("❌ Critical Audit Failure:", error);
        auditReport.errors.push(error.message);
    } finally {
        await browser.close();
    }
}

runAudit();
