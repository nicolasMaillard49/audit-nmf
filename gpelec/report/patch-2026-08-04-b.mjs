/**
 * Seconde passe : les chiffres du 31/07 restes hors des blocs traites par
 * patch-2026-08-04.mjs (couverture, synthese, annexes, commentaires SVG).
 * Repere par report/scan-perimes.mjs.
 *
 *   node report/patch-2026-08-04-b.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const T = "audit-gp-elec-2026.html";
const C = "potentiel-gp-elec-2026.html";
/* U+00A0 insecable et U+202F fine insecable, poses par fix-typo.mjs : on les
   aplatit pour chercher du texte, fix-typo les repose apres coup. Les ecrire
   en echappement, jamais en litteral — un litteral se perd a la copie. */
const plat = (s) => s.replace(/\r\n/g, "\n").replace(/[  ]/g, " ");
const src = Object.fromEntries([T, C].map((f) => [f, plat(readFileSync(resolve(HERE, f), "utf8"))]));

const P = [
  /* ---------- version technique ---------- */
  [T, "Plafond utile connu : 750 €/mois en pointe.", "Plafond utile connu : 292 €/mois en enchère plafonnée."],
  [T, "des 121 visites", "des 133 visites"],
  [T, "La liste complète des 66 mots-clés", "La liste complète des 73 mots-clés"],

  /* ---------- version commerciale ---------- */
  [C, "66 mots-clés analysés · 30 prévisions budgétaires", "73 mots-clés analysés · 30 prévisions budgétaires"],
  [C, "recherches mensuelles cumulées sur les 62 mots-clés retenus", "recherches mensuelles cumulées sur les 69 mots-clés retenus"],
  [C, '<strong class="tabular">754 €</strong>', '<strong class="tabular">292 €</strong>'],
  [C, "121 clics attendus à 1,49 €.", "133 clics attendus à 1,49 €."],
  [C, "<strong>Ne pas dépasser 750 € par mois.</strong>", "<strong>Ne pas dépasser 292 € par mois.</strong>"],
  [C, "Restent 62 lignes canoniques", "Restent 69 lignes canoniques"],
  [C, "environ 750 € par mois en pointe", "environ 292 € par mois en enchère plafonnée"],
  [C, "Le plafond utile est connu d'avance : 750 € mensuels en pointe.", "Le plafond utile est connu d'avance : 292 € mensuels en enchère plafonnée."],
  /* la famille climatisation, recomptee sur le portefeuille v2 */
  [C, "pèse 490 recherches mensuelles à elle seule", "pèse 1 020 recherches mensuelles à elle seule"],
  [C, "Les 490 recherches mensuelles de cette famille", "Les 1 020 recherches mensuelles de cette famille"],
  /* commentaires du graphique de derive, restes sur les valeurs du 31/07 */
  [C, "<!-- Présence : 1,56 -> 2,82 -> 4,04 -> 4,04 -->", "<!-- Présence : 1,18 -> 2,08 -> 3,54 -> 3,78 -->"],
  [C, "<!-- Haut de page : 1,63 constant -->", "<!-- Haut de page : 1,49 constant -->"],
  [C, "<!-- Domination : 2,11 constant -->", "<!-- Domination : 1,92 constant -->"],
  /* deux points intermediaires oublies par la premiere passe */
  [C, '<circle class="point-generic" cx="260" cy="116" r="4">', '<circle class="point-generic" cx="260" cy="120" r="4">'],
  [C, '<circle class="point-generic" cx="450" cy="116" r="4">', '<circle class="point-generic" cx="450" cy="120" r="4">'],
];

let erreurs = 0;
for (const [f, cherche, remplace] of P) {
  const n = src[f].split(cherche).length - 1;
  if (n !== 1) { erreurs++; console.log(`ECART  ${f}  ${n} occurrence(s)  ::  ${cherche.slice(0, 80)}`); continue; }
  src[f] = src[f].split(cherche).join(remplace);
}
if (erreurs) { console.log(`\n${erreurs} ecart(s) — aucun fichier ecrit.`); process.exit(1); }
for (const f of [T, C]) writeFileSync(resolve(HERE, f), src[f]);
console.log(`${P.length} substitutions appliquees.`);
