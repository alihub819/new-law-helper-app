import { chromium } from 'playwright';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function runAudit() {
    console.log("🚀 Starting AI-Powered Audit...");

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const APP_URL = process.env.APP_URL || 'http://localhost:5002';

    try {
        console.log(`🌐 Navigating to ${APP_URL}...`);
        await page.goto(APP_URL);

        // 1. Audit Landing Page
        console.log("📝 Auditing Landing Page...");
        const landingContent = await page.innerText('body');
        const landingScreenshot = await page.screenshot({ fullPage: true });

        const landingAnalysis = await auditWithAI("Landing Page", landingContent);
        console.log("✅ Landing Page Analysis:", landingAnalysis);

        // 2. Demo Login
        console.log("🔑 Performing Demo Login...");
        await page.goto(`${APP_URL}/auth`);
        const demoBtn = page.getByTestId('button-demo');
        if (await demoBtn.isVisible()) {
            await demoBtn.click();
        } else {
            // Fallback to finding by text if test-id is missing
            await page.click('button:has-text("Skip for Demo")');
        }
        await page.waitForURL('**/dashboard');
        console.log("🔓 Logged into Dashboard.");

        // 3. Audit Dashboard
        const dashboardContent = await page.innerText('body');
        const dashboardAnalysis = await auditWithAI("Dashboard", dashboardContent);
        console.log("✅ Dashboard Analysis:", dashboardAnalysis);

        // 4. Test AI Legal Search (Basic)
        console.log("🔍 Testing AI Legal Search...");
        await page.goto(`${APP_URL}/ai-search`);
        await page.fill('[data-testid="input-legal-query"]', 'What are the elements of negligence in California?');
        await page.click('[data-testid="button-search"]');

        // Wait for results
        await page.waitForSelector('[data-testid="search-results"]', { timeout: 30000 });
        const searchResults = await page.innerText('body');
        const searchAnalysis = await auditWithAI("AI Search Results", searchResults);
        console.log("✅ AI Search Analysis:", searchAnalysis);

        console.log("\n✨ Audit Complete!");

    } catch (error) {
        console.error("❌ Audit Failed:", error);
    } finally {
        await browser.close();
    }
}

async function auditWithAI(pageName, content) {
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: "You are an expert QA Engineer and Product Designer. Analyze the provided application content and verify it meets quality standards. Return a brief summary (max 3 sentences) of health and any issues found."
            },
            {
                role: "user",
                content: `Page: ${pageName}\n\nContent Excerpt:\n${content.substring(0, 5000)}`
            }
        ]
    });
    return response.choices[0].message.content;
}

runAudit();
