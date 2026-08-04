/**
 * Typographie francaise sur les trois rapports : espace insecable avant l'euro
 * et le pourcent, espace fine insecable comme separateur de milliers, espace
 * insecable avant les ponctuations doubles.
 *
 * A relancer apres tout patch de chiffres : patch-2026-08-04*.mjs aplatit ces
 * espaces pour pouvoir chercher du texte, c'est ici qu'on les repose.
 *
 * ATTENTION — ne traiter QUE les noeuds de texte. Applique a la source brute,
 * la regle des milliers reecrit l'interieur des attributs SVG :
 *   viewBox="0 0 640 210"                 -> "0<fine>640" : le viewBox est invalide
 *   points="120,129 260,105 450,66"       -> "129<fine>260" : la polyligne disparait
 * Le defaut est silencieux (aucune erreur, le trace manque simplement) et ni le
 * controle de debordement ni le validateur de charte ne le voient. Il a coute un
 * cycle de rendu complet le 04/08.
 *
 *   node report/fix-typo.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FICHIERS = [
  "audit-gp-elec-2026.html",
  "potentiel-gp-elec-2026.html",
  "proposition-gp-elec.html",
];

const NBSP = " ";
const FINE = " ";
const ESP = "[   ]";
const n = (s, re) => (s.match(re) || []).length;

/** Applique fn au texte hors balises, et remet les espaces normales dans les balises. */
function surTexte(html, fn) {
  return html
    .split(/(<[^>]*>)/)
    .map((seg) => (seg.startsWith("<") && seg.endsWith(">")
      ? seg.replace(/[  ]/g, " ")   // repare une balise deja polluee
      : fn(seg)))
    .join("");
}

for (const f of FICHIERS) {
  const FILE = resolve(HERE, f);
  const h = readFileSync(FILE, "utf8");

  /* on ne touche pas au bloc <style> */
  const styleStart = h.indexOf("<style>");
  const styleEnd = h.indexOf("</style>") + 8;
  const head = h.slice(0, styleStart);
  const style = h.slice(styleStart, styleEnd);
  const body = h.slice(styleEnd);

  const apres = surTexte(body, (t) => t
    .replace(new RegExp(`(\\d)${ESP}(€|%)`, "g"), `$1${NBSP}$2`)
    .replace(new RegExp(`(\\d)${ESP}(\\d{3})\\b`, "g"), `$1${FINE}$2`)
    .replace(new RegExp(`${ESP}([;:!?])`, "g"), `${NBSP}$1`));

  writeFileSync(FILE, head + style + apres);

  const balisesSales = (apres.match(/<[^>]*>/g) || []).filter((t) => /[  ]/.test(t)).length;
  console.log(
    `${f.padEnd(30)} € / % ${String(n(apres, / (€|%)/g)).padStart(4)}` +
    `   milliers ${String(n(apres, / \d{3}/g)).padStart(3)}` +
    `   ponctuation ${String(n(apres, / [;:!?]/g)).padStart(3)}` +
    `   balises polluees ${balisesSales}` +
    `   ${body === apres ? "inchange" : "mis a jour"}`,
  );
}
