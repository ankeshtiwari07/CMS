import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));

const BASE = "https://cms.34-14-150-134.sslip.io";
const EMAIL = "admin@humain.sa";
const PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const OUT = `${HERE}/shots/`;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitReply(page, timeout = 70000) {
  // wait until streaming finished: a Retry action row present and no spinner text
  await page.waitForFunction(
    () => {
      const b = document.body.innerText;
      return b.includes("Retry") && !b.includes("Generating with") && !b.includes("Thinking…");
    },
    { timeout },
  ).catch(() => {});
  await sleep(1200);
}

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--window-size=1480,940"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

async function shot(name, full = false) {
  await page.screenshot({ path: OUT + name, fullPage: full });
  console.log("captured", name);
}

try {
  // 1) Login page
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(800);
  await shot("01-login.png");

  // authenticate (sets the httpOnly session cookie in the browser context)
  const status = await page.evaluate(async (c) => {
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(c) });
    return r.status;
  }, { email: EMAIL, password: PASSWORD });
  console.log("login status", status);

  // 2) Studio landing (logged in)
  await page.goto(`${BASE}/studio`, { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(1800);
  await shot("02-studio.png");

  // 3) Conversational reply (Claude-like natural message + action row)
  await page.click("#studio-prompt");
  await page.type("#studio-prompt", "What can you help me create? Give me a short rundown.");
  await page.keyboard.press("Enter");
  await waitReply(page);
  await shot("03-chat.png", true);

  // 4) Website build (flagship working feature — live preview)
  await page.goto(`${BASE}/studio`, { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(1200);
  await page.click("#studio-prompt");
  await page.type("#studio-prompt", "Build a high-impact landing page now for the HUMAIN AI Summit in Riyadh, audience enterprise executives, in English. Do not ask questions — build it.");
  await page.keyboard.press("Enter");
  await page.waitForSelector('iframe[title="Built site preview"]', { timeout: 150000 }).catch(() => console.log("no site iframe"));
  await sleep(2500);
  await shot("04-website.png", true);

  // 5) Design System (prompt-driven theme)
  await page.goto(`${BASE}/design`, { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(1800);
  await shot("05-design.png", true);

  // 6) Brand Studio (recommend → view → publish/download)
  await page.goto(`${BASE}/brand`, { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(1800);
  await shot("06-brand.png", true);
} catch (e) {
  console.error("capture error:", e?.message || e);
} finally {
  await browser.close();
}
console.log("DONE");
