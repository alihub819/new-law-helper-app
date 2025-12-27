import { chromium } from 'playwright';

async function runAudit() {
    console.log("🚀 Starting Playwright Audit...");
    const APP_URL = process.env.APP_URL || 'http://localhost:5002';

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
        await page.goto(APP_URL, { waitUntil: 'networkidle' });

        const title = await page.title();
        const brandVisible = await page.locator('span:has-text("LawHelper")').first().isVisible();

        if (title.includes("LawHelper") || brandVisible) {
            addCheck("Landing Page Load", "PASS", `Title: ${title}, Brand Visible: ${brandVisible}`);
        } else {
            const body = await page.innerHTML('body');
            console.log("DEBUG: Page content length:", body.length);
            console.log("DEBUG: URL:", page.url());
            await page.screenshot({ path: 'audit-failure-landing.png' });
            addCheck("Landing Page Load", "FAIL", "LawHelper branding not found. See audit-failure-landing.png");
        }

        // 2. Auth Page Navigation
        await page.click('[data-testid="nav-login"]');
        await page.waitForURL('**/auth');
        addCheck("Auth Page Navigation", "PASS", "Successfully navigated to /auth");

        // 3. Demo Login Flow
        console.log("🔑 Testing Demo Login...");
        const demoBtn = page.getByTestId('button-demo');
        if (await demoBtn.isVisible()) {
            await demoBtn.click();
            await page.waitForURL('**/dashboard', { timeout: 10000 });
            addCheck("Demo Login", "PASS", "Successfully logged in via demo button to /dashboard");
        } else {
            addCheck("Demo Login", "FAIL", "Demo button [data-testid='button-demo'] not found");
        }

        // 4. Sidebar Navigation Checks
        const navItems = [
            { id: 'nav-dashboard', path: '/dashboard' },
            { id: 'nav-ai-search', path: '/ai-search' },
            { id: 'nav-document-analyzer', path: '/document-analyzer' },
            { id: 'nav-document-generation', path: '/document-generation/letters' },
            { id: 'nav-my-cases', path: '/my-cases' }
        ];

        for (const item of navItems) {
            const selector = `[data-testid="${item.id}"]`;
            const locator = page.locator(selector);

            try {
                await locator.waitFor({ state: 'visible', timeout: 5000 });
                await locator.scrollIntoViewIfNeeded();
                await locator.click();

                // AI search might redirect to a sub-path
                const expectedPath = item.path === '/ai-search' ? '/ai-search/legal-research' : item.path;
                await page.waitForURL(`**${expectedPath}`, { timeout: 7000 });
                addCheck(`Navigation: ${item.id}`, "PASS", `Navigated to ${expectedPath}`);
            } catch (e) {
                const isVisible = await locator.isVisible();
                addCheck(`Navigation: ${item.id}`, "FAIL", `Wait/Click failed. Visible: ${isVisible}. Error: ${e.message.split('\n')[0]}`);
            }
        }

        // 5. Test Case Search UI (Search Tab)
        console.log("🔍 Testing AI Search UI...");
        await page.goto(`${APP_URL}/ai-search/legal-research`, { waitUntil: 'networkidle' });

        // Ensure the search tab is active and visible
        const searchInput = page.locator('[data-testid="input-legal-query"]');
        try {
            await searchInput.waitFor({ state: 'visible', timeout: 10000 });
            await searchInput.fill("Test legal query for audit");
            addCheck("AI Search Input", "PASS", "Input field is interactive");
        } catch (e) {
            await page.screenshot({ path: 'audit-failure-search.png' });
            addCheck("AI Search Input", "FAIL", `Input field not found/visible. URL: ${page.url()}. See audit-failure-search.png`);
        }

        // 6. Check for Console Errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                auditReport.errors.push(`Console Error: ${msg.text()}`);
            }
        });

        console.log("\n📊 Audit Summary Written to audit-report.json");
        import('fs').then(fs => {
            fs.writeFileSync('audit-report.json', JSON.stringify(auditReport, null, 2));
        });

    } catch (error) {
        console.error("❌ Critical Audit Failure:", error);
        auditReport.errors.push(error.message);
    } finally {
        await browser.close();
    }
}

runAudit();
