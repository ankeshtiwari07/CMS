import puppeteer from "puppeteer";
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));

const BASE = "https://cms.34-14-150-134.sslip.io";
const EMAIL = "admin@humain.sa";
const PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const OUT = `${HERE}/shots/`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitText(page, needle, timeout = 100000) {
  await page.waitForFunction((n) => document.body.innerText.includes(n), { timeout }, needle).catch(() => console.log("timeout waiting:", needle));
  await sleep(1200);
}

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
const shot = async (n, full = false) => { await page.screenshot({ path: OUT + n, fullPage: full }); console.log("captured", n); };

try {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.evaluate(async (c) => { await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(c) }); }, { email: EMAIL, password: PASSWORD });

  // Tighter Design crop (top fold: AI box + live preview)
  await page.goto(`${BASE}/design`, { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(1800);
  await shot("05-design.png"); // viewport only → tighter, sharper

  // Tighter Brand crop (recommend panel)
  await page.goto(`${BASE}/brand`, { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(1500);
  await shot("06-brand.png");

  // Content card journey (build + publish)
  await page.goto(`${BASE}/studio`, { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(1000);
  await page.click("#studio-prompt");
  await page.type("#studio-prompt", "Write a short blog post about sovereign AI in Saudi Arabia and build it as a card now. Do not ask questions.");
  await page.keyboard.press("Enter");
  await waitText(page, "Publish to");
  await shot("07-content.png", true);

  // Video journey (script + render control)
  await page.goto(`${BASE}/studio`, { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(1000);
  await page.click("#studio-prompt");
  await page.type("#studio-prompt", "Create a 20-second teaser video for the HUMAIN AI Summit now. Produce the script and storyboard. Do not ask questions.");
  await page.keyboard.press("Enter");
  await waitText(page, "Render video");
  await shot("08-video.png", true);

  // Projects journey
  await page.goto(`${BASE}/projects`, { waitUntil: "networkidle0", timeout: 60000 }).catch(() => {});
  await sleep(1800);
  await shot("09-projects.png");
} catch (e) {
  console.error("capture2 error:", e?.message || e);
} finally {
  await browser.close();
}
console.log("DONE");
