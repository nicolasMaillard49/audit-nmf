/**
 * Analyse SEO / structure / conformite de gp-elec-49.com.
 *   node tools/analyze.mjs   (depuis gpelec/)
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(HERE, "..", "data");
const P = resolve(DATA, "pages");
const site = JSON.parse(readFileSync(resolve(DATA, "site.json"), "utf8"));

const one = (h, re) => { const m = h.match(re); return m ? m[1].trim() : null; };
const all = (h, re) => [...h.matchAll(re)].map((m) => m[1]);
const strip = (s) => s.replace(/<[^>]+>/g, "").replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

const out = { pages: {}, jsonld: {}, checks: [] };
const add = (sev, axe, titre, detail) => out.checks.push({ sev, axe, titre, detail });

for (const f of readdirSync(P).filter((x) => x.endsWith(".html"))) {
  const h = readFileSync(resolve(P, f), "utf8");
  const imgs = [...h.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const text = h.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  out.pages[f] = {
    title: one(h, /<title[^>]*>([\s\S]*?)<\/title>/i),
    desc: one(h, /<meta[^>]+name="description"[^>]+content="([^"]*)"/i),
    canonical: one(h, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i),
    ogUrl: one(h, /<meta[^>]+property="og:url"[^>]+content="([^"]*)"/i),
    ogImage: one(h, /<meta[^>]+property="og:image"[^>]+content="([^"]*)"/i),
    twImage: one(h, /<meta[^>]+name="twitter:image"[^>]+content="([^"]*)"/i),
    hreflang: [...h.matchAll(/<link[^>]+hreflang="([^"]+)"[^>]+href="([^"]+)"/gi)].map((m) => `${m[1]} -> ${m[2]}`),
    robots: one(h, /<meta[^>]+name="robots"[^>]+content="([^"]*)"/i),
    keywords: one(h, /<meta[^>]+name="keywords"[^>]+content="([^"]*)"/i),
    viewport: one(h, /<meta[^>]+name="viewport"[^>]+content="([^"]*)"/i),
    lang: one(h, /<html[^>]+lang="([^"]*)"/i),
    h1: all(h, /<h1[^>]*>([\s\S]*?)<\/h1>/gi).map(strip),
    h2: all(h, /<h2[^>]*>([\s\S]*?)<\/h2>/gi).map(strip),
    h3: all(h, /<h3[^>]*>([\s\S]*?)<\/h3>/gi).map(strip),
    imgTotal: imgs.length,
    imgNoAlt: imgs.filter((t) => !/\balt=/.test(t)).length,
    imgEmptyAlt: imgs.filter((t) => /\balt=""/.test(t)).length,
    imgNoDims: imgs.filter((t) => !/\bwidth=/.test(t) || !/\bheight=/.test(t)).length,
    imgLazy: imgs.filter((t) => /loading="lazy"/.test(t)).length,
    words: text.split(" ").length,
    tel: [...new Set(all(h, /href="tel:([^"]+)"/gi))],
    mailto: [...new Set(all(h, /href="mailto:([^"?]+)/gi))],
    forms: (h.match(/<form\b/gi) || []).length,
    aPlaceholder: (h.match(/href="#"/gi) || []).length,
    gtag: /G-[A-Z0-9]{8,}/.test(h) ? (h.match(/G-[A-Z0-9]{8,}/) || [])[0] : null,
    gsc: /google-site-verification/.test(h),
    aComplete: (h.match(/\[À COMPLÉTER\]|\[A COMPLETER\]/gi) || []).length,
  };
}

/* ---------- JSON-LD ---------- */
const home = readFileSync(resolve(P, "home.html"), "utf8");
const blocks = [...home.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
blocks.forEach((b, i) => { try { out.jsonld[`bloc${i}`] = JSON.parse(b[1]); } catch (e) { out.jsonld[`bloc${i}`] = { PARSE_ERROR: String(e), raw: b[1].slice(0, 400) }; } });

/* ---------- controles cibles ---------- */
const H = out.pages["home.html"];
const V = site.variants;

if (V["https://www.gp-elec-49.com/"]?.status === 307 && /www\./.test(H.canonical ?? ""))
  add("P0", "SEO technique", "Canonical vers www alors que www redirige vers l'apex",
    `canonical = ${H.canonical} ; or https://www.gp-elec-49.com/ repond 307 -> https://gp-elec-49.com/`);

for (const [k, v] of [["og:url", H.ogUrl], ["og:image", H.ogImage], ["twitter:image", H.twImage]])
  if (/www\./.test(v ?? "")) add("P0", "SEO technique", `${k} pointe sur www (redirige en 307)`, v);

for (const hl of H.hreflang) if (/www\./.test(hl)) add("P1", "SEO technique", "hreflang pointe sur www", hl);

const rating = JSON.stringify(out.jsonld).match(/"ratingValue"\s*:\s*"?([\d.]+)"?[^}]*?"reviewCount"\s*:\s*"?(\d+)"?/)
  ?? JSON.stringify(out.jsonld).match(/"reviewCount"\s*:\s*"?(\d+)"?[^}]*?"ratingValue"\s*:\s*"?([\d.]+)"?/);
