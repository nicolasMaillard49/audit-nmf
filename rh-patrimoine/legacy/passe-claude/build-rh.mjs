/**
 * Génère le rapport d'audit RH Patrimoine en HTML prêt à imprimer.
 * SVG produits en statique : aucun JS ne tourne à l'impression, donc aucun
 * risque de figure vide dans le PDF.
 */
import { readFileSync, writeFileSync } from "fs";

const D = JSON.parse(readFileSync(new URL("./charts.json", import.meta.url), "utf8"));

// Palette validée (dataviz, all-pairs, mode clair) + violet de marque NMF.
const C = { int: "#2a78d6", gen: "#eb6834", mar: "#1baf7a", nmf: "#7B4FE0",
  ink: "#1a1a1a", ink2: "#52514e", ink3: "#8a8985", rule: "#e4e2dd", surf: "#faf9f7" };

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const nb = (n) => n.toLocaleString("fr-FR").replace(/ | /g, " ");
const eur = (n) => n.toFixed(2).replace(".", ",") + " €";

/* ── Figure 1 — répartition du marché : barre empilée 100 % ─────────────────
   Part-du-tout → barre empilée horizontale (pas un camembert) : les libellés
   français longs y tiennent et les segments se comparent à l'œil. */
function fig1() {
  const { int, gen, mar } = D.vol, tot = int + gen + mar;
  const W = 620, H = 118, y = 14, h = 44, gap = 2;
  const seg = [
    { v: int, c: C.int, l: "Intention commerciale" },
    { v: gen, c: C.gen, l: "Génériques / notoriété" },
    { v: mar, c: C.mar, l: "Marques concurrentes" },
  ];
  let x = 0, bars = "", labs = "";
  for (const s of seg) {
    const w = (s.v / tot) * W - gap;
    const pct = Math.round((s.v / tot) * 100);
    bars += `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="3" fill="${s.c}"/>`;
    labs += `<text x="${(x + w / 2).toFixed(1)}" y="${y + h / 2 + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">${pct} %</text>`
      + `<text x="${(x + w / 2).toFixed(1)}" y="${y + h + 20}" text-anchor="middle" font-size="10.5" fill="${C.ink2}">${esc(s.l)}</text>`
      + `<text x="${(x + w / 2).toFixed(1)}" y="${y + h + 34}" text-anchor="middle" font-size="10.5" font-weight="600" fill="${C.ink}">${nb(s.v)} rech./mois</text>`;
    x += w + gap;
  }
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Répartition du volume de recherche">${bars}${labs}</svg>`;
}

/* ── Figure 2 — inversion volume/valeur : nuage de points ───────────────────
   X = volume (log, car il court de 10 à 3000), Y = CPC. Trois couleurs = trois
   paniers : all-pairs validé à 3 séries, on n'en met pas une quatrième. */
