/**
 * Captures d'ecran de preuve pour l'audit La Rencontre.
 * Emulation mobile reelle (UA + deviceScaleFactor + isMobile) via puppeteer-core.
 *   node capture.mjs
 */
import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const DIR = "D:/projets/audit/la-rencontre/shots";
const UA_MOBILE =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--disable-gpu", "--hide-scrollbars", "--no-sandbox"],
});

async function shot(name, url, { mobile, w, h, wait = 9000, full = false, skipSplash = true }) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  if (mobile) await page.setUserAgent(UA_MOBILE);
  if (skipSplash) {
    // Le splash est rendu cote SSR tant que le cookie de session est absent.
    await page.setCookie({ name: "site_splash_seen", value: "1", domain: "restaurantlarencontre.com", path: "/" });
  }
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, wait));
  const path = `${DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: full });
  console.log(`  ${name.padEnd(26)} ${url}`);
  await page.close();
}

await shot("desktop-home", "https://restaurantlarencontre.com/", { mobile: false, w: 1440, h: 900 });
await shot("desktop-menu", "https://restaurantlarencontre.com/menu", { mobile: false, w: 1440, h: 900 });
await shot("mobile-home", "https://restaurantlarencontre.com/", { mobile: true, w: 390, h: 844 });
await shot("mobile-reservation", "https://restaurantlarencontre.com/reservation", {
  mobile: true, w: 390, h: 844, wait: 12000,
});
await shot("desktop-reservation", "https://restaurantlarencontre.com/reservation", {
  mobile: false, w: 1440, h: 900, wait: 12000,
});

await browser.close();
console.log("Termine.");
