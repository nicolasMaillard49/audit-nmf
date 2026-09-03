/**
 * Captures sequentielles par palier de fenetre (desktop + mobile).
 *   node tools/capture2.mjs   (depuis gpelec/)
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

async function sequence(prefix, { mobile, w, h }) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  if (mobile) await page.setUserAgent(UA_MOBILE);
  await page.goto("https://gp-elec-49.com/", { waitUntil: "networkidle2", timeout: 60000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 3000));

  const total = await page.evaluate(() => document.body.scrollHeight);
  const steps = Math.min(9, Math.ceil(total / h));
  console.log(`${prefix}: hauteur ${total}px, ${steps} paliers de ${h}px`);

  for (let i = 0; i < steps; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), i * h);
    await new Promise((r) => setTimeout(r, 1400));
    await page.screenshot({ path: resolve(DIR, `${prefix}-${String(i + 1).padStart(2, "0")}.png`) });
  }

  /* zoom sur les chiffres de la section A propos */
  const box = await page.evaluate(() => {
    const el = [...document.querySelectorAll("*")].find((n) => /Google/i.test(n.textContent ?? "") && n.children.length < 4 && (n.textContent ?? "").length < 60);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + r.top - 250);
    return true;
  });
  if (box) {
    await new Promise((r) => setTimeout(r, 1400));
    await page.screenshot({ path: resolve(DIR, `${prefix}-avis.png`) });
    console.log(`  ${prefix}-avis.png (zone compteur d'avis)`);
  }
  await page.close();
}

await sequence("d", { mobile: false, w: 1440, h: 900 });
await sequence("m", { mobile: true, w: 390, h: 844 });

await browser.close();
console.log("Termine.");