if (rating) add("P0", "Conformite", "aggregateRating declare dans le JSON-LD", `valeurs trouvees : ${rating[0]}`);
if (/Qualifelec/i.test(home)) add("P0", "Conformite", "Qualifelec revendique", "presence du terme dans la page / le JSON-LD");
if (H.aComplete) add("P0", "Conformite", `${H.aComplete} mention(s) [À COMPLÉTER] en page d'accueil`, "");

const ml = out.pages["mentions-legales.html"];
if (ml?.aComplete) add("P0", "Conformite", `${ml.aComplete} mention(s) [À COMPLÉTER] servies en production`, "page /mentions-legales");

if (site.roots["/merci"]?.status === 404) add("P1", "Conversion", "Page /merci absente (404)", "aucune page de confirmation apres envoi du formulaire");
if (H.mailto.length && !H.forms) add("P1", "Conversion", "Formulaire en mailto sans <form>", H.mailto.join(", "));
if (H.keywords) add("P2", "SEO", "meta keywords encore presente (ignoree par Google)", H.keywords.slice(0, 80));
if (H.aPlaceholder) add("P2", "Qualite", `${H.aPlaceholder} lien(s) href="#"`, "liens sans destination");
if (H.imgNoDims) add("P1", "Performance", `${H.imgNoDims} image(s) sans width/height`, "risque de decalage de mise en page (CLS)");
if (H.imgNoAlt) add("P1", "Accessibilite", `${H.imgNoAlt} image(s) sans attribut alt`, "");

const SEC = site.home.headers;
for (const k of ["x-frame-options", "x-content-type-options", "referrer-policy", "permissions-policy", "content-security-policy"])
  if (!SEC[k]) add("P2", "Securite", `En-tete ${k} absent`, "");

const jsBytes = site.assets.filter((a) => a.url.endsWith(".js")).reduce((s, a) => s + a.bytes, 0);
const imgBytes = site.assets.filter((a) => /\.(webp|jpe?g|png)$/.test(a.url)).reduce((s, a) => s + a.bytes, 0);
const fontBytes = site.assets.filter((a) => a.url.endsWith(".woff2")).reduce((s, a) => s + a.bytes, 0);
out.poids = { htmlBytes: site.home.bytes, jsBytes, imgBytes, fontBytes, totalBytes: site.home.bytes + jsBytes + imgBytes + fontBytes };

writeFileSync(resolve(DATA, "seo.json"), JSON.stringify(out, null, 2));

/* ---------- affichage ---------- */
console.log("=== ACCUEIL ===");
console.log(`title      (${H.title?.length}) ${H.title}`);
console.log(`desc       (${H.desc?.length}) ${H.desc}`);
console.log(`canonical  ${H.canonical}`);
console.log(`og:url     ${H.ogUrl}`);
console.log(`og:image   ${H.ogImage}`);
console.log(`hreflang   ${H.hreflang.join(" | ")}`);
console.log(`lang ${H.lang} | robots ${H.robots} | keywords ${H.keywords ? "OUI" : "non"} | GA4 ${H.gtag} | GSC ${H.gsc}`);
console.log(`H1 ${JSON.stringify(H.h1)}`);
console.log(`H2 (${H.h2.length}) ${JSON.stringify(H.h2)}`);
console.log(`H3 (${H.h3.length}) ${JSON.stringify(H.h3.slice(0, 14))}`);
console.log(`mots ${H.words} | images ${H.imgTotal} (sans alt ${H.imgNoAlt}, alt vide ${H.imgEmptyAlt}, sans dims ${H.imgNoDims}, lazy ${H.imgLazy})`);
console.log(`tel ${H.tel.join(",")} | mailto ${H.mailto.join(",")} | forms ${H.forms} | href="#" ${H.aPlaceholder}`);

console.log("\n=== MENTIONS LEGALES ===");
console.log(`title ${ml?.title} | robots ${ml?.robots} | mots ${ml?.words} | [À COMPLÉTER] ${ml?.aComplete}`);

console.log("\n=== JSON-LD ===");
console.log(JSON.stringify(out.jsonld, null, 1).slice(0, 3000));

console.log("\n=== POIDS ===");
console.log(out.poids);

console.log("\n=== CONSTATS ===");
for (const c of out.checks.sort((a, b) => a.sev.localeCompare(b.sev)))
  console.log(`  [${c.sev}] ${c.axe.padEnd(14)} ${c.titre}${c.detail ? "\n         " + c.detail : ""}`);
console.log("\ndata/seo.json ecrit.");
