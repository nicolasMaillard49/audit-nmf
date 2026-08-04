/**
 * Rend le rapport HTML en PDF A4 + une capture PNG par page pour la QA visuelle.
 *   node report/render-pdf.mjs
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const HTML = resolve(HERE, "potentiel-gp-elec-2026.html");
const PDF = resolve(ROOT, "output/pdf/GP-elec-potentiel-google-ads.pdf");
const QA_DIR = resolve(ROOT, "output/qa");
mkdirSync(resolve(ROOT, "output/pdf"), { recursive: true });
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
await new Promise((r) => setTimeout(r, 900));

/* 1. aucune image cassee */
const broken = await page.evaluate(() =>
  [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute("src"))
);
if (broken.length) {
  console.error("IMAGES NON CHARGEES :\n  " + broken.join("\n  "));
  await browser.close();
  process.exit(1);
}

/* 2. aucun debordement vertical dans une page A4 */
const overflow = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("section.page").forEach((s, i) => {
    const limit = s.clientHeight - parseFloat(getComputedStyle(s).paddingBottom);
    let max = 0;
    const top = s.getBoundingClientRect().top;
    s.querySelectorAll("*").forEach((el) => {
      /* le pied de page et les mentions de couverture sont positionnes en absolu
         hors de la zone de contenu : eux et leurs descendants sont hors controle */
      if (el.closest(".footer, .cover-facts, .cover-ring, .cover-photo")) return;
      max = Math.max(max, el.getBoundingClientRect().bottom - top);
    });
    if (max > limit) out.push({ page: i + 1, depassement: Math.round(max - limit) + "px" });
  });
  return out;
});

const count = await page.evaluate(() => document.querySelectorAll("section.page").length);

await page.pdf({
  path: PDF,
  preferCSSPageSize: true,
  printBackground: true,
  margin: { top: 0, bottom: 0, left: 0, right: 0 },
});
console.log(`PDF   : ${PDF}`);
console.log(`Pages : ${count}`);

for (let i = 0; i < count; i++) {
  const el = await page.$(`section.page:nth-of-type(${i + 1})`);
  await el.screenshot({ path: resolve(QA_DIR, `page-${String(i + 1).padStart(2, "0")}.png`) });
}
console.log(`QA    : ${count} captures dans ${QA_DIR}`);

if (overflow.length) {
  console.error("\nDEBORDEMENTS DETECTES :");
  for (const o of overflow) console.error(`  page ${o.page} : ${o.depassement}`);
} else {
  console.log("Debordement : aucun");
}

await browser.close();
