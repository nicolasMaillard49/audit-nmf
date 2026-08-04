/**
 * Rend le rapport HTML en PDF A4 + une capture PNG par page pour la QA visuelle.
 *   node render-pdf.mjs
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const HTML = resolve(HERE, "audit-la-rencontre-2026.html");
const PDF = resolve(ROOT, "output/pdf/Audit-La-Rencontre-NMF-2026.pdf");
const QA_DIR = resolve(ROOT, "output/qa");
mkdirSync(QA_DIR, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--disable-gpu", "--hide-scrollbars", "--no-sandbox", "--allow-file-access-from-files"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1120, height: 1584, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(HTML).href, { waitUntil: "networkidle0", timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 800));

/* vérifier que toutes les images sont chargées */
const broken = await page.evaluate(() =>
  [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src)
);
if (broken.length) {
  console.error("IMAGES NON CHARGEES:\n" + broken.join("\n"));
  process.exit(1);
}

await page.pdf({
  path: PDF,
  preferCSSPageSize: true,
  printBackground: true,
  margin: { top: 0, bottom: 0, left: 0, right: 0 },
});
console.log(`PDF: ${PDF}`);

/* captures QA de chaque .page */
const count = await page.evaluate(() => document.querySelectorAll("section.page").length);
for (let i = 0; i < count; i++) {
  const el = await page.$(`section.page:nth-of-type(${i + 1})`);
  await el.screenshot({ path: resolve(QA_DIR, `page-${String(i + 1).padStart(2, "0")}.png`) });
}
console.log(`QA: ${count} pages capturées dans ${QA_DIR}`);

await browser.close();