function fig2() {
  const W = 620, H = 268, m = { t: 12, r: 16, b: 40, l: 48 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  // ⚠️ `c` porte déjà le CPC dans charts.json : la couleur va dans `col`.
  // (Écraser `c` par un hex rendait maxC = NaN et écrasait tous les points en haut.)
  const pts = [
    ...D.scatter.gen.map((p) => ({ ...p, col: C.gen })),
    ...D.scatter.mar.map((p) => ({ ...p, col: C.mar })),
    ...D.scatter.int.map((p) => ({ ...p, col: C.int })), // dessiné en dernier = au-dessus
  ].filter((p) => p.v > 0 && Number.isFinite(p.c) && p.c > 0);
  const maxC = Math.ceil(Math.max(10, ...pts.map((p) => p.c)));
  const lx = (v) => m.l + (Math.log10(Math.max(v, 10)) - 1) / (Math.log10(3000) - 1) * pw;
  const ly = (c) => m.t + ph - (c / maxC) * ph;

  let g = "";
  for (const v of [10, 30, 100, 300, 1000, 3000]) {
    g += `<line x1="${lx(v).toFixed(1)}" y1="${m.t}" x2="${lx(v).toFixed(1)}" y2="${m.t + ph}" stroke="${C.rule}" stroke-width="1"/>`
      + `<text x="${lx(v).toFixed(1)}" y="${m.t + ph + 16}" text-anchor="middle" font-size="9.5" fill="${C.ink3}">${nb(v)}</text>`;
  }
  for (let c = 0; c <= maxC; c += 2) {
    g += `<line x1="${m.l}" y1="${ly(c).toFixed(1)}" x2="${m.l + pw}" y2="${ly(c).toFixed(1)}" stroke="${C.rule}" stroke-width="1"/>`
      + `<text x="${m.l - 8}" y="${(ly(c) + 3.5).toFixed(1)}" text-anchor="end" font-size="9.5" fill="${C.ink3}">${c} €</text>`;
  }
  const dots = pts.map((p) =>
    `<circle cx="${lx(p.v).toFixed(1)}" cy="${ly(p.c).toFixed(1)}" r="4.5" fill="${p.col}" fill-opacity="0.82" stroke="${C.surf}" stroke-width="1.5"/>`).join("");

  // Libellés directs : obligatoires (l'aqua passe sous 3:1 sur fond clair).
  const ann = [
    { t: "estimation appartement", v: 40, c: 9.26, dx: 8, dy: -8, a: "start" },
    { t: "estimation maison", v: 210, c: 4.6, dx: 8, dy: -8, a: "start" },
    { t: "agence immobilière", v: 2900, c: 1.37, dx: -8, dy: -10, a: "end" },
  ].map((a) => `<text x="${(lx(a.v) + a.dx).toFixed(1)}" y="${(ly(a.c) + a.dy).toFixed(1)}" text-anchor="${a.a}" font-size="9.5" font-weight="600" fill="${C.ink}">${esc(a.t)}</text>`).join("");

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Volume de recherche contre CPC">
    ${g}${dots}${ann}
    <text x="${m.l + pw / 2}" y="${H - 6}" text-anchor="middle" font-size="10" fill="${C.ink2}">Volume de recherche mensuel (échelle logarithmique)</text>
    <text transform="translate(13,${m.t + ph / 2}) rotate(-90)" text-anchor="middle" font-size="10" fill="${C.ink2}">CPC haut de page</text>
  </svg>`;
}

/* ── Figure 3 — les 3 scénarios : deux petits graphiques ────────────────────
   Budget et clics n'ont pas la même échelle : JAMAIS de double axe. Deux
   graphiques côte à côte, même ordre et même couleur par scénario. */
function fig3() {
  const cols = [C.int, C.gen, C.mar];
  const bloc = (titre, vals, fmt) => {
    const W = 300, H = 190, m = { t: 26, r: 8, b: 44, l: 8 };
    const pw = W - m.l - m.r, ph = H - m.t - m.b;
    const max = Math.max(...vals);
    const bw = pw / vals.length - 16;
    let s = "";
    vals.forEach((v, i) => {
      const h = Math.max(3, (v / max) * ph);
      const x = m.l + i * (pw / vals.length) + 8;
      s += `<rect x="${x.toFixed(1)}" y="${(m.t + ph - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${cols[i]}"/>`
        + `<text x="${(x + bw / 2).toFixed(1)}" y="${(m.t + ph - h - 6).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="${C.ink}">${fmt(v)}</text>`
        + `<text x="${(x + bw / 2).toFixed(1)}" y="${m.t + ph + 16}" text-anchor="middle" font-size="9.5" fill="${C.ink2}">${esc(D.scen[i].scenario)}</text>`;
    });
    return `<div class="half"><p class="figsub">${titre}</p><svg viewBox="0 0 ${W} ${H}" width="100%">${s}</svg></div>`;
  };
  return `<div class="row2">${bloc("Budget mensuel", D.scen.map((s) => s.budgetMensuel), (v) => nb(v) + " €")}${bloc("Clics par mois", D.scen.map((s) => s.clics), (v) => nb(v))}</div>`;
}

/* ── Figure 4 — part du marché captée : jauges ──────────────────────────────
   Un ratio contre une limite se rend par une jauge, pas un camembert à 2 parts.
   Elles montrent visuellement qu'on n'atteint jamais 100 %. */
