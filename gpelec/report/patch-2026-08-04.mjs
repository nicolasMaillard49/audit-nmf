/**
 * Reporte dans les trois rapports les chiffres de l extraction du 04/08.
 *
 * Chaque substitution declare le nombre d occurrences attendu par fichier.
 * Un ecart arrete le script : c est la seule protection contre un remplacement
 * qui toucherait un chiffre homonyme (« article L121-2 » contient 121).
 *
 *   node report/patch-2026-08-04.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const T = "audit-gp-elec-2026.html";
const C = "potentiel-gp-elec-2026.html";
const R = "proposition-gp-elec.html";
/* Normalisation d entree : le fichier commercial est deja passe par fix-typo.mjs,
   ses espaces avant € sont des U+00A0 et ses separateurs de milliers des U+202F.
   On travaille sur du texte plat, puis fix-typo.mjs repose la typographie. */
const plat = (s) => s.replace(/\r\n/g, "\n").replace(/[  ]/g, " ");
const src = Object.fromEntries([T, C, R].map((f) => [f, plat(readFileSync(resolve(HERE, f), "utf8"))]));
const DRY = process.argv.includes("--dry");

/* [fichiers, chercher, remplacer, occurrences attendues par fichier] */
const P = [
  /* ---------- volume du marche ---------- */
  [[T, C, R], "2 420", "3 000", { [T]: 5, [C]: 7, [R]: 1 }],
  [[T, C], "66 mots-clés soumis à Google, 62 lignes exploitables", "73 mots-clés soumis à Google, 69 lignes exploitables", { [T]: 1, [C]: 1 }],
  [[T], "66 requêtes soumises à l'API pour la zone", "73 requêtes soumises à l'API pour la zone", { [T]: 1 }],
  [[T], "Restent 62 lignes canoniques", "Restent 69 lignes canoniques", { [T]: 1 }],
  [[T, C], '<div class="stat tabular">66</div>', '<div class="stat tabular">73</div>', { [T]: 1, [C]: 1 }],
  [[T, C], '<div class="stat tabular">62</div>', '<div class="stat tabular">69</div>', { [T]: 1, [C]: 1 }],
  [[T, C], '<div class="stat tabular">20</div><div class="stat-label">exclusions motivées', '<div class="stat tabular">29</div><div class="stat-label">exclusions motivées', { [T]: 1, [C]: 1 }],

  /* ---------- CPC reel : 1,42 -> 1,49, ecart x2,5 -> x2,8 ---------- */
  [[T, C], "1,42 €", "1,49 €", { [T]: 4, [C]: 4 }],
  [[T, C], "×2,5", "×2,8", { [T]: 2, [C]: 2 }],
  [[T], 'Écart<br>×2,8', 'Écart<br>×2,8', { [T]: 1 }],
  /* la barre « mesure API » du graphique : 110 px par euro depuis x=150 */
  [[T, C], '<rect x="150" y="83" width="156" height="24"', '<rect x="150" y="83" width="164" height="24"', { [T]: 1, [C]: 1 }],
  [[T, C], '<text class="point-label" x="316" y="100"', '<text class="point-label" x="324" y="100"', { [T]: 1, [C]: 1 }],

  /* ---------- CPC tenu : 1,63 -> 1,49 ---------- */
  [[T, C, R], "1,63 €", "1,49 €", { [T]: 12, [C]: 15, [R]: 1 }],
  /* plafond d enchere : la mediane haut de page passe de 2,06 a 2,07 */
  [[T, C], "2,06 €", "2,07 €", { [T]: 2, [C]: 2 }],

  /* ---------- CPC des trois strategies ---------- */
  [[T, C], "<strong>CPC à 200 € :</strong> 1,56 €<br><strong>CPC à 1 000 € :</strong> 4,04 €",
           "<strong>CPC à 200 € :</strong> 1,18 €<br><strong>CPC à 1 000 € :</strong> 3,54 €", { [T]: 1, [C]: 1 }],
  [[T, C], "<strong>CPC à 200 € :</strong> 2,11 €<br><strong>CPC à 1 000 € :</strong> 2,11 €",
           "<strong>CPC à 200 € :</strong> 1,92 €<br><strong>CPC à 1 000 € :</strong> 1,92 €", { [T]: 1, [C]: 1 }],

  /* courbe de derive du CPC — y = 160 - cpc x 26,667 */
  [[T, C], '<polyline points="120,118 260,85 450,52 600,52"', '<polyline points="120,129 260,105 450,66 600,59"', { [T]: 1, [C]: 1 }],
  [[T, C], '<circle class="point-intent" cx="120" cy="118" r="4">', '<circle class="point-intent" cx="120" cy="129" r="4">', { [T]: 1, [C]: 1 }],
  [[T, C], '<circle class="point-intent" cx="260" cy="85"  r="4">', '<circle class="point-intent" cx="260" cy="105" r="4">', { [T]: 1, [C]: 1 }],
  [[T, C], '<circle class="point-intent" cx="450" cy="52"  r="4">', '<circle class="point-intent" cx="450" cy="66"  r="4">', { [T]: 1, [C]: 1 }],
  [[T, C], '<circle class="point-intent" cx="600" cy="52"  r="4">', '<circle class="point-intent" cx="600" cy="59"  r="4">', { [T]: 1, [C]: 1 }],
  [[T, C], '<text class="point-label" x="600" y="44" text-anchor="end">4,04 €</text>', '<text class="point-label" x="600" y="51" text-anchor="end">3,78 €</text>', { [T]: 1, [C]: 1 }],
  [[T, C], '<polyline points="120,116 260,116 450,116 600,116"', '<polyline points="120,120 260,120 450,120 600,120"', { [T]: 1, [C]: 1 }],
  [[T, C], '<circle class="point-generic" cx="120" cy="116" r="4">', '<circle class="point-generic" cx="120" cy="120" r="4">', { [T]: 1, [C]: 1 }],
  [[T, C], '<circle class="point-generic" cx="600" cy="116" r="4">', '<circle class="point-generic" cx="600" cy="120" r="4">', { [T]: 1, [C]: 1 }],
  [[T, C], '<text class="point-label" x="600" y="132" text-anchor="end">1,49 €</text>', '<text class="point-label" x="600" y="136" text-anchor="end">1,49 €</text>', { [T]: 1, [C]: 1 }],
  [[T, C], '<polyline points="120,104 260,104 450,104 600,104"', '<polyline points="120,109 260,109 450,109 600,109"', { [T]: 1, [C]: 1 }],
  [[T, C], '<circle class="point-exclude" cx="120" cy="104" r="4">', '<circle class="point-exclude" cx="120" cy="109" r="4">', { [T]: 1, [C]: 1 }],
  [[T, C], '<circle class="point-exclude" cx="600" cy="104" r="4">', '<circle class="point-exclude" cx="600" cy="109" r="4">', { [T]: 1, [C]: 1 }],
  [[T, C], '<text class="point-label" x="600" y="98" text-anchor="end">2,11 €</text>', '<text class="point-label" x="600" y="103" text-anchor="end">1,92 €</text>', { [T]: 1, [C]: 1 }],
  [[T, C], "Haut de page — CPC manuel 2,07 €", "Haut de page — CPC manuel 2,07 €", { [T]: 1, [C]: 1 }],

  /* ---------- clics a 200 EUR : 121 -> 133, 127 -> 167 ---------- */
  [[T], "elle achète six clics de plus que l'enchère plafonnée (127 contre 121) : négligeable. Mais dès\n      qu'on monte, son CPC dérive de 1,56 € à 4,04 €, quand l'enchère manuelle tient 1,49 € sans bouger.",
        "elle achète trente-quatre clics de plus que l'enchère plafonnée (167 contre 133), mais sur des\n      requêtes plus larges. Et dès qu'on monte, son CPC dérive de 1,18 € à 3,78 €, quand l'enchère\n      manuelle tient 1,49 € sans bouger.", { [T]: 1 }],
  [[C], "achète six clics de plus que l'enchère plafonnée (127 contre 121) : l'écart est négligeable.\n      Mais dès qu'on augmente le budget, son coût par clic dérive de 1,56 € à 4,04 €, tandis que\n      l'enchère manuelle tient 1,49 € sans bouger.",
        "achète trente-quatre clics de plus que l'enchère plafonnée (167 contre 133), mais sur des requêtes\n      plus larges. Et dès qu'on augmente le budget, son coût par clic dérive de 1,18 € à 3,78 €, tandis\n      que l'enchère manuelle tient 1,49 € sans bouger.", { [C]: 1 }],
  [[T, C, R], "200 € par mois, 121 visites", "200 € par mois, 133 visites", { [T]: 1, [C]: 1, [R]: 1 }],
  [[T, C, R], '<strong class="tabular">121</strong>', '<strong class="tabular">133</strong>', { [T]: 1, [C]: 1, [R]: 1 }],
  [[T], "À 1,49 €, les mêmes 200 € en achètent 121, soit assez pour mesurer un taux de",
        "À 1,49 €, les mêmes 200 € en achètent 133, soit assez pour mesurer un taux de", { [T]: 1 }],
  [[C], "À 1,49 €, les mêmes 200 € achètent 121 visites, soit un volume suffisant pour mesurer un taux de",
        "À 1,49 €, les mêmes 200 € achètent 133 visites, soit un volume suffisant pour mesurer un taux de", { [C]: 1 }],

  /* ---------- tableau « comparaison des paliers » ---------- */
  [[T, C], '<td class="num">197,40 €</td><td class="num">127</td><td class="num">1,56 €</td>\n      <td class="num">197,40 €</td><td class="num">121</td><td class="num">1,49 €</td>',
           '<td class="num">197,40 €</td><td class="num">167</td><td class="num">1,18 €</td>\n      <td class="num">197,40 €</td><td class="num">133</td><td class="num">1,49 €</td>', { [T]: 1, [C]: 1 }],
  [[T, C], '<td class="num">493,50 €</td><td class="num">175</td><td class="num">2,82 €</td>\n      <td class="num">213,73 €</td><td class="num">131</td><td class="num">1,49 €</td>',
           '<td class="num">493,50 €</td><td class="num">238</td><td class="num">2,08 €</td>\n      <td class="num">291,81 €</td><td class="num">196</td><td class="num">1,49 €</td>', { [T]: 1, [C]: 1 }],
  [[T, C], '<td class="num">754,34 €</td><td class="num">187</td><td class="num">4,04 €</td>\n      <td class="num">213,73 €</td><td class="num">131</td><td class="num">1,49 €</td>',
           '<td class="num">986,70 €</td><td class="num">278</td><td class="num">3,54 €</td>\n      <td class="num">291,81 €</td><td class="num">196</td><td class="num">1,49 €</td>', { [T]: 1, [C]: 1 }],
  [[T, C], '<td class="num">754,34 €</td><td class="num">187</td><td class="num">4,04 €</td>\n      <td class="num">213,45 €</td><td class="num">131</td><td class="num">1,49 €</td>',
           '<td class="num">1 055,80 €</td><td class="num">279</td><td class="num">3,78 €</td>\n      <td class="num">291,81 €</td><td class="num">196</td><td class="num">1,49 €</td>', { [T]: 1, [C]: 1 }],

  /* ---------- « pourquoi 200 et pas 500 » ---------- */
  [[T], "Passer de 200 € à 500 € en enchère plafonnée fait gagner <strong>dix clics par\n        mois</strong> (121 → 131) pour <strong>16 € de dépense réelle en plus</strong>. Le rendement\n        marginal s'effondre : l'inventaire est déjà presque entièrement acheté à 200 €.",
        "Passer de 200 € à 500 € en enchère plafonnée fait gagner <strong>63 clics par\n        mois</strong> (133 → 196) pour <strong>94 € de dépense réelle en plus</strong> — puis plus rien :\n        au-delà, la dépense reste figée à 291,81 €. C'est là que l'inventaire s'arrête.", { [T]: 1 }],
  [[C], "Passer de 200 € à 500 € en enchère plafonnée fait gagner\n        <strong>dix clics par mois</strong> (121 → 131) pour <strong>16 € de dépense réelle en plus</strong>.\n        Le rendement marginal s'effondre immédiatement : l'inventaire disponible sur votre zone est déjà\n        presque entièrement acheté à 200 €.",
        "Passer de 200 € à 500 € en enchère plafonnée fait gagner\n        <strong>63 clics par mois</strong> (133 → 196) pour <strong>94 € de dépense réelle en plus</strong>.\n        Puis plus rien : au-delà, la dépense reste figée à 291,81 €. C'est là que l'inventaire disponible\n        sur votre zone s'arrête.", { [C]: 1 }],
  [[T, C], "les 121 visites que 200 € achètent déjà", "les 133 visites que 200 € achètent déjà", { [T]: 1, [C]: 1 }],
  [[T, C], "Ce que 121 visites représentent", "Ce que 133 visites représentent", { [T]: 1, [C]: 1 }],
  [[T], "Sur trois mois, environ <strong>360 visites</strong>", "Sur trois mois, environ <strong>400 visites</strong>", { [T]: 1 }],
  [[C], "Sur trois mois, cela représente environ <strong>360 visites</strong>", "Sur trois mois, cela représente environ <strong>400 visites</strong>", { [C]: 1 }],

  /* ---------- page « preuve budgetaire » : le plafond change de strategie ---------- */
  [[T, C], "Au-delà de 754 €, Google encaisse la demande mais n'a plus rien à vendre.",
           "Au-delà de 292 €, Google encaisse la demande mais n'a plus rien à vendre.", { [T]: 1, [C]: 1 }],
  [[T], "Budgets croissants soumis jusqu'à 2 000 € par mois. À partir de 1 000 € demandés,\n    <strong>la dépense se fige à 754,34 € et les clics à 187</strong> — strictement identiques à\n    1 000 €, 1 500 € et 2 000 €.",
        "Budgets croissants soumis jusqu'à 2 000 € par mois. Sur la stratégie retenue — enchère manuelle\n    plafonnée — <strong>la dépense se fige à 291,81 € et les clics à 196</strong> dès 500 € demandés,\n    puis reste strictement identique à 750 €, 1 000 €, 1 500 € et 2 000 €.", { [T]: 1 }],
  [[C], "nous avons soumis des budgets croissants jusqu'à 2 000 € par mois. À partir de 1 000 € demandés,\n    <strong>la dépense se fige à 754,34 € et le nombre de clics à 187</strong> — strictement identiques\n    à 1 000 €, 1 500 € et 2 000 €.",
        "nous avons soumis des budgets croissants jusqu'à 2 000 € par mois. Sur la stratégie retenue —\n    l'enchère manuelle plafonnée — <strong>la dépense se fige à 291,81 € et le nombre de clics à 196</strong>\n    dès 500 € demandés, puis reste identique à 750 €, 1 000 €, 1 500 € et 2 000 €.", { [C]: 1 }],
  [[T], '<tr><td>200 €</td><td class="num">197,40 €</td><td class="num">127</td><td class="num">99 %</td><td>Chaque euro travaille</td></tr>\n    <tr><td>500 €</td><td class="num">493,50 €</td><td class="num">175</td><td class="num">99 %</td><td>Rendement décroissant</td></tr>\n    <tr class="emphasis"><td><strong>1 000 €</strong></td><td class="num">754,34 €</td><td class="num">187</td><td class="num">75 %</td><td><strong>Plafond atteint</strong></td></tr>\n    <tr><td>1 500 €</td><td class="num">754,34 €</td><td class="num">187</td><td class="num">50 %</td><td>Aucun gain</td></tr>\n    <tr><td>2 000 €</td><td class="num">754,34 €</td><td class="num">187</td><td class="num">38 %</td><td>Aucun gain</td></tr>',
        '<tr><td>200 €</td><td class="num">197,40 €</td><td class="num">133</td><td class="num">99 %</td><td>Chaque euro travaille</td></tr>\n    <tr><td>300 €</td><td class="num">291,81 €</td><td class="num">196</td><td class="num">97 %</td><td>Dernier palier utile</td></tr>\n    <tr class="emphasis"><td><strong>500 €</strong></td><td class="num">291,81 €</td><td class="num">196</td><td class="num">58 %</td><td><strong>Plafond atteint</strong></td></tr>\n    <tr><td>750 €</td><td class="num">291,81 €</td><td class="num">196</td><td class="num">39 %</td><td>Aucun gain</td></tr>\n    <tr><td>1 000 €</td><td class="num">291,81 €</td><td class="num">196</td><td class="num">29 %</td><td>Aucun gain</td></tr>', { [T]: 1 }],
  [[C], '<tr><td>200 €</td><td class="num">197,40 €</td><td class="num">127</td><td class="num">99 %</td><td>Chaque euro travaille</td></tr>\n    <tr><td>500 €</td><td class="num">493,50 €</td><td class="num">175</td><td class="num">99 %</td><td>Rendement déjà décroissant</td></tr>\n    <tr class="emphasis"><td><strong>1 000 €</strong></td><td class="num">754,34 €</td><td class="num">187</td><td class="num">75 %</td><td><strong>Plafond atteint</strong></td></tr>\n    <tr><td>1 500 €</td><td class="num">754,34 €</td><td class="num">187</td><td class="num">50 %</td><td>Aucun gain</td></tr>\n    <tr><td>2 000 €</td><td class="num">754,34 €</td><td class="num">187</td><td class="num">38 %</td><td>Aucun gain</td></tr>',
        '<tr><td>200 €</td><td class="num">197,40 €</td><td class="num">133</td><td class="num">99 %</td><td>Chaque euro travaille</td></tr>\n    <tr><td>300 €</td><td class="num">291,81 €</td><td class="num">196</td><td class="num">97 %</td><td>Dernier palier utile</td></tr>\n    <tr class="emphasis"><td><strong>500 €</strong></td><td class="num">291,81 €</td><td class="num">196</td><td class="num">58 %</td><td><strong>Plafond atteint</strong></td></tr>\n    <tr><td>750 €</td><td class="num">291,81 €</td><td class="num">196</td><td class="num">39 %</td><td>Aucun gain</td></tr>\n    <tr><td>1 000 €</td><td class="num">291,81 €</td><td class="num">196</td><td class="num">29 %</td><td>Aucun gain</td></tr>', { [C]: 1 }],
  [[T], "<strong>75 % à 1 000 €</strong>", "<strong>58 % à 500 €</strong>", { [T]: 1 }],
  [[T], "<strong>1 500 € et 2 000 €</strong>", "<strong>750 € et 1 000 €</strong>", { [T]: 1 }],
  [[T], "il facturera une gestion sur 1 500 € alors que Google ne pourra en dépenser que 754 €, pour\n        exactement le résultat obtenu à 1 000 €.",
        "il facturera une gestion sur 1 500 € alors que Google ne pourra en dépenser que 292 €, pour\n        exactement le résultat obtenu à 300 €.", { [T]: 1 }],
  [[C], "il vous facturera une gestion sur 1 500 € alors que Google ne pourra en dépenser que 754 €,\n        pour exactement le même résultat qu'à 1 000 €.",
        "il vous facturera une gestion sur 1 500 € alors que Google ne pourra en dépenser que 292 €,\n        pour exactement le même résultat qu'à 300 €.", { [C]: 1 }],

  /* ---------- resume d envoi ---------- */
  [[R], '<strong class="tabular">750 €</strong>', '<strong class="tabular">290 €</strong>', { [R]: 1 }],
  [[R], "Nous avons vérifié que votre marché sature autour de <strong>750 €\n          par mois</strong>.", "Nous avons vérifié que votre marché sature autour de <strong>290 €\n          par mois</strong> à enchère plafonnée.", { [R]: 1 }],

  /* ---------- provenance ---------- */
  [[T, C], "extraction du 31 juillet 2026", "extraction du 4 août 2026", { [T]: 1, [C]: 1 }],
  [[T, C], "generate_forecast_metrics", "generateKeywordForecastMetrics", { [T]: 2, [C]: 2 }],
  [[T, C], "generate_keyword_ideas", "generateKeywordIdeas", { [T]: 2, [C]: 2 }],
];

