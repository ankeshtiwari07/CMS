import puppeteer from "puppeteer";
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));

const BASE = "https://cms.34-14-150-134.sslip.io";
const OUT = `${HERE}/shots/`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
try {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.evaluate(async (c) => { await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(c) }); },
    { email: "admin@humain.sa", password: process.env.SEED_ADMIN_PASSWORD });

  await page.goto(`${BASE}/brand`, { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(1200);
  await page.type('input[placeholder^="Industry"]', "Fintech for SMEs");
  await page.type('input[placeholder^="Target audience"]', "SME founders & finance leaders in Saudi Arabia");
  await page.type('input[placeholder^="Desired tone"]', "confident, trustworthy, modern");
  // click the "Recommend brand guideline" button
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => /Recommend brand guideline/i.test(x.textContent || ""));
    if (b) b.click();
  });
  // wait for the populated guideline view (its action bar shows "Download .md")
  await page.waitForFunction(() => document.body.innerText.includes("Download .md"), { timeout: 150000 }).catch(() => console.log("timeout: guideline not populated"));
  await sleep(2000);
  await page.screenshot({ path: OUT + "06-brand.png", fullPage: true });
  console.log("captured 06-brand.png (populated)");
} catch (e) {
  console.error("capture3 error:", e?.message || e);
} finally {
  await browser.close();
}
console.log("DONE");