function fig4() {
  const cols = [C.int, C.gen, C.mar];
  return `<div class="gauges">` + D.scen.map((s, i) => {
    const W = 190, H = 54, tr = 12;
    const w = Math.max(4, (s.partVolume / 100) * W);
    return `<div class="gauge">
      <p class="gname">${esc(s.scenario)}</p>
      <svg viewBox="0 0 ${W} ${H}" width="100%">
        <rect x="0" y="8" width="${W}" height="${tr}" rx="6" fill="${C.rule}"/>
        <rect x="0" y="8" width="${w.toFixed(1)}" height="${tr}" rx="6" fill="${cols[i]}"/>
        <text x="0" y="42" font-size="15" font-weight="700" fill="${C.ink}">${String(s.partVolume).replace(".", ",")} %</text>
        <text x="${W}" y="42" text-anchor="end" font-size="9.5" fill="${C.ink3}">du marché</text>
      </svg></div>`;
  }).join("") + `</div>`;
}

const legende = (items) => `<p class="legend">` + items.map((i) =>
  `<span><i style="background:${i[1]}"></i>${esc(i[0])}</span>`).join("") + `</p>`;

const rows = (arr) => arr.map((k) =>
  `<tr><td>${esc(k.t)}</td><td class="n">${nb(k.v)}</td><td class="n">${eur(k.c)}</td><td class="n">${k.i ?? "—"}</td></tr>`).join("");

