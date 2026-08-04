/**
 * Recense les chiffres de la passe du 31/07 encore presents dans les rapports.
 *   node report/scan-perimes.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const MOTIFS = [
  ["volume 2 420", /2 420/],
  ["CPC 1,63", /1,63/], ["CPC 1,42", /1,42/], ["CPC 1,56", /1,56/],
  ["CPC 4,04", /4,04/], ["CPC 2,11", /2,11/], ["CPC 2,82", /2,82/], ["enchere 2,06", /2,06/],
  ["plafond 754", /754/], ["plafond 750", /750 ?.?€/],
  ["clics 187", /\b187\b/], ["clics 121", /\b121\b/], ["clics 127", /\b127\b/],
  ["clics 131", /\b131\b/], ["clics 175", /\b175\b/],
  ["depense 213,xx", /213,\d\d/], ["depense 325,37", /325,37/],
  ["66 mots-cles", /\b66 mots/], ["62 mots-cles", /\b62 mots/], ["62 lignes", /\b62 lignes/],
  ["20 exclusions", /\b20 exclusions/], ["ecart x2,5", /×2,5/],
  ["490 recherches", /\b490 recherches/],
];

for (const f of ["audit-gp-elec-2026.html", "potentiel-gp-elec-2026.html", "proposition-gp-elec.html"]) {
  const lignes = readFileSync(resolve(HERE, f), "utf8").replace(/[  ]/g, " ").split("\n");
  console.log(`\n=== ${f}`);
  let n = 0;
  lignes.forEach((l, i) => {
    const hit = MOTIFS.find(([, re]) => re.test(l));
    if (!hit) return;
    n++;
    console.log(`  L${String(i + 1).padStart(4)}  ${hit[0].padEnd(15)} ${l.trim().replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 105)}`);
  });
  if (!n) console.log("  aucun chiffre perime");
}
