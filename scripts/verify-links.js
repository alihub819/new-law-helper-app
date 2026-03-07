import { chromium } from 'playwright';

async function verifyLinks() {
    console.log("🔍 Starting Link Verification...");
    const APP_URL = process.env.APP_URL || 'http://localhost:5000';

    const browser = await chromium.launch();
    const page = await browser.newPage();

    const visited = new Set();
    const queue = [APP_URL];
    const brokenLinks = [];

    console.log(`Checking links starting from ${APP_URL}`);

    while (queue.length > 0) {
        const url = queue.shift();
        if (visited.has(url)) continue;
        visited.add(url);

        try {
            const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
            const status = response.status();

            console.log(`${status === 200 ? '✅' : '❌'} [${status}] ${url}`);

            if (status >= 400) {
                brokenLinks.push({ url, status });
                continue;
            }

            // Only crawl internal links
            if (url.startsWith(APP_URL)) {
                const links = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('a[href]'))
                        .map(a => a.href)
                        .filter(href => href.startsWith(window.location.origin));
                });

                for (const link of links) {
                    // Remove hash to avoid duplicates like /#pricing
                    const cleanLink = link.split('#')[0];
                    if (!visited.has(cleanLink) && !queue.includes(cleanLink)) {
                        queue.push(cleanLink);
                    }
                }
            }

        } catch (error) {
            console.error(`❌ Error visiting ${url}:`, error.message);
            brokenLinks.push({ url, error: error.message });
        }
    }

    console.log("\n📊 Link Verification Summary:");
    console.log(`Total Pages Checked: ${visited.size}`);
    console.log(`Broken Links: ${brokenLinks.length}`);

    if (brokenLinks.length > 0) {
        console.log("\n❌ Broken Links Found:");
        brokenLinks.forEach(link => {
            console.log(`- ${link.url} (${link.status || link.error})`);
        });
        process.exit(1);
    } else {
        console.log("✅ All links are working correctly!");
    }

    await browser.close();
}

verifyLinks().catch(console.error);