const S = D.scen;
const html = `<style>
@page { size: A4; margin: 15mm 14mm 16mm; }
* { box-sizing: border-box; }
body { font: 10.5pt/1.55 "Segoe UI", Helvetica, sans-serif; color: ${C.ink}; margin: 0; }
h1,h2,h3 { font-family: Georgia, "Times New Roman", serif; font-weight: 600; margin: 0 0 .5em; }
h2 { font-size: 19pt; color: ${C.nmf}; border-bottom: 2px solid ${C.nmf}; padding-bottom: 6px; margin-top: 0; }
h3 { font-size: 12.5pt; margin: 18px 0 8px; }
p { margin: 0 0 9px; }
.page { page-break-after: always; }
.page:last-child { page-break-after: auto; }
table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 8px 0 12px; }
th { background: ${C.nmf}; color: #fff; text-align: left; padding: 7px 9px; font-weight: 600; font-size: 9pt; }
td { padding: 6px 9px; border-bottom: 1px solid ${C.rule}; }
tr:nth-child(even) td { background: ${C.surf}; }
td.n, th.n { text-align: right; }
.box { background: #f4f0fe; border-left: 3px solid ${C.nmf}; padding: 12px 15px; margin: 12px 0; }
.box h3 { margin-top: 0; color: ${C.nmf}; }
.crit { border-left-color: #d03b3b; background: #fdf2f2; }
.crit h3 { color: #b02a2a; }
.legend { font-size: 9pt; color: ${C.ink2}; margin: 6px 0 0; }
.legend span { margin-right: 16px; white-space: nowrap; }
.legend i { display: inline-block; width: 9px; height: 9px; border-radius: 2px; margin-right: 5px; vertical-align: baseline; }
.figsub { font-size: 9.5pt; color: ${C.ink2}; margin: 0 0 4px; font-weight: 600; }
.src { font-size: 8pt; color: ${C.ink3}; margin: 2px 0 14px; }
.row2 { display: flex; gap: 18px; }
.half { flex: 1; }
.gauges { display: flex; gap: 16px; margin-top: 6px; }
.gauge { flex: 1; }
.gname { font-size: 9.5pt; font-weight: 600; margin: 0 0 2px; color: ${C.ink2}; }
ul { margin: 0 0 10px; padding-left: 18px; }
li { margin-bottom: 5px; }
.kpi { display: flex; gap: 14px; margin: 14px 0; }
.kpi div { flex: 1; background: ${C.surf}; border: 1px solid ${C.rule}; border-radius: 5px; padding: 11px 13px; }
.kpi b { display: block; font-size: 21pt; font-family: Georgia, serif; color: ${C.nmf}; line-height: 1.1; }
.kpi span { font-size: 8.5pt; color: ${C.ink2}; }
.cover { height: 245mm; display: flex; flex-direction: column; justify-content: center; }
.cover .brand { font-size: 13pt; letter-spacing: .22em; color: ${C.nmf}; font-weight: 700; margin-bottom: 46px; }
.cover h1 { font-size: 33pt; line-height: 1.16; margin-bottom: 14px; }
.cover .sub { font-size: 13pt; color: ${C.ink2}; }
.cover .meta { margin-top: 52px; font-size: 10pt; color: ${C.ink3}; border-top: 1px solid ${C.rule}; padding-top: 14px; }
.foot { position: fixed; bottom: 6mm; left: 0; right: 0; font-size: 7.5pt; color: ${C.ink3}; display: flex; justify-content: space-between; }
</style>

<div class="foot"><span>Audit réalisé par NMF Agence — juillet 2026</span><span>RH Patrimoine</span></div>

<div class="page cover">
  <p class="brand">NMF AGENCE</p>
  <h1>Audit digital &amp;<br>potentiel Google Ads</h1>
  <p class="sub">RH Patrimoine — Agence immobilière, métropole bordelaise</p>
  <div class="meta">rhpatrimoine.com · 228 rue du 14 Juillet, 33400 Talence<br>Juillet 2026</div>
</div>

<div class="page">
  <h2>Synthèse exécutive</h2>
  <div class="box">
    <h3>210 personnes cherchent chaque mois à faire estimer leur maison autour de vous</h3>
    <p>Et <b>6 300 recherches mensuelles</b> partent vers vos concurrents — Orpi, Laforêt, Nestenn,
    Arthurimmo. Aujourd'hui, votre site ne capte ni les unes ni les autres.</p>
  </div>
  <div class="kpi">
    <div><b>65 %</b><span>probabilité de réussite, sous réserve de créer une page estimation</span></div>
    <div><b>310 €</b><span>budget mensuel de démarrage recommandé</span></div>
    <div><b>~16</b><span>demandes d'estimation par mois attendues</span></div>
  </div>
  <h3>Ce qui fonctionne déjà</h3>
  <ul>
    <li><b>Un moteur de recherche de biens bien construit</b>, avec des adresses de pages optimisées par ville et par type de bien — une base solide, rare chez vos confrères.</li>
    <li><b>Un blog de fond réellement documenté</b> : Euratlantique, Brazza, Canopia, Bassins à Flot. C'est un actif SEO que beaucoup d'agences n'ont pas.</li>
    <li><b>Une équipe visible et joignable</b> : 4 conseillers avec photo et ligne directe, téléphones cliquables sur mobile.</li>
  </ul>
  <h3>Les trois priorités</h3>
  <ul>
    <li><b>Créer une page « estimation » avec formulaire court.</b> Aujourd'hui votre page Vendre propose un rappel en 6 champs. C'est le point qui conditionne tout le reste.</li>
    <li><b>Collecter des avis clients.</b> Vous n'en affichez aucun, et aucun n'apparaît sur les annuaires. Sur un métier de confiance, c'est le premier frein.</li>
    <li><b>Exclure les marques concurrentes</b> dès le lancement de la campagne, sans quoi une part du budget les financera.</li>
  </ul>
  <div class="box">
    <h3>Ce que NMF recommande en premier</h3>
    <p>Créer la page estimation <b>avant</b> tout investissement publicitaire. Envoyer du trafic
    payant vers un formulaire de rappel reviendrait à payer pour des visiteurs qui repartent.</p>
  </div>
</div>

<div class="page">
  <h2>Votre entreprise &amp; votre marché</h2>
  <p>RH Patrimoine est née de l'association de <b>Jean-Guillaume Roché</b> et <b>Philippe Hervé</b>,
  respectivement gestionnaire de patrimoine immobilier et agent immobilier. L'agence est installée
  à Talence et couvre la métropole bordelaise : Bordeaux, Pessac, Talence, Mérignac, Carbon-Blanc.</p>
  <p>Votre offre est large — vente, achat, location, gestion locative, investissement et <b>viager</b>.
  Cette dernière activité est un différenciateur réel : peu d'agences bordelaises la proposent, et
  elle représente <b>320 recherches mensuelles</b> sur votre zone. Elle ne dispose pourtant d'aucune
  page dédiée sur votre site.</p>

  <h3>Répartition du marché bordelais</h3>
  ${fig1()}
  ${legende([["Intention commerciale", C.int], ["Génériques / notoriété", C.gen], ["Marques concurrentes", C.mar]])}
  <p class="src">Source : Google Ads Keyword Planner, Bordeaux, juillet 2026 — 1 651 requêtes distinctes analysées.</p>
  <p>Le panier « marques concurrentes » pèse presque autant que celui à intention commerciale.
  Ce sont des personnes qui tapent directement le nom d'une agence : <b>elles ne vous chercheront
  jamais</b>. En campagne, ces requêtes doivent être exclues explicitement.</p>
</div>

<div class="page">
  <h2>Audit de votre site</h2>
  <h3>Points forts</h3>
  <ul>
    <li><b>Moteur de recherche de biens avec filtres</b> (type, localisation, budget, surface) et des adresses de pages propres du type <i>/vente/appartement/talence/33400</i>. C'est exactement ce que Google attend pour le référencement local.</li>
    <li><b>Téléphones cliquables</b> présents dans les pages : sur mobile, un visiteur appelle en un geste.</li>
    <li><b>Quatre conseillers présentés</b> avec photo, fonction et ligne directe.</li>
    <li><b>Onze articles de blog de fond</b> sur les quartiers en transformation. Du contenu local documenté, pas du remplissage.</li>
    <li><b>Page « Vendre » structurée</b> : multidiffusion, avis de valeur, photos et plans cotés, prise en charge des visites, signature électronique.</li>
  </ul>

  <div class="box crit">
    <h3>❌ Priorité 1 — Aucune estimation en ligne</h3>
    <p><b>Constat.</b> Votre page « Vendre » propose un formulaire de <b>demande de rappel à 6 champs</b>
    (prénom, nom, e-mail, téléphone, commune, message). Aucune estimation immédiate n'est proposée.</p>
    <p><b>Impact.</b> Les personnes qui cherchent « estimation maison » ou « estimation gratuite »
    veulent une réponse tout de suite. Leur présenter un formulaire de rappel fait chuter la
    conversion — et c'est précisément le trafic qui a le plus de valeur pour vous.</p>
    <p><b>Recommandation.</b> Créer une page dédiée « Estimer mon bien » avec un formulaire court
    (type de bien, commune, surface, coordonnées) et une promesse claire de retour chiffré.</p>
  </div>

  <div class="box crit">
    <h3>❌ Priorité 2 — Aucun avis client</h3>
    <p><b>Constat.</b> Aucun témoignage sur le site, et les annuaires professionnels affichent
    « aucun avis » pour votre établissement.</p>
    <p><b>Impact.</b> Confier un bien de plusieurs centaines de milliers d'euros repose sur la
    confiance. L'absence totale d'avis est le premier motif d'abandon face à un concurrent noté.
    Google en tient également compte dans le classement des annonces publicitaires.</p>
    <p><b>Recommandation.</b> Solliciter systématiquement un avis après chaque transaction, et
    afficher les meilleurs sur la page d'accueil et la page Vendre.</p>
  </div>

</div>

<div class="page">
  <h2>Audit de votre site <span style="font-size:11pt;color:${C.ink3}">(suite)</span></h2>
  <div class="box crit">
    <h3>❌ Priorité 3 — Description de page absente</h3>
    <p><b>Constat.</b> Votre page d'accueil ne comporte pas de balise de description. Google
    compose alors lui-même le résumé affiché dans ses résultats.</p>
    <p><b>Impact.</b> Vous perdez la maîtrise de votre première phrase commerciale, celle qui
    décide du clic.</p>
    <p><b>Recommandation.</b> Rédiger une description par page clé, incluant « estimation » et
    les communes couvertes.</p>
  </div>
  <h3>⚠️ Points importants</h3>
  <ul>
    <li><b>Page d'accueil très lourde (847 Ko).</b> Le poids ralentit l'affichage, en particulier en mobilité. Google intègre cette vitesse au calcul du coût de vos futures annonces : une page lente se paie plus cher au clic.</li>
    <li><b>Titre de page trop générique.</b> « RH Patrimoine - Immobilier sur la métropole Bordelaise » ne contient ni « estimation » ni « Talence », deux termes que vos clients tapent.</li>
    <li><b>Carte professionnelle non affichée.</b> Sa mention est une obligation légale pour une agence immobilière, et c'est aussi un signal de sérieux.</li>
    <li><b>Blog ralenti.</b> Le dernier article publié est un message de vœux ; la dynamique installée sur les onze articles précédents s'est interrompue.</li>
    <li><b>Six images sans texte alternatif.</b> Elles restent invisibles pour Google et pour les lecteurs d'écran.</li>
  </ul>
  <h3>💡 Pistes complémentaires</h3>
  <ul>
    <li><b>Créer une page « Viager ».</b> C'est votre différenciateur le plus net, et il représente 320 recherches mensuelles sans page pour les accueillir.</li>
    <li><b>Créer une page « Gestion locative »</b>, aujourd'hui citée sans page propre.</li>
    <li><b>Compléter le partage sur les réseaux sociaux</b> : sans titre de partage défini, vos liens s'affichent de façon dégradée.</li>
  </ul>
  <div class="box">
    <h3>Verdict : le site peut-il recevoir de la publicité aujourd'hui ?</h3>
    <p><b>Pas en l'état pour le trafic vendeur.</b> La page estimation est un prérequis, pas une
    option. Pour le trafic acheteur, en revanche, votre moteur de recherche de biens est prêt.</p>
  </div>
</div>

<div class="page">
  <h2>Étude de mots-clés</h2>
  <h3>Les requêtes qui comptent pour vous</h3>
  <table><thead><tr><th>Mot-clé</th><th class="n">Vol./mois</th><th class="n">CPC haut de page</th><th class="n">Concurrence</th></tr></thead>
  <tbody>${rows(D.topInt.slice(0,7))}</tbody></table>
  <p class="src">Source : Google Ads Keyword Planner, Bordeaux, juillet 2026. Concurrence sur 100.</p>

  <h3>Le volume n'est pas la valeur</h3>
  ${fig2()}
  ${legende([["Intention commerciale", C.int], ["Génériques / notoriété", C.gen], ["Marques concurrentes", C.mar]])}
  <div class="box">
    <h3>Ce que montre ce graphique</h3>
    <p>« Agence immobilière » totalise <b>2 900 recherches par mois</b> mais ne coûte que
    <b>1,37 €</b> le clic, avec une concurrence de 20 sur 100. « Estimation appartement » ne fait
    que <b>40 recherches</b>… à <b>9,26 €</b> le clic, avec une concurrence de 82.</p>
    <p><b>Un coût élevé est un signal de rentabilité, pas un repoussoir.</b> Si vos confrères
    acceptent de payer sept fois plus cher pour ces requêtes, c'est qu'elles transforment. Une
    estimation, c'est un vendeur ; un vendeur, c'est un mandat. Les gros volumes bon marché, eux,
    sont des internautes qui naviguent — pas des clients.</p>
  </div>
</div>

<div class="page">
  <h2>Mots-clés à exclure</h2>
  <p>Ces requêtes représentent <b>6 300 recherches mensuelles</b>. Ce sont des personnes qui
  cherchent une agence concurrente <b>par son nom</b>. Sans exclusion explicite, une partie de
  votre budget servirait à financer leur notoriété.</p>
  <table><thead><tr><th>Requête à exclure</th><th class="n">Vol./mois</th><th class="n">CPC</th><th class="n">Concurrence</th></tr></thead>
  <tbody>${rows(D.topMar)}</tbody></table>
  <p class="src">Extrait des 205 requêtes de marque identifiées. Source : Google Ads Keyword Planner, Bordeaux, juillet 2026.</p>
  <div class="box">
    <h3>Pourquoi nous le signalons avant même de commencer</h3>
    <p>C'est le premier réglage que nous poserons. Il ne coûte rien et protège votre budget dès
    le premier jour — beaucoup de campagnes tournent des mois sans cette exclusion.</p>
  </div>
</div>

<div class="page">
  <h2>Projection de campagne</h2>
  <p>Les chiffres ci-dessous sont <b>simulés par Google</b> pour votre zone et vos mots-clés — ce
  ne sont pas nos estimations. Trois niveaux d'ambition, trois résultats.</p>
  <table><thead><tr><th>Scénario</th><th>Ce que vous achetez</th><th class="n">Budget/mois</th><th class="n">Clics</th><th class="n">Coût/clic</th></tr></thead>
  <tbody>
    <tr><td><b>Présence</b></td><td>du volume, en positions basses</td><td class="n">${nb(S[0].budgetMensuel)} €</td><td class="n">${nb(S[0].clics)}</td><td class="n">${eur(S[0].cpcMoyen)}</td></tr>
    <tr><td><b>Haut de page</b></td><td>de la visibilité en tête de résultats</td><td class="n">${nb(S[1].budgetMensuel)} €</td><td class="n">${nb(S[1].clics)}</td><td class="n">${eur(S[1].cpcMoyen)}</td></tr>
    <tr><td><b>Domination</b></td><td>tout l'inventaire atteignable</td><td class="n">${nb(S[2].budgetMensuel)} €</td><td class="n">${nb(S[2].clics)}</td><td class="n">${eur(S[2].cpcMoyen)}</td></tr>
  </tbody></table>
  ${fig3()}
  <p class="src">Simulation Google Ads, 30 jours, Bordeaux, juillet 2026.</p>

  <h3>Part du marché captée</h3>
  ${fig4()}
  <p>Aucun scénario n'atteint 100 %, et c'est normal : <b>le nombre de recherches est fini</b>.
  Au-delà d'un certain budget, Google ne trouve plus d'inventaire à vous vendre — c'est le cas
  dès le scénario « Haut de page ». <b>Nous ne vous proposerons donc jamais plus de
  ${nb(S[2].budgetMensuel)} € par mois sur ce marché</b>, quel que soit votre appétit.</p>
</div>

<div class="page">
  <h2>Notre recommandation</h2>
  <div class="box">
    <h3>Démarrer à ${nb(S[0].budgetMensuel)} € par mois — après la page estimation</h3>
    <p>Ce budget capte ${nb(S[0].clics)} clics mensuels. Sur une page d'estimation correctement
    conçue, un taux de transformation de 4 % <i>(estimation NMF, fondée sur notre expérience du
    secteur)</i> donne <b>environ 16 demandes d'estimation par mois</b>, soit un coût d'environ
    <b>19 € par demande</b>.</p>
    <p>Rapporté à une commission d'agence sur une transaction bordelaise, même en ne transformant
    qu'une demande sur dix en mandat signé, le rapport reste très favorable.</p>
  </div>
  <p><b>Pourquoi « Présence » et pas « Haut de page » d'emblée :</b> tant que la page estimation
  n'existe pas, acheter des positions premium reviendrait à payer cher pour envoyer des visiteurs
  vers un formulaire de rappel. Une fois la page en ligne et les premiers résultats mesurés, le
  passage au scénario supérieur se décide sur des données réelles, pas sur une hypothèse.</p>

  <h3>Plan d'action</h3>
  <table><thead><tr><th>Action</th><th>Priorité</th><th>Effet attendu</th></tr></thead><tbody>
    <tr><td>Créer la page « Estimer mon bien » (formulaire court)</td><td>Prérequis</td><td>Rend la campagne exploitable</td></tr>
    <tr><td>Mettre en place la collecte d'avis clients</td><td>Prérequis</td><td>Lève le principal frein à la prise de contact</td></tr>
    <tr><td>Rédiger les descriptions de pages, corriger le titre</td><td>Critique</td><td>Maîtrise du message dans Google</td></tr>
    <tr><td>Afficher la carte professionnelle</td><td>Critique</td><td>Conformité et réassurance</td></tr>
    <tr><td>Lancer la campagne « estimation » à ${nb(S[0].budgetMensuel)} €/mois</td><td>Lancement</td><td>~16 demandes d'estimation par mois</td></tr>
    <tr><td>Exclure les 205 requêtes de marque concurrente</td><td>Lancement</td><td>Protège le budget dès le premier jour</td></tr>
    <tr><td>Créer les pages « Viager » et « Gestion locative »</td><td>Optimisation</td><td>Ouvre deux segments sans concurrence interne</td></tr>
    <tr><td>Alléger la page d'accueil, relancer le blog</td><td>Optimisation</td><td>Baisse du coût au clic, gains en référencement naturel</td></tr>
  </tbody></table>

  <div class="box">
    <h3>Parlons-en</h3>
    <p>Nous pouvons dérouler ce plan avec vous, de la page estimation au pilotage de la campagne.
    <b>NMF Agence</b> — nico39320@gmail.com</p>
  </div>
  <p class="src">Volumes, coûts au clic, concurrence, clics et budgets simulés : données Google Ads
  Keyword Planner (Bordeaux, juillet 2026). Seul le taux de transformation en demande d'estimation
  est une estimation NMF, signalée comme telle.</p>
</div>`;

writeFileSync(new URL("./rh-audit.html", import.meta.url), html);
console.log("HTML écrit —", html.length, "caractères");
