/**
 * Rend les TROIS PDF de l'audit, avec pour chacun :
 *   - controle des images cassees (bloquant)
 *   - controle de debordement de la zone imprimable A4, page par page (bloquant)
 *   - une capture PNG par page pour la relecture
 * Puis controle la concordance des chiffres partages entre les trois variantes.
 *
 *   node report/render-all.mjs
 */
import puppeteer from "puppeteer-core";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
mkdirSync(resolve(ROOT, "output/pdf"), { recursive: true });
mkdirSync(resolve(ROOT, "output/qa"), { recursive: true });

const VARIANTES = [
  { cle: "technique",  html: "audit-gp-elec-2026.html",     pdf: "GP-elec-audit-digital-google-ads.pdf", qa: "tech",   pagesAttendues: 15 },
  { cle: "commercial", html: "potentiel-gp-elec-2026.html", pdf: "GP-elec-potentiel-google-ads.pdf",     qa: "page",   pagesAttendues: 13 },
  { cle: "resume",     html: "proposition-gp-elec.html",    pdf: "Proposition-GP-elec-Campagne-Test.pdf", qa: "resume", pagesAttendues: 2 },
];

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--disable-gpu", "--hide-scrollbars", "--no-sandbox", "--allow-file-access-from-files"],
});

let echecs = 0;

for (const v of VARIANTES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1120, height: 1584, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(resolve(HERE, v.html)).href, { waitUntil: "networkidle0", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 900));

  const broken = await page.evaluate(() =>
    [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute("src"))
  );

  const overflow = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("section.page").forEach((s, i) => {
      const limit = s.clientHeight - parseFloat(getComputedStyle(s).paddingBottom);
      const top = s.getBoundingClientRect().top;
      let max = 0;
      s.querySelectorAll("*").forEach((el) => {
        if (el.closest(".footer, .cover-facts, .cover-ring, .cover-photo")) return;
        max = Math.max(max, el.getBoundingClientRect().bottom - top);
      });
      if (max > limit) out.push({ page: i + 1, px: Math.round(max - limit) });
    });
    return out;
  });

  const count = await page.evaluate(() => document.querySelectorAll("section.page").length);

  await page.pdf({
    path: resolve(ROOT, "output/pdf", v.pdf),
    preferCSSPageSize: true,
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  for (let i = 0; i < count; i++) {
    const el = await page.$(`section.page:nth-of-type(${i + 1})`);
    await el.screenshot({ path: resolve(ROOT, "output/qa", `${v.qa}-${String(i + 1).padStart(2, "0")}.png`) });
  }

  const okPages = count === v.pagesAttendues;
  const ok = !broken.length && !overflow.length && okPages;
  if (!ok) echecs++;

  console.log(`\n[${v.cle}] ${v.pdf}`);
  console.log(`  pages        : ${count}${okPages ? "" : `  ATTENDU ${v.pagesAttendues}`}`);
  console.log(`  images       : ${broken.length ? "CASSEES -> " + broken.join(", ") : "toutes chargees"}`);
  console.log(`  debordement  : ${overflow.length ? overflow.map((o) => `p${o.page} +${o.px}px`).join(", ") : "aucun"}`);
  console.log(`  captures QA  : ${count}`);
  await page.close();
}

await browser.close();

/* ---------- concordance des chiffres partages ---------- */
console.log("\n=== CONCORDANCE DES CHIFFRES ENTRE VARIANTES ===");
const textes = Object.fromEntries(
  VARIANTES.map((v) => [v.cle, readFileSync(resolve(HERE, v.html), "utf8").replace(/\u202f|\u00a0/g, " ")])
);

/* chaque cle : [libelle, motif, variantes ou le chiffre DOIT apparaitre] */
const PARTAGES = [
  ["recherches mensuelles", /3 000/, ["technique", "commercial", "resume"]],
  ["clics a 200 EUR",       /\b133\b/, ["technique", "commercial", "resume"]],
  ["CPC tenu",              /1,49 /,  ["technique", "commercial", "resume"]],
  /* le plafond ne figure plus dans le resume d'envoi : decision commerciale du 05/08.
     Il reste porte par la version commerciale (page "Preuve budgetaire") et la technique. */
  ["plafond d'inventaire",  /291,81/, ["technique", "commercial"]],
  ["volume electricien angers", /\b390\b/, ["technique", "commercial", "resume"]],
  ["ecart au CPC sectoriel", /×2,8/,  ["technique", "commercial"]],
  ["depense reelle a 200",  /197,40/, ["technique", "commercial"]],
  ["clics au plafond",      /\b196\b/, ["technique", "commercial"]],
  ["portefeuille canonique", /\b69\b/, ["technique", "commercial"]],
];

/* aucun chiffre de la passe du 31/07 ne doit survivre dans une variante */
const PERIMES = [
  ["volume 2 420",       /2 420/],
  ["CPC 1,63",           /1,63 ?€/],
  ["CPC 1,42",           /1,42 ?€/],
  ["plafond 754,34",     /754,34/],
  ["clics 187",          /\b187\b/],
  ["depense 213,73",     /213,[47][35]/],
  ["depense 325,37",     /325,37/],
  ["portefeuille 66/62", /\b(66 mots|62 lignes)\b/],
];

let divergences = 0;
for (const [libelle, motif, cibles] of PARTAGES) {
  const manquants = cibles.filter((c) => !motif.test(textes[c]));
  if (manquants.length) {
    divergences++;
    console.log(`  DIVERGENCE  ${libelle.padEnd(26)} absent de : ${manquants.join(", ")}`);
  } else {
    console.log(`  ok          ${libelle.padEnd(26)} present dans ${cibles.join(", ")}`);
  }
}

console.log("\n=== CHIFFRES PERIMES DE LA PASSE DU 31/07 ===");
for (const cle of ["technique", "commercial", "resume"]) {
  const restes = PERIMES.filter(([, re]) => re.test(textes[cle])).map(([l]) => l);
  if (restes.length) {
    divergences++;
    console.log(`  PERIME      ${cle} contient encore : ${restes.join(", ")}`);
  } else {
    console.log(`  ok          ${cle} — aucun chiffre du 31/07`);
  }
}

/* le resume et le commercial ne doivent porter aucune analyse negative */
console.log("\n=== ETANCHEITE DES VARIANTES CLIENT ===");
const INTERDITS = [/\bP0\b/, /\bP1\b/, /\bP2\b/, /score de pr[ée]paration/i, /no-go/i, /\[À COMPLÉTER\]/, /Qualifelec/i, /consentement/i];
for (const cle of ["commercial", "resume"]) {
  const trouves = INTERDITS.filter((re) => re.test(textes[cle])).map((re) => String(re));
  if (trouves.length) {
    divergences++;
    console.log(`  FUITE       ${cle} contient : ${trouves.join(", ")}`);
  } else {
    console.log(`  ok          ${cle} — aucune analyse negative du site`);
  }
}

console.log(
  `\n${echecs || divergences ? `ECHEC — ${echecs} variante(s) en defaut, ${divergences} probleme(s) de coherence` : "Les trois PDF sont conformes."}`
);
if (echecs || divergences) process.exit(1);
