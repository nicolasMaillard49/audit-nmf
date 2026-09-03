/**
 * Lighthouse local (Chrome installe) sur les pages cles, mobile + desktop.
 *   node tools/lh.mjs   (depuis gpelec/)
 * Ecrit data/lighthouse.json (resume) et data/lh-raw-<page>-<strategy>.json
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(HERE, "..", "data");

const TARGETS = {
  accueil: "https://gp-elec-49.com/",
  "mentions-legales": "https://gp-elec-49.com/mentions-legales",
};

const chrome = await chromeLauncher.launch({
  chromePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
});

const out = {};
for (const [name, url] of Object.entries(TARGETS)) {
  for (const strategy of ["mobile", "desktop"]) {
    process.stdout.write(`${name.padEnd(11)} ${strategy.padEnd(8)} ... `);
    const cfg =
      strategy === "desktop"
        ? { extends: "lighthouse:default", settings: { formFactor: "desktop", screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } } }
        : { extends: "lighthouse:default", settings: { formFactor: "mobile" } };
    try {
      const r = await lighthouse(url, { port: chrome.port, output: "json", logLevel: "error" }, cfg);
      const lh = r.lhr;
      const a = lh.audits;
      const num = (k) => a[k]?.numericValue ?? null;
      const disp = (k) => a[k]?.displayValue ?? null;
      const res = {
        url, strategy,
        scores: {
          performance: Math.round((lh.categories.performance?.score ?? 0) * 100),
          seo: Math.round((lh.categories.seo?.score ?? 0) * 100),
          accessibility: Math.round((lh.categories.accessibility?.score ?? 0) * 100),
          bestPractices: Math.round((lh.categories["best-practices"]?.score ?? 0) * 100),
        },
        metrics: {
          FCP: disp("first-contentful-paint"), FCPms: Math.round(num("first-contentful-paint") ?? 0),
          LCP: disp("largest-contentful-paint"), LCPms: Math.round(num("largest-contentful-paint") ?? 0),
          TBT: disp("total-blocking-time"), TBTms: Math.round(num("total-blocking-time") ?? 0),
          CLS: disp("cumulative-layout-shift"), CLSval: num("cumulative-layout-shift"),
          SI: disp("speed-index"), SIms: Math.round(num("speed-index") ?? 0),
          TTFBms: Math.round(num("server-response-time") ?? 0),
        },
        opportunities: Object.values(a)
          .filter((x) => x.details?.type === "opportunity" && (x.numericValue ?? 0) > 0)
          .map((x) => ({ id: x.id, title: x.title, savingsMs: Math.round(x.numericValue), displayValue: x.displayValue }))
          .sort((p, q) => q.savingsMs - p.savingsMs),
        failed: Object.values(a)
          .filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode === "binary")
          .map((x) => ({ id: x.id, title: x.title, displayValue: x.displayValue })),
        diagnostics: {
          totalBytes: num("total-byte-weight"),
          requests: a["network-requests"]?.details?.items?.length ?? null,
          domSize: num("dom-size"),
          unusedCssMs: num("unused-css-rules"),
          unusedJsMs: num("unused-javascript"),
          renderBlockingMs: num("render-blocking-resources"),
          modernImagesMs: num("modern-image-formats"),
        },
      };
      out[`${name}-${strategy}`] = res;
      writeFileSync(resolve(DATA, `lh-raw-${name}-${strategy}.json`), JSON.stringify(lh));
      console.log(`perf ${String(res.scores.performance).padStart(3)} | seo ${String(res.scores.seo).padStart(3)} | a11y ${String(res.scores.accessibility).padStart(3)} | bp ${String(res.scores.bestPractices).padStart(3)} | LCP ${res.metrics.LCP} | TBT ${res.metrics.TBT} | CLS ${res.metrics.CLS}`);
    } catch (e) {
      console.log("ERREUR " + e.message);
      out[`${name}-${strategy}`] = { error: e.message };
    }
  }
}

await chrome.kill();
writeFileSync(resolve(DATA, "lighthouse.json"), JSON.stringify(out, null, 2));
console.log("\ndata/lighthouse.json ecrit.");
