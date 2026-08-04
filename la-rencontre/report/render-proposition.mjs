/** Rend la proposition 1 page en PDF + PNG de contrôle. */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const HTML = resolve(HERE, "proposition-campagne-test.html");
const PDF = resolve(ROOT, "output/pdf/Proposition-La-Rencontre-Campagne-Test.pdf");
mkdirSync(resolve(ROOT, "output/qa"), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--disable-gpu", "--hide-scrollbars", "--no-sandbox", "--allow-file-access-from-files"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1120, height: 1584, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(HTML).href, { waitUntil: "networkidle0", timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 500));
await page.pdf({ path: PDF, preferCSSPageSize: true, printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
const els = await page.$$("section.page");
for (let i = 0; i < els.length; i++) {
  await els[i].screenshot({ path: resolve(ROOT, `output/qa/proposition-${i + 1}.png`) });
}
await browser.close();
console.log(`PDF: ${PDF}`);
