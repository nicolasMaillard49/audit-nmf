/** Planche-contact des 12 pages rendues → output/qa/contact-sheet.png */
import puppeteer from "puppeteer-core";
import { readdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const QA = resolve(HERE, "../output/qa");
const pages = readdirSync(QA).filter((f) => /^page-\d+\.png$/.test(f)).sort();
const imgs = pages.map((f) => `<figure><img src="${f}"><figcaption>${f}</figcaption></figure>`).join("");
const html = `<!doctype html><html><head><style>
body{margin:0;background:#fff;font-family:Consolas,monospace}
main{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:12px;width:1800px}
figure{margin:0}img{width:100%;display:block;border:1px solid #999}
figcaption{font-size:10px;text-align:center;padding:2px}
</style></head><body><main>${imgs}</main></body></html>`;

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--disable-gpu", "--no-sandbox", "--allow-file-access-from-files"],
});
const sheetHtml = resolve(QA, "contact-sheet.html");
writeFileSync(sheetHtml, html, "utf8");
const page = await browser.newPage();
await page.setViewport({ width: 1824, height: 2000, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(sheetHtml).href, { waitUntil: "networkidle0" });
await page.screenshot({ path: resolve(QA, "contact-sheet.png"), fullPage: true });
await browser.close();
console.log("contact-sheet OK");
