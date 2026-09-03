/**
 * Collecte technique du site GP ELEC (Pierre Guille) pour l'audit NMF.
 *   node tools/collect.mjs   (depuis gpelec/)
 * Ecrit data/site.json, data/pages/*.html
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(HERE, "..", "data");
mkdirSync(resolve(DATA, "pages"), { recursive: true });

const ORIGIN = "https://gp-elec-49.com";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

async function get(url, follow = true) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { headers: { "user-agent": UA }, redirect: follow ? "follow" : "manual" });
    const body = r.body ? await r.text() : "";
    return {
      url, finalUrl: r.url, status: r.status, ms: Date.now() - t0,
      bytes: Buffer.byteLength(body),
      location: r.headers.get("location"),
      headers: Object.fromEntries(r.headers.entries()), body,
    };
  } catch (e) {
    return { url, error: String(e), ms: Date.now() - t0 };
  }
}

/* ---------- 1. variantes de protocole / hote (sans suivre) ---------- */
const variants = {};
console.log("=== VARIANTES (redirections non suivies) ===");
for (const u of [
  "http://gp-elec-49.com/", "https://gp-elec-49.com/",
  "http://www.gp-elec-49.com/", "https://www.gp-elec-49.com/",
]) {
  const r = await get(u, false);
  variants[u] = { status: r.status, location: r.location, error: r.error };
  console.log(`  ${u.padEnd(32)} ${r.status ?? r.error}${r.location ? "  ->  " + r.location : ""}`);
}

/* ---------- 2. fichiers racine ---------- */
const roots = {};
console.log("\n=== FICHIERS RACINE ===");
for (const f of ["/robots.txt", "/sitemap.xml", "/favicon.ico", "/og-image.jpg", "/mentions-legales", "/merci", "/introuvable-xyz"]) {
  const r = await get(ORIGIN + f);
  roots[f] = { status: r.status, bytes: r.bytes, ct: r.headers?.["content-type"], body: r.status === 200 && /txt|xml/.test(r.headers?.["content-type"] ?? "") ? r.body?.slice(0, 3000) : null };
  console.log(`  ${f.padEnd(24)} ${r.status ?? r.error}  ${String(r.bytes ?? "").padStart(7)} o  ${r.headers?.["content-type"] ?? ""}`);
}

/* ---------- 3. page d'accueil ---------- */
const home = await get(ORIGIN + "/");
writeFileSync(resolve(DATA, "pages", "home.html"), home.body ?? "");
console.log(`\n=== ACCUEIL ===\n  ${home.status} · ${home.bytes} octets · ${home.ms} ms`);
console.log("  en-tetes:");
for (const [k, v] of Object.entries(home.headers ?? {})) console.log(`    ${k.padEnd(32)} ${String(v).slice(0, 90)}`);

/* ---------- 4. liens internes ---------- */
const links = [...(home.body ?? "").matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
const internal = [
  ...new Set(
    links
      .filter((h) => (h.startsWith("/") && !h.startsWith("//")) || h.includes("gp-elec-49.com"))
      .map((h) => (h.startsWith("http") ? h : ORIGIN + h))
      .filter((h) => !/\.(png|jpe?g|svg|webp|css|js|ico|woff2?)($|\?)/i.test(h))
      .map((h) => h.split("#")[0])
      .filter((h) => h && h !== ORIGIN)
  ),
];
console.log(`\n=== ${internal.length} PAGES INTERNES ===`);
const pages = [{ url: ORIGIN + "/", status: home.status, ms: home.ms, bytes: home.bytes }];
for (const u of internal) {
  const r = await get(u);
  pages.push({ url: u, status: r.status, ms: r.ms, bytes: r.bytes });
  const slug = (new URL(u).pathname.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "index").slice(0, 60);
  if (r.status === 200) writeFileSync(resolve(DATA, "pages", `${slug}.html`), r.body ?? "");
  console.log(`  ${String(r.status).padEnd(4)} ${String(r.ms).padStart(5)} ms ${String(r.bytes).padStart(7)} o  ${u}`);
}

/* ---------- 5. assets references ---------- */
const assets = [
  ...new Set(
    [...(home.body ?? "").matchAll(/(?:src|href)="([^"]+\.(?:png|jpe?g|webp|woff2|js|css|ico))"/gi)].map((m) =>
      m[1].startsWith("http") ? m[1] : ORIGIN + m[1]
    )
  ),
].slice(0, 60);
console.log(`\n=== ${assets.length} ASSETS ===`);
const assetInfo = [];
for (const a of assets) {
  const r = await get(a);
  assetInfo.push({ url: a, status: r.status, bytes: r.bytes, ct: r.headers?.["content-type"], cache: r.headers?.["cache-control"] });
  console.log(`  ${String(r.status).padEnd(4)} ${String(r.bytes).padStart(8)} o  ${a.replace(ORIGIN, "")}`);
}

writeFileSync(
  resolve(DATA, "site.json"),
  JSON.stringify({ origin: ORIGIN, collectedAt: new Date().toISOString(), variants, roots, home: { status: home.status, ms: home.ms, bytes: home.bytes, headers: home.headers }, pages, assets: assetInfo }, null, 2)
);
console.log("\ndata/site.json ecrit.");
