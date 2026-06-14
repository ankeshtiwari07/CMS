import { chromium } from "@playwright/test";
const base = "https://cms.34-14-150-134.sslip.io";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
await page.request.post(`${base}/api/auth/login`, { data: { email: "admin@humain.sa", password: "Indiabulls@2081" } });

async function fromSection(path) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const btn = page.getByRole("button", { name: /HUMAIN home/i });
  const present = await btn.count();
  if (!present) { console.log(`from ${path.padEnd(16)} -> NO 'HUMAIN home' control ✗`); return; }
  await btn.first().click();
  await page.waitForTimeout(900);
  const url = new URL(page.url()).pathname;
  console.log(`from ${path.padEnd(16)} -> logo click -> ${url}  ${url==="/studio"?"✓":"✗"}`);
}

await fromSection("/cms");
await fromSection("/cms/manage?type=blog");

await browser.close();
console.log("done");