/* Les trois rapports n emploient que l apostrophe droite (verifie : 0 U+2019).
   On aligne les motifs dessus, dans les deux sens, pour rester insensible au style. */
const apo = (s) => s.replace(/’/g, "'");

let erreurs = 0;
for (const [fichiers, cherche0, remplace0, attendu] of P) {
  const cherche = apo(cherche0), remplace = apo(remplace0);
  for (const f of fichiers) {
    const n = src[f].split(cherche).length - 1;
    const veut = attendu[f];
    if (DRY) { console.log(`${n === veut ? "ok   " : "ECART"}  ${f.slice(0, 12)}  attendu ${veut}, trouve ${n}  ::  ${cherche.slice(0, 60).replace(/\n/g, "\\n")}`); if (n) src[f] = src[f].split(cherche).join(remplace); continue; }
    if (n !== veut) {
      erreurs++;
      console.log(`ECART  ${f}  attendu ${veut}, trouve ${n}  ::  ${cherche.slice(0, 78).replace(/\n/g, "\\n")}`);
      continue;
    }
    src[f] = src[f].split(cherche).join(remplace);
  }
}
if (DRY) process.exit(0);

if (erreurs) {
  console.log(`\n${erreurs} ecart(s) — aucun fichier ecrit.`);
  process.exit(1);
}
for (const f of [T, C, R]) writeFileSync(resolve(HERE, f), src[f]);
console.log(`${P.length} substitutions appliquees aux trois rapports.`);
