/**
 * Captures de preuve pour l'audit GP elec (emulation mobile reelle).
 *   node tools/capture.mjs   (depuis gpelec/)
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(HERE, "..", "shots");
mkdirSync(DIR, { recursive: true });

const UA_MOBILE =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--disable-gpu", "--hide-scrollbars", "--no-sandbox"],
});

async function shot(name, url, { mobile, w, h, wait = 4000, full = false, scrollTo = null }) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  if (mobile) await page.setUserAgent(UA_MOBILE);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 }).catch(() => {});
  if (scrollTo) {
    await page.evaluate((sel) => {
      const el = [...document.querySelectorAll("h2,h3,section")].find((n) => n.textContent.replace(/\s+/g, " ").includes(sel));
      if (el) el.scrollIntoView({ block: "center" });
    }, scrollTo);
    await new Promise((r) => setTimeout(r, 1200));
  }
  await new Promise((r) => setTimeout(r, wait));
  await page.screenshot({ path: resolve(DIR, `${name}.png`), fullPage: full });
  console.log(`  ${name.padEnd(24)} ${url}${scrollTo ? "  @" + scrollTo : ""}`);
  await page.close();
}

const U = "https://gp-elec-49.com/";
await shot("desktop-home", U, { mobile: false, w: 1440, h: 900 });
await shot("desktop-full", U, { mobile: false, w: 1440, h: 900, full: true });
await shot("mobile-home", U, { mobile: true, w: 390, h: 844 });
await shot("mobile-full", U, { mobile: true, w: 390, h: 844, full: true });
await shot("desktop-apropos", U, { mobile: false, w: 1440, h: 900, scrollTo: "familiale" });
await shot("desktop-services", U, { mobile: false, w: 1440, h: 900, scrollTo: "savoir-faire" });
await shot("desktop-contact", U, { mobile: false, w: 1440, h: 900, scrollTo: "votre projet" });
await shot("mobile-contact", U, { mobile: true, w: 390, h: 844, scrollTo: "votre projet" });
await shot("desktop-mentions", U + "mentions-legales", { mobile: false, w: 1440, h: 900, full: true });

await browser.close();
console.log("Termine.");
