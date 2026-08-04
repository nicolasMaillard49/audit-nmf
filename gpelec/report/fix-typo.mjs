/**
 * Typographie francaise : espace insecable avant l'euro et le pourcent,
 * espace fine insecable comme separateur de milliers.
 *   node report/fix-typo.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(HERE, "potentiel-gp-elec-2026.html");
let h = readFileSync(FILE, "utf8");

/* on ne touche pas au bloc <style> */
const styleStart = h.indexOf("<style>");
const styleEnd = h.indexOf("</style>") + 8;
const head = h.slice(0, styleStart);
const style = h.slice(styleStart, styleEnd);
let body = h.slice(styleEnd);

const before = body;

/* 1. espace insecable avant € et % quand precede d'un chiffre */
body = body.replace(/(\d) (€|%)/g, "$1 $2");

/* 2. separateur de milliers : espace fine insecable */
body = body.replace(/(\d) (\d{3})\b/g, "$1 $2");

/* 3. espace insecable avant les ponctuations doubles */
body = body.replace(/ ([;:!?])/g, " $1");

writeFileSync(FILE, head + style + body);

const n = (s, re) => (s.match(re) || []).length;
console.log(`espaces insecables avant € / %   : ${n(body, / (€|%)/g)}`);
console.log(`separateurs de milliers fins     : ${n(body, / \d{3}/g)}`);
console.log(`ponctuations doubles protegees   : ${n(body, / [;:!?]/g)}`);
console.log(before === body ? "aucun changement" : "fichier mis a jour.");
