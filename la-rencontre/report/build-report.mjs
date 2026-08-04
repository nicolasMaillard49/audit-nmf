/**
 * Construit le rapport d'audit NMF — Restaurant La Rencontre (Bordeaux).
 * Lit les données brutes de data/ et génère report/audit-la-rencontre-2026.html
 * conformément au design lock 1.1 (assets/audit-design-lock.css).
 *   node build-report.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ads = JSON.parse(readFileSync(resolve(ROOT, "data/donnees-google-ads-brutes.json"), "utf8"));
const portfolio = JSON.parse(readFileSync(resolve(ROOT, "data/portefeuille-mots-cles.json"), "utf8"));

/* ---------- helpers ---------- */
const NBSP = " "; // espace fine insécable
const fmtInt = (n) => Math.round(n).toLocaleString("fr-FR").replace(/ /g, NBSP);
const fmtEur = (n, dec = 0) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec }).replace(/ /g, NBSP) + NBSP + "€";
const fmtCpc = (n) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + NBSP + "€";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---------- data joins ---------- */
const histByText = new Map(ads.historical.map((h) => [h.text, h]));
const closeVariantOwner = new Map();
for (const h of ads.historical) for (const cv of h.closeVariants || []) closeVariantOwner.set(cv, h.text);

const FAM_LABELS = portfolio.familles;
const keywords = portfolio.keywords.map((k) => {
  const h = histByText.get(k.text);
  const grouped = closeVariantOwner.get(k.text);
  return { ...k, hist: h || null, groupedWith: grouped || null };
});

/* volumes par famille et par intention */
const famAgg = {};
for (const k of keywords) {
  famAgg[k.famille] ??= { vol: 0, n: 0 };
  famAgg[k.famille].n++;
  if (k.hist?.vol) famAgg[k.famille].vol += k.hist.vol;
}
const intentAgg = {};
for (const k of keywords) {
  intentAgg[k.intention] ??= 0;
  if (k.hist?.vol) intentAgg[k.intention] += k.hist.vol;
}
const totalVol = ads.historical.reduce((s, h) => s + (h.vol || 0), 0);
const brandVol = intentAgg["marque"] || 0;
const nonBrandVol = totalVol - brandVol;
const noVolCount = ads.historical.filter((h) => !h.vol).length;

/* matrice budgétaire */
const STRATS = [
  { key: "Presence (maximisation des clics)", label: "Présence", cls: "s-presence" },
  { key: "Haut de page (CPC manuel)", label: "Haut de page", cls: "s-top" },
  { key: "Domination (CPC manuel majore)", label: "Domination", cls: "s-domination" },
];
const matrixBy = {};
for (const m of ads.matrix) {
  matrixBy[m.strategy] ??= new Map();
  matrixBy[m.strategy].set(m.budget_mensuel, m);
}
const BUDGETS = ads.meta.budgets;
const cell = (m) =>
  m && m.ok
    ? `${fmtEur(m.cost)} · ${fmtInt(m.clicks)} clics · ${fmtCpc(m.cpc)}`
    : "appel en échec";

const presence = matrixBy[STRATS[0].key];
const p150 = presence.get(150);
const p500 = presence.get(500);

/* ---------- SVG builders (couleurs uniquement via classes/var) ---------- */

function stackedPortfolioBar() {
  const com = (intentAgg["commerciale"] || 0) + (intentAgg["transactionnelle"] || 0);
  const gen = intentAgg["générique"] || 0;
  const marque = brandVol;
  const total = com + gen + marque;
  const W = 620;
  const segs = [
    { v: com, cls: "seg-intent", label: `Intention commerciale — ${fmtInt(com)}` },
    { v: gen, cls: "seg-generic", label: `Générique — ${fmtInt(gen)}` },
    { v: marque, cls: "seg-brand", label: `Marque — ${fmtInt(marque)}` },
  ];
  let x = 0;
  let rects = "";
  let labels = "";
  segs.forEach((s) => {
    const w = Math.max((s.v / total) * W, 30);
    rects += `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="30" class="${s.cls}"/>`;
    labels += `<text x="${(x + 3).toFixed(1)}" y="46" class="seg-label">${esc(s.label)}${NBSP}(${Math.round((s.v / total) * 100)}${NBSP}%)</text>`;
    x += w;
  });
  return `<svg viewBox="0 0 ${W} 54" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">${rects}${labels}</svg>`;
}

function scatterVolCpc() {
  const pts = ads.historical.filter((h) => h.vol > 0 && h.bidHigh > 0);
  const W = 620, H = 220, PL = 46, PB = 26, PT = 12, PR = 14;
  const maxV = 3700, maxC = 1.2;
  const X = (v) => PL + (v / maxV) * (W - PL - PR);
  const Y = (c) => H - PB - (c / maxC) * (H - PB - PT);
  let grid = "", axes = "", dots = "", labels = "";
  for (const c of [0.3, 0.6, 0.9, 1.2]) {
    grid += `<line x1="${PL}" y1="${Y(c)}" x2="${W - PR}" y2="${Y(c)}" class="gridline"/>`;
    axes += `<text x="${PL - 5}" y="${Y(c) + 3}" text-anchor="end" class="axis-label">${c.toLocaleString("fr-FR")}${NBSP}€</text>`;
  }
  for (const v of [0, 1000, 2000, 3000]) {
    axes += `<text x="${X(v)}" y="${H - PB + 14}" text-anchor="middle" class="axis-label">${fmtInt(v)}</text>`;
  }
  axes += `<line x1="${PL}" y1="${Y(0)}" x2="${W - PR}" y2="${Y(0)}" class="axis"/>`;
  axes += `<line x1="${PL}" y1="${PT}" x2="${PL}" y2="${Y(0)}" class="axis"/>`;
  const labelled = new Set([
    "restaurant italien bordeaux",
    "restaurant gastronomique bordeaux",
    "meilleur restaurant bordeaux",
    "restaurant bistronomique bordeaux",
    "restaurant romantique bordeaux",
    "ou manger a bordeaux",
  ]);
  const short = {
    "restaurant italien bordeaux": "italien",
    "restaurant gastronomique bordeaux": "gastronomique",
    "meilleur restaurant bordeaux": "meilleur restaurant",
    "restaurant bistronomique bordeaux": "bistronomique",
    "restaurant romantique bordeaux": "romantique",
    "ou manger a bordeaux": "où manger",
  };
  for (const h of pts) {
    const k = keywords.find((x) => x.text === h.text);
    const cls = k && (k.intention === "commerciale" || k.intention === "transactionnelle") ? "point-intent" : "point-generic";
    dots += `<circle cx="${X(h.vol).toFixed(1)}" cy="${Y(h.bidHigh).toFixed(1)}" r="4.4" class="${cls}"/>`;
    if (labelled.has(h.text)) {
      const anchor = h.vol > 2600 ? "end" : "start";
      const dx = h.vol > 2600 ? -7 : 7;
      labels += `<text x="${(X(h.vol) + dx).toFixed(1)}" y="${(Y(h.bidHigh) - 6).toFixed(1)}" text-anchor="${anchor}" class="point-label">${esc(short[h.text])}</text>`;
    }
  }
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">${grid}${axes}${dots}${labels}</svg>`;
}

function strategyBars() {
  const W = 300, H = 190, PB = 30, PT = 24;
  const data = STRATS.map((s) => matrixBy[s.key].get(150));
  const maxClicks = 170;
  let bars = "";
  data.forEach((m, i) => {
    const bw = 56, gap = 40;
    const x = 30 + i * (bw + gap);
    const h = (m.clicks / maxClicks) * (H - PB - PT);
    const y = H - PB - h;
    bars += `<rect x="${x}" y="${y.toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" class="bar-${i}"/>`;
    bars += `<text x="${x + bw / 2}" y="${(y - 6).toFixed(1)}" text-anchor="middle" class="bar-value">${fmtInt(m.clicks)}</text>`;
    bars += `<text x="${x + bw / 2}" y="${H - PB + 12}" text-anchor="middle" class="axis-label">${esc(STRATS[i].label)}</text>`;
    bars += `<text x="${x + bw / 2}" y="${H - PB + 22}" text-anchor="middle" class="axis-label">${fmtEur(m.cost)} · ${fmtCpc(m.cpc)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">${bars}</svg>`;
}

function budgetCurves() {
  const W = 620, H = 240, PL = 48, PB = 30, PT = 14, PR = 16;
  const maxY = 400;
  const X = (i) => PL + (i / (BUDGETS.length - 1)) * (W - PL - PR);
  const Y = (c) => H - PB - (c / maxY) * (H - PB - PT);
  let grid = "", axes = "";
  for (const c of [100, 200, 300, 400]) {
    grid += `<line x1="${PL}" y1="${Y(c)}" x2="${W - PR}" y2="${Y(c)}" class="gridline"/>`;
    axes += `<text x="${PL - 5}" y="${Y(c) + 3}" text-anchor="end" class="axis-label">${fmtInt(c)}${NBSP}€</text>`;
  }
  BUDGETS.forEach((b, i) => {
    axes += `<text x="${X(i)}" y="${H - PB + 13}" text-anchor="middle" class="axis-label">${fmtInt(b)}</text>`;
  });
  axes += `<line x1="${PL}" y1="${Y(0)}" x2="${W - PR}" y2="${Y(0)}" class="axis"/>`;
  axes += `<line x1="${PL}" y1="${PT}" x2="${PL}" y2="${Y(0)}" class="axis"/>`;
  let curves = "";
  STRATS.forEach((s, si) => {
    const pathPts = BUDGETS.map((b, i) => {
      const m = matrixBy[s.key].get(b);
      return `${X(i).toFixed(1)} ${Y(m.cost).toFixed(1)}`;
    });
    curves += `<polyline points="${pathPts.join(", ")}" class="curve-${si}" fill="none"/>`;
  });
  /* palier recommandé : 150 € (index 2) */
  const m150 = presence.get(150);
  curves += `<circle cx="${X(2).toFixed(1)}" cy="${Y(m150.cost).toFixed(1)}" r="5" class="point-intent"/>`;
  curves += `<text x="${X(2).toFixed(1)}" y="${(Y(m150.cost) - 9).toFixed(1)}" text-anchor="middle" class="point-label">test recommandé</text>`;
  /* ligne identité budget = dépense, en pointillé jusqu'à 400 */
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">${grid}${axes}${curves}</svg>`;
}

/* ---------- tableaux ---------- */

const FAM_SHORT = {
  A: "Gastronomie, dîner gastronomique",
  B: "Italien et franco-italien",
  C: "Le soir, ce soir, dîner",
  D: "Réserver une table",
  E: "Occasions — amoureux, anniversaire",
  F: "Découverte locale — où manger",
  G: "Menu, carte, accords mets-vins",
  H: "Marque et notoriété propre",
};
const famRows = Object.keys(FAM_LABELS)
  .map((f) => {
    const a = famAgg[f];
    return `<tr><td style="white-space:nowrap"><span class="geo-code fam-chip">${f}</span> ${esc(FAM_SHORT[f])}</td><td class="num">${a.n}</td><td class="num">${a.vol ? fmtInt(a.vol) : "—"}</td></tr>`;
  })
  .join("\n");

const topKw = [...ads.historical]
  .filter((h) => h.vol > 0)
  .sort((a, b) => b.vol - a.vol)
  .slice(0, 10);
const topKwRows = topKw
  .map((h) => {
    const k = keywords.find((x) => x.text === h.text);
    const bid = h.bidHigh > 0 ? `${fmtCpc(h.bidLow)} – ${fmtCpc(h.bidHigh)}` : "non fournie";
    return `<tr${k?.famille === "H" ? ' class="brand-row"' : ""}><td>${esc(h.text)}</td><td>${k ? k.famille : "—"}</td><td class="num">${fmtInt(h.vol)}</td><td>${esc(h.comp || "—")}</td><td class="num">${bid}</td></tr>`;
  })
  .join("\n");

const matrixRows = BUDGETS.map((b) => {
  const em = b === 150 ? ' class="emphasis"' : "";
  return `<tr${em}><td class="num">${fmtEur(b)}</td><td>${cell(matrixBy[STRATS[0].key].get(b))}</td><td>${cell(matrixBy[STRATS[1].key].get(b))}</td><td>${cell(matrixBy[STRATS[2].key].get(b))}</td></tr>`;
}).join("\n");

/* annexes mots-clés */
function annexRows(fams) {
  return keywords
    .filter((k) => fams.includes(k.famille))
    .map((k) => {
      const h = k.hist;
      if (k.groupedWith) {
        return `<tr class="no-vol"><td>${esc(k.text)}</td><td>${k.famille}</td><td>${esc(k.intention)}</td><td colspan="4">regroupé par Google avec «${NBSP}${esc(k.groupedWith)}${NBSP}»</td></tr>`;
      }
      if (!h) {
        return `<tr class="no-vol"><td>${esc(k.text)}</td><td>${k.famille}</td><td>${esc(k.intention)}</td><td colspan="4">aucune donnée renvoyée</td></tr>`;
      }
      const noVol = !h.vol;
      return `<tr${noVol ? ' class="no-vol"' : ""}><td>${esc(k.text)}</td><td>${k.famille}</td><td>${esc(k.intention)}</td><td class="num">${h.vol ? fmtInt(h.vol) : "—"}</td><td>${esc(h.comp || "—")}</td><td class="num">${h.bidLow > 0 ? fmtCpc(h.bidLow) : "—"}</td><td class="num">${h.bidHigh > 0 ? fmtCpc(h.bidHigh) : "—"}</td></tr>`;
    })
    .join("\n");
}

const exclRows = portfolio.exclusions
  .map((e) => `<tr><td>${esc(e.text)}</td><td>${esc(e.raison)}</td></tr>`)
  .join("\n");

const communesList = ads.meta.communes.join(", ").replace("Merignac", "Mérignac").replace("Begles", "Bègles");

/* ---------- HTML ---------- */

const ANNEX_HEAD = `<tr><th>Mot-clé</th><th>Fam.</th><th>Intention</th><th class="num">Vol./mois</th><th>Concurrence</th><th class="num">Ench. basse</th><th class="num">Ench. haute</th></tr>`;

const TOTAL_PAGES = 12;
const footer = (section, num) =>
  `<footer class="footer"><span><img class="mini-mark" src="../assets/nmf/logo-symbol.png" alt="">Audit La Rencontre · ${section}</span><span>${String(num).padStart(2, "0")} / ${TOTAL_PAGES}</span></footer>`;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Audit digital &amp; potentiel Google Ads — Restaurant La Rencontre, Bordeaux</title>
<link rel="stylesheet" href="assets/audit-design-lock.css">
<style>
  /* Styles de composition propres au rapport — aucun token redéfini, aucune couleur hors palette. */
  .two-col { display: grid; grid-template-columns: 1.12fr .88fr; gap: 9mm; }
  .two-col-even { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
  .table-fig { display: grid; grid-template-columns: 1.14fr .86fr; gap: 8mm; }
  .mt-md { margin-top: 4mm; }
  .mt-lg { margin-top: 6mm; }
  .mt-xl { margin-top: 8mm; }
  .body-copy { font-size: 8.2pt; line-height: 1.5; color: var(--nmf-navy-2); }
  .body-copy + .body-copy { margin-top: 2.5mm; }

  .metric-strip.four { grid-template-columns: repeat(4, 1fr); }
  .metric-strip.four .metric { min-height: 21mm; }
  .metric-strip.four .metric strong { font-size: 18pt; color: var(--nmf-blue); }

  .seg-intent { fill: var(--nmf-blue); }
  .seg-generic { fill: var(--nmf-violet-data); }
  .seg-brand { fill: var(--technical-teal); }
  .seg-label { fill: var(--muted); font-family: var(--font-body); font-size: 9px; }
  .bar-0 { fill: var(--nmf-blue); }
  .bar-1 { fill: var(--nmf-violet-data); }
  .bar-2 { fill: var(--technical-teal); }
  .bar-value { fill: var(--nmf-navy); font-family: var(--font-mono); font-size: 11px; font-weight: 700; }
  .curve-0 { stroke: var(--nmf-blue); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .curve-1 { stroke: var(--nmf-violet-data); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .curve-2 { stroke: var(--technical-teal); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .legend-dot { display: inline-block; width: 2.4mm; height: 2.4mm; border-radius: 50%; margin-right: 1.4mm; vertical-align: -.2mm; }
  .legend-dot.d0 { background: var(--nmf-blue); }
  .legend-dot.d1 { background: var(--nmf-violet-data); }
  .legend-dot.d2 { background: var(--technical-teal); }
  .legend { color: var(--muted); font-size: 6.8pt; }
  .legend span + span { margin-left: 5mm; }

  .fam-chip { display: inline-block; min-width: 4mm; padding: .4mm 1mm; margin-right: 1.2mm; text-align: center; font-size: 6.4pt; }
  .brand-row td { color: var(--muted); }

  .screen-shot { width: 100%; display: block; }
  .screen-frame.desktop { height: 78mm; }
  .screen-frame.desktop img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
  .screen-frame.mobile { height: 108mm; }
  .screen-frame.mobile img { width: 100%; height: 100%; object-fit: cover; object-position: top; }

  .editorial-photo { width: 100%; height: 64mm; object-fit: cover; border: .25mm solid var(--line-dark); filter: saturate(.9); }

  .check-table td:first-child { font-weight: 650; color: var(--nmf-navy); }

  .score-grid { padding: 5mm 5.5mm; }
  .score-grid .score-value { color: var(--nmf-violet); font-family: var(--font-mono); font-size: 24pt; font-weight: 700; line-height: 1; }
  .score-axes { margin-top: 3mm; }
  .score-axes .axis-row { display: grid; grid-template-columns: 34mm 1fr 9mm; gap: 2.6mm; align-items: center; padding: 1.25mm 0; font-size: 6.8pt; color: var(--nmf-navy-2); }
  .score-axes .gauge-track { height: 2.6mm; }

  .gauge-block { margin-top: 3mm; }
  .gauge-block .gauge-head { display: flex; justify-content: space-between; font-size: 7pt; color: var(--nmf-navy-2); margin-bottom: 1.4mm; }
  .gauge-block .gauge-head strong { font-family: var(--font-mono); color: var(--nmf-blue); }

  .annex-table { table-layout: fixed; font-size: 6.2pt; line-height: 1.13; }
  .annex-table th { font-size: 5.3pt; padding: 1.5mm 1.2mm; }
  .annex-table td { padding: 1.1mm 1.2mm; }
  .annex-table td:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .annex-table col.c-kw { width: 44mm; }
  .annex-table col.c-fam { width: 8mm; }
  .annex-table col.c-int { width: 20mm; }
  .annex-table col.c-vol { width: 14mm; }
  .annex-table col.c-comp { width: 16mm; }
  .annex-table col.c-bid { width: 15mm; }
  tr.no-vol td { background: var(--violet-soft-72); }

  .fam-table { font-size: 6.6pt; line-height: 1.2; }
  .fam-table td { padding: 1.5mm 1.6mm; }
  .fam-table th { padding: 1.8mm 1.6mm; }

  .excl-table { font-size: 6.4pt; line-height: 1.2; }
  .excl-table td { padding: 1.5mm 1.5mm; }
  .excl-table td:first-child { width: 44mm; font-weight: 650; color: var(--nmf-navy); }

  .params-block { padding: 4mm 4.5mm; border: .25mm solid var(--line-dark); background: var(--white-76); font-size: 6.8pt; line-height: 1.5; color: var(--nmf-navy-2); }
  .params-block strong { font-family: var(--font-mono); font-size: 6.6pt; }

  .closing-contact { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; margin-top: 6mm; }
  .contact-line small { display: block; color: var(--muted); font-size: 6.4pt; }
  .contact-line strong { display: block; margin-top: 1mm; color: var(--nmf-navy); font-size: 8.6pt; }

  .verdict-chip { display: inline-block; padding: 1.8mm 2.6mm; border: .3mm solid var(--violet-border-strong); background: var(--nmf-violet-soft); color: var(--nmf-violet); font-family: var(--font-mono); font-size: 7.6pt; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }

  .negative-band { padding: 3.5mm 4mm; border-left: .7mm solid var(--nmf-violet); font-size: 7.4pt; line-height: 1.45; }
  .appendix-note { padding: 3mm 3.5mm; border-left: .7mm solid var(--nmf-violet); font-size: 6.8pt; line-height: 1.45; }

  .cover-facts .geo-code { padding: .6mm 1.4mm; }
</style>
</head>
<body data-nmf-audit-design="1.1">

<!-- ============ PAGE 1 — COUVERTURE ============ -->
<section class="page cover">
  <img class="cover-photo" src="../assets/cover-devanture.jpg" alt="Devanture du restaurant La Rencontre, rue Maréchal Joffre à Bordeaux">
  <div class="cover-content">
    <div class="cover-meta">
      <img class="brand-logo cover-logo" src="../assets/nmf/logo-light-bg.png" alt="NMF Agence">
      <span>Audit client · Août 2026</span>
    </div>
    <div class="cover-copy">
      <div class="kicker">Audit digital &amp; potentiel Google Ads</div>
      <h1>La Rencontre<br>Remplir le service du soir, <span class="accent">en direct, sans commission.</span></h1>
      <p class="lede">Audit du site, de la réservation en ligne et du potentiel Google Ads pour le dîner gastronomique franco-italien — Bordeaux et première couronne, forecast septembre 2026.</p>
    </div>
    <div class="cover-ring">
      <span class="territory-label">Bordeaux &amp; couronne</span>
      <span class="territory-code">33</span>
    </div>
    <div class="cover-facts">
      <span>restaurantlarencontre.com</span>
      <span>77 mots-clés · 30 appels forecast · 0 erreur API</span>
      <span>${TOTAL_PAGES} pages</span>
    </div>
  </div>
</section>

<!-- ============ PAGE 2 — SYNTHÈSE EXÉCUTIVE ============ -->
<section class="page">
  <header class="page-head">
    <div>
      <div class="kicker">Synthèse exécutive</div>
      <h2>Une table déjà désirée, un test Google Ads possible dès que la mesure est en place.</h2>
    </div>
    <div class="head-status">Verdict<br>conditionnel</div>
  </header>

  <p class="lead mt-lg">La Rencontre part avec des atouts rares pour un restaurant indépendant&nbsp;: une note Google de 5,0 sur plus de 150 avis, une réservation en ligne en direct — donc sans commission de plateforme — et un socle technique sérieux. La demande locale est réelle et son coût d'accès est bas. Il manque une seule brique avant d'investir&nbsp;: la preuve que chaque réservation est mesurée.</p>

  <div class="metric-strip">
    <div class="metric"><strong class="tabular">${fmtInt(nonBrandVol)}</strong><span>recherches locales par mois hors marque, sur 77 mots-clés du service du soir — donnée Google Ads, Bordeaux + 9 communes, moy. 12 mois (juil. 2025 – juin 2026)</span></div>
    <div class="metric"><strong class="tabular">0,67${NBSP}€</strong><span>enchère haut de page médiane constatée sur le portefeuille — donnée Google Ads (échantillon de 21 mots-clés avec enchère fournie)</span></div>
    <div class="metric"><strong class="tabular">${fmtInt(p500.clicks)}</strong><span>clics mensuels au plafond démontré du marché, pour ${fmtEur(p500.cost)} dépensés — forecast Google, stratégie Présence, sept. 2026</span></div>
  </div>

  <div class="two-col-even mt-lg">
    <div>
      <h3 class="section-title">Ce qui joue déjà pour vous</h3>
      <div class="finding"><i></i><div><strong>Réputation exceptionnelle.</strong> 5,0 sur plus de 150 avis Google — un niveau que peu de tables bordelaises affichent, et le premier facteur de clic sur une annonce locale.</div></div>
      <div class="finding"><i></i><div><strong>Réservation en direct, zéro commission.</strong> Le module de réservation appartient au site&nbsp;: chaque couvert gagné par la publicité reste à 100&nbsp;% dans la maison.</div></div>
      <div class="finding"><i></i><div><strong>Socle technique propre.</strong> Données structurées Restaurant, site en 5 langues, balises SEO cohérentes, GA4 et Search Console en place — confirmé dans le HTML le 02/08/2026.</div></div>
    </div>
    <div>
      <h3 class="section-title">Ce qui freine encore</h3>
      <div class="finding"><i></i><div><strong>Conversion non mesurée.</strong> GA4 est présent mais aucun événement «&nbsp;réservation confirmée&nbsp;» n'a pu être vérifié. Sans lui, impossible de piloter une campagne. <span class="priority p0">P0</span></div></div>
      <div class="finding"><i></i><div><strong>Module de réservation ouvert sur un jour fermé.</strong> Observé le lundi 03/08&nbsp;: date du jour présélectionnée, message «&nbsp;Pas de créneaux disponibles&nbsp;». <span class="priority p1">P1</span></div></div>
      <div class="finding"><i></i><div><strong>Page d'accueil lourde sur mobile.</strong> 4,9${NBSP}Mo et 58 requêtes&nbsp;; affichage principal en 3,7${NBSP}s (cible &lt;&nbsp;2,5${NBSP}s) — mesure Lighthouse locale du 03/08. À alléger avant d'acheter du trafic. <span class="priority p1">P1</span></div></div>
    </div>
  </div>

  <div class="negative-band mt-lg"><strong>Le chiffre à retenir&nbsp;:</strong> «&nbsp;restaurant italien bordeaux&nbsp;» pèse à lui seul ${fmtInt(3600)} recherches par mois dans la zone, avec une concurrence publicitaire faible et une enchère haut de page autour de 0,53${NBSP}€. La demande existe, elle est peu disputée, et elle correspond exactement à la carte.</div>

  <div class="decision-band mt-lg">
    <strong>Recommandation NMF</strong>
    <p>Go pour un test encadré — sous une condition&nbsp;: valider l'événement de conversion «&nbsp;réservation confirmée&nbsp;» dans GA4 et le relier à Google Ads avant le premier euro dépensé. Ensuite, lancer une campagne Présence à ${fmtEur(150)}/mois sur la fenêtre septembre–décembre, le pic annuel de demande.</p>
  </div>

  <p class="source mt-md">Sources&nbsp;: API Google Ads (KeywordPlanIdeaService + KeywordPlanService), extraction du 02/08/2026, zone Bordeaux + 9 communes, langue française, réseau Search, forecast 01–30/09/2026 · observations site des 02–03/08/2026 (desktop 1440×900, mobile 390×844) · mesure Lighthouse 12 locale du 03/08/2026 (émulation mobile).</p>
  ${footer("Synthèse exécutive", 2)}
</section>

<!-- ============ PAGE 3 — ENTREPRISE ET MARCHÉ ============ -->
<section class="page">
  <header class="page-head">
    <div>
      <div class="kicker">Entreprise &amp; marché</div>
      <h2>Une maison franco-italienne identifiée, sur un marché bordelais dense mais peu disputé en publicité.</h2>
    </div>
    <div class="head-status">Périmètre<br>service du soir</div>
  </header>

  <div class="two-col mt-lg">
    <div>
      <p class="body-copy">La Rencontre est le restaurant de <strong>Rosie Maillard et Francesco Vastola</strong>, au 42 rue Maréchal Joffre, au cœur de Bordeaux. La maison défend une cuisine gastronomique franco-italienne moderne — pâtes fraîches maison, producteurs locaux nommés (Les Petits Capucins, Racé, Maison Meneau, Vino Vista) — prolongée par une épicerie fine attenante.</p>
      <p class="body-copy">Cet audit porte volontairement sur <strong>le service du soir uniquement</strong>&nbsp;: dîner à la carte du mercredi au samedi, 19h00–21h15, complété le mardi soir en été. Le déjeuner, l'épicerie et la privatisation existent mais restent hors périmètre du test publicitaire — un portefeuille de mots-clés ne vaut que s'il couvre ce que l'on vend réellement au moment où l'annonce tourne.</p>
      <h3 class="section-title mt-lg">Présence publique vérifiée</h3>
      <div class="finding"><i></i><div><strong>Fiche Google Établissement.</strong> Note 5,0 — plus de 150 avis. Lien d'avis actif depuis le site. Observé le 02/08/2026.</div></div>
      <div class="finding"><i></i><div><strong>Site propriétaire en 5 langues.</strong> Français, anglais, espagnol, italien, allemand — sitemaps dédiés générés par langue, confirmé dans le HTML.</div></div>
      <div class="finding"><i></i><div><strong>Réseaux actifs.</strong> Instagram, Facebook et TikTok reliés depuis le pied de page. Aucune présence TheFork ou TripAdvisor reliée depuis le site&nbsp;: la réservation reste un canal direct, sans intermédiaire commissionné.</div></div>
    </div>
    <div>
      <img class="editorial-photo" src="../assets/chefs.jpg" alt="Rosie Maillard et Francesco Vastola, chefs du restaurant La Rencontre">
      <p class="photo-caption">Rosie Maillard et Francesco Vastola — photo publiée par l'établissement (restaurantlarencontre.com).</p>
      <div class="negative-band mt-lg"><strong>L'angle à tenir&nbsp;:</strong> à Bordeaux, la recherche «&nbsp;italien&nbsp;» dépasse la recherche «&nbsp;gastronomique&nbsp;» (${fmtInt(4230)} contre ${fmtInt(3190)} recherches par mois sur le portefeuille). La Rencontre peut capter les deux publics avec la même carte — c'est un positionnement que ni une trattoria ni une table étoilée ne peuvent tenir.</div>
      <h3 class="section-title mt-lg">Concurrents observés dans la zone</h3>
      <p class="body-copy">Les Mauvais Garçons, Maison Nouvelle, Le Pressoir d'Argent, Osteria Palatino et GruppoMimo apparaissent sur les mêmes recherches locales. Leurs marques ont été <strong>exclues du ciblage</strong>&nbsp;: enchérir sur le nom d'un confrère coûte cher et n'apporte pas le bon client.</p>
    </div>
  </div>

  <p class="source mt-md" style="position:absolute;bottom:14mm;left:15mm;right:15mm;">Sources&nbsp;: pages publiques restaurantlarencontre.com (02/08/2026), fiche Google de l'établissement, portefeuille de mots-clés NMF (77 expressions), données Google Ads du 02/08/2026.</p>
  ${footer("Entreprise & marché", 3)}
</section>

<!-- ============ PAGE 4 — AUDIT VISUEL ============ -->
<section class="page">
  <header class="page-head">
    <div>
      <div class="kicker">Audit visuel &amp; expérience</div>
      <h2>Un site à la hauteur de la table — un détail de réservation à corriger avant d'acheter du trafic.</h2>
    </div>
    <div class="head-status">Preuves<br>02–03/08/2026</div>
  </header>

  <div class="two-col mt-lg">
    <div>
      <div class="screen-frame desktop">
        <span class="screen-label">Desktop · accueil · 1440×900</span>
        <img src="../shots/desktop-home.png" alt="Capture de la page d'accueil en desktop">
      </div>
      <p class="photo-caption">Capture du 03/08/2026 — restaurantlarencontre.com. Hero photographique, note 5 étoiles «&nbsp;Plus de 150 avis&nbsp;», double appel à l'action Menu / Réserver, bouton Réserver persistant.</p>
      <h3 class="section-title mt-lg">Ce que montre l'écran</h3>
      <div class="finding"><i></i><div><strong>Hiérarchie claire et premium.</strong> Nom, statut d'ouverture en temps réel, preuve sociale et deux actions — tout tient dans le premier écran, sans surcharge.</div></div>
      <div class="finding"><i></i><div><strong>Le bouton Réserver suit le visiteur.</strong> L'action principale reste accessible en permanence, desktop comme mobile.</div></div>
      <div class="finding"><i></i><div><strong>Un écran d'entrée précède la première visite.</strong> Tant qu'un cookie de session n'est pas posé, un splash s'affiche avant l'accueil — confirmé dans le HTML. Pour un clic payant, chaque écran intermédiaire coûte des visiteurs. À alléger ou à réserver aux visites directes. <span class="priority p1">P1</span></div></div>
    </div>
    <div>
      <div class="screen-frame mobile">
        <span class="screen-label">Mobile · réservation · 390×844</span>
        <img src="../shots/mobile-reservation.png" alt="Capture du module de réservation en mobile">
      </div>
      <p class="photo-caption">Capture du 03/08/2026 (un lundi, jour de fermeture)&nbsp;: la date du jour est présélectionnée et le module répond «&nbsp;Pas de créneaux disponibles à cette date&nbsp;».</p>
      <div class="negative-band mt-lg"><strong>Constat prioritaire&nbsp;:</strong> le module s'ouvre sur la date du jour, y compris les jours de fermeture. Un visiteur qui arrive un lundi lit «&nbsp;pas de créneaux&nbsp;» avant même d'avoir choisi — le réflexe naturel est de partir. Présélectionner le prochain jour de service supprimerait cette friction en une seule évolution. <span class="priority p1">P1</span></div>
    </div>
  </div>

  <div class="decision-band mt-lg" style="position:absolute;bottom:14mm;left:15mm;right:15mm;">
    <strong>Verdict landing page</strong>
    <p>L'accueil est une vitrine crédible, mais le trafic payant doit atterrir sur /reservation&nbsp;: c'est là que la décision se prend. Condition&nbsp;: corriger la date présélectionnée et afficher le téléphone cliquable pour les tables de plus de 6 couverts.</p>
  </div>
  ${footer("Audit visuel", 4)}
</section>

<!-- ============ PAGE 5 — CONVERSION, TECHNIQUE, SEO ============ -->
<section class="page">
  <header class="page-head">
    <div>
      <div class="kicker">Conversion · technique · SEO local</div>
      <h2>Les fondations sont saines&nbsp;; la mesure de conversion est le seul chantier bloquant.</h2>
    </div>
    <div class="head-status">4 contrôles<br>clés</div>
  </header>

  <div class="metric-strip four mt-lg">
    <div class="metric"><strong>OK</strong><span>Données structurées schema.org «&nbsp;Restaurant&nbsp;» complètes — confirmé dans le HTML, 02/08/2026</span></div>
    <div class="metric"><strong>84<span style="font-size:9pt">/100</span></strong><span>score de performance Lighthouse — mesure locale du 03/08/2026, émulation mobile</span></div>
    <div class="metric"><strong>OK</strong><span>GA4 installé (flux confirmé dans le HTML) + propriété Search Console vérifiée</span></div>
    <div class="metric"><strong>?</strong><span>événement de conversion «&nbsp;réservation confirmée&nbsp;» — non vérifié à ce jour</span></div>
  </div>

  <table class="check-table mt-lg">
    <tr><th style="width:34mm">Point contrôlé</th><th>Constat</th><th>Correction proposée</th><th style="width:12mm">Priorité</th></tr>
    <tr><td>Mesure de la réservation</td><td>GA4 est présent, mais aucun événement de conversion relié à la confirmation de réservation n'a pu être vérifié depuis l'extérieur.</td><td>Déclencher un événement GA4 dédié à la confirmation, l'importer comme conversion dans Google Ads, tester de bout en bout.</td><td><span class="priority p0">P0</span></td></tr>
    <tr><td>Module de réservation</td><td>Date du jour présélectionnée même un jour de fermeture — «&nbsp;Pas de créneaux disponibles&nbsp;» en premier message (observé lundi 03/08).</td><td>Présélectionner le prochain jour de service&nbsp;; proposer d'emblée les 2–3 prochaines dates ouvertes.</td><td><span class="priority p1">P1</span></td></tr>
    <tr><td>Performance web</td><td>Lighthouse mobile 84/100 (mesure locale, 03/08)&nbsp;: stabilité visuelle excellente (CLS 0,001) mais affichage principal en 3,7${NBSP}s pour 4,9${NBSP}Mo et 58 requêtes — les images pèsent l'essentiel. SEO 100/100, bonnes pratiques 100/100.</td><td>Compresser et redimensionner les images (WebP/AVIF, tailles adaptées), différer les médias hors écran, puis re-mesurer via PageSpeed en conditions réelles.</td><td><span class="priority p1">P1</span></td></tr>
    <tr><td>Écran d'entrée</td><td>Splash servi à la première visite tant que le cookie de session est absent — un écran entre le clic et le contenu.</td><td>Le limiter aux visites directes, ou l'exclure des pages de destination publicitaires.</td><td><span class="priority p1">P1</span></td></tr>
    <tr><td>SEO on-page</td><td>Titles et metas travaillés, canonical propre, Open Graph complet, sitemap multilingue à jour (généré le 02/08).</td><td>Rien de bloquant — poursuivre l'enrichissement des contenus (menus, saisons, événements).</td><td><span class="priority p2">P2</span></td></tr>
    <tr><td>Réservations &gt; 6 couverts</td><td>Le module plafonne à 6 couverts et renvoie vers le téléphone — choix assumé et affiché.</td><td>Conserver&nbsp;; rendre le numéro cliquable dans le module et mesurer les appels comme conversion secondaire.</td><td><span class="priority p2">P2</span></td></tr>
  </table>

  <div class="decision-band mt-lg">
    <strong>Conclusion sur le contact</strong>
    <p>Le chemin de réservation existe, en direct et sans commission — c'est l'actif le plus précieux du site. Tant que la confirmation n'envoie pas d'événement mesurable, une campagne roulerait à l'aveugle&nbsp;: c'est le seul vrai préalable au lancement.</p>
  </div>

  <p class="source mt-md">Méthode&nbsp;: rendu réel navigateur (desktop 1440×900, mobile émulé 390×844), lecture du HTML servi, sitemap et en-têtes — 02–03/08/2026 · Lighthouse 12.x exécuté en local le 03/08/2026 (Chrome headless, émulation mobile). L'API PageSpeed est restée en quota (HTTP 429) sur la fenêtre d'audit&nbsp;: la mesure terrain (CrUX) reste à relever.</p>
  ${footer("Conversion & SEO", 5)}
</section>

<!-- ============ PAGE 6 — ÉTUDE DE MOTS-CLÉS ============ -->
<section class="page">
  <header class="page-head">
    <div>
      <div class="kicker">Étude de mots-clés</div>
      <h2>${fmtInt(nonBrandVol)} recherches par mois à conquérir — et une marque qui pèse déjà ${fmtInt(brandVol)}.</h2>
    </div>
    <div class="head-status">77 mots-clés<br>8 familles</div>
  </header>

  <div class="metric-strip mt-lg">
    <div class="metric"><strong class="tabular">77</strong><span>mots-clés testés, construits sur les seules prestations vendues le soir — 8 familles, ${noVolCount} expressions sans volume mesurable conservées en annexe</span></div>
    <div class="metric"><strong class="tabular">${fmtInt(nonBrandVol)}</strong><span>recherches mensuelles hors marque (moyenne 12 mois) — les regroupements de variantes par Google sont signalés en annexe</span></div>
    <div class="metric"><strong class="tabular">${fmtInt(brandVol)}</strong><span>recherches mensuelles sur la marque et les chefs — à protéger en SEO, pas à acheter en priorité</span></div>
  </div>

  <div class="mt-lg">
    <p class="figure-title">Où va le volume&nbsp;: intention commerciale, requêtes génériques, marque</p>
    ${stackedPortfolioBar()}
    <p class="source">Donnée Google Ads — volumes moyens mensuels juil. 2025 – juin 2026, Bordeaux + 9 communes. Intention = familles commerciales et transactionnelles du portefeuille NMF.</p>
  </div>

  <div class="table-fig mt-lg">
    <div>
      <p class="figure-title">Les 10 volumes les plus forts du portefeuille</p>
      <table class="mt-md">
        <tr><th>Mot-clé</th><th>Fam.</th><th class="num">Vol./mois</th><th>Conc.</th><th class="num">Enchère page 1</th></tr>
        ${topKwRows}
      </table>
      <p class="source mt-md">«&nbsp;la rencontre restaurant&nbsp;» (${fmtInt(2400)}/mois) est une expression courante&nbsp;: une part de ce volume peut ne pas viser l'établissement — lecture prudente recommandée.</p>
    </div>
    <div>
      <p class="figure-title">Volume ne veut pas dire valeur&nbsp;: enchère haut de page par mot-clé</p>
      ${scatterVolCpc()}
      <p class="legend mt-md"><span><i class="legend-dot d0"></i>Intention commerciale</span><span><i class="legend-dot d1"></i>Générique</span></p>
      <p class="source mt-md">Une enchère élevée signale la concurrence publicitaire, pas automatiquement la rentabilité. «&nbsp;romantique&nbsp;» (0,95${NBSP}€) est plus disputé que «&nbsp;italien&nbsp;» (0,53${NBSP}€) pour 11 fois moins de volume.</p>
      <p class="figure-title mt-lg">Répartition par famille</p>
      <table class="fam-table mt-md">
        <tr><th>Famille</th><th class="num">Mots-clés</th><th class="num">Vol./mois</th></tr>
        ${famRows}
      </table>
    </div>
  </div>

  <div class="negative-band mt-lg"><strong>27 expressions écartées volontairement&nbsp;:</strong> pas cher, étoilé/Michelin, pizzeria, livraison, emporter, brunch, midi, dimanche/lundi, groupes &amp; privatisation, emploi, recettes, 5 marques concurrentes et 2 plateformes commissionnées. La liste complète et les raisons figurent en annexe C — un clic évité vaut autant qu'un clic gagné.</div>

  ${footer("Étude de mots-clés", 6)}
</section>

<!-- ============ PAGE 7 — PROJECTION GOOGLE ADS ============ -->
<section class="page">
  <header class="page-head">
    <div>
      <div class="kicker">Projection Google Ads</div>
      <h2>À ${fmtEur(150)} par mois, la stratégie Présence achète déjà les trois quarts du marché disponible.</h2>
    </div>
    <div class="head-status">Forecast<br>sept. 2026</div>
  </header>

  <div class="table-fig mt-lg">
    <div>
      <p class="figure-title">Trois stratégies comparées au même palier de ${fmtEur(150)}/mois</p>
      <table class="mt-md">
        <tr><th>Stratégie</th><th class="num">Dépense prévue</th><th class="num">Clics/mois</th><th class="num">CPC réel prévu</th></tr>
        <tr class="emphasis"><td>Présence — maximiser les clics</td><td class="num">${fmtEur(p150.cost)}</td><td class="num">${fmtInt(p150.clicks)}</td><td class="num">${fmtCpc(p150.cpc)}</td></tr>
        <tr><td>Haut de page — CPC manuel 0,67${NBSP}€</td><td class="num">${fmtEur(matrixBy[STRATS[1].key].get(150).cost)}</td><td class="num">${fmtInt(matrixBy[STRATS[1].key].get(150).clicks)}</td><td class="num">${fmtCpc(matrixBy[STRATS[1].key].get(150).cpc)}</td></tr>
        <tr><td>Domination — CPC manuel 1,01${NBSP}€</td><td class="num">${fmtEur(matrixBy[STRATS[2].key].get(150).cost)}</td><td class="num">${fmtInt(matrixBy[STRATS[2].key].get(150).clicks)}</td><td class="num">${fmtCpc(matrixBy[STRATS[2].key].get(150).cpc)}</td></tr>
      </table>
      <p class="body-copy mt-md">Les stratégies à CPC manuel plafonnent très vite&nbsp;: Haut de page s'arrête à ${fmtEur(43)} dépensés quel que soit le budget, Domination à ${fmtEur(73)}. La stratégie Présence est la seule qui continue de convertir le budget en clics — c'est elle qui sert de base au test.</p>
      <div class="gauge-block">
        <div class="gauge-head"><span>Part du plafond de clics captée à ${fmtEur(150)}/mois</span><strong>${Math.round((p150.clicks / p500.clicks) * 100)}${NBSP}%</strong></div>
        <div class="gauge-track"><i style="width:${Math.round((p150.clicks / p500.clicks) * 100)}%"></i></div>
      </div>
      <div class="gauge-block">
        <div class="gauge-head"><span>Part du budget réellement dépensée à ce palier</span><strong>${Math.round((p150.cost / 150) * 100)}${NBSP}%</strong></div>
        <div class="gauge-track"><i style="width:${Math.round((p150.cost / 150) * 100)}%"></i></div>
      </div>
      <div class="negative-band mt-lg"><strong>Hypothèse NMF — clairement séparée des données Google&nbsp;:</strong> si 3 à 6&nbsp;% des ${fmtInt(p150.clicks)} clics mensuels aboutissent à une réservation (fourchette prudente pour une réservation directe, sans historique client fiable), le test produirait 5 à 9 tables par mois, soit un coût de 16 à 32${NBSP}€ par table réservée. Ces chiffres sont des hypothèses à valider par la mesure, pas des promesses.</div>
    </div>
    <div>
      <p class="figure-title">Clics mensuels prévus à ${fmtEur(150)} — par stratégie</p>
      ${strategyBars()}
      <p class="source">Forecast Google Ads, période 01–30/09/2026, réseau Search, zone Bordeaux + 9 communes.</p>
      <div class="score-grid mt-lg">
        <span class="kicker">Score de préparation</span>
        <div class="score-value mt-md">24<span style="font-size:11pt">${NBSP}/${NBSP}30</span></div>
        <div class="score-axes">
          <div class="axis-row"><span>Demande locale</span><div class="gauge-track"><i style="width:100%"></i></div><span class="num">5/5</span></div>
          <div class="axis-row"><span>Qualité des requêtes</span><div class="gauge-track"><i style="width:80%"></i></div><span class="num">4/5</span></div>
          <div class="axis-row"><span>Capacité de conversion</span><div class="gauge-track"><i style="width:80%"></i></div><span class="num">4/5</span></div>
          <div class="axis-row"><span>Mesure</span><div class="gauge-track"><i style="width:40%"></i></div><span class="num">2/5</span></div>
          <div class="axis-row"><span>Pertinence de l'offre</span><div class="gauge-track"><i style="width:100%"></i></div><span class="num">5/5</span></div>
          <div class="axis-row"><span>Couverture géographique</span><div class="gauge-track"><i style="width:80%"></i></div><span class="num">4/5</span></div>
        </div>
        <p class="source mt-md">Score de maturité interne NMF — 6 axes notés sur 5 d'après les constats des pages 4 à 6. Ce n'est pas une probabilité de réussite. L'axe «&nbsp;Mesure&nbsp;» remonte à 5 dès la validation de l'événement de conversion.</p>
      </div>
    </div>
  </div>

  <p class="source" style="position:absolute;bottom:16mm;left:15mm;right:15mm;">Donnée Google Ads&nbsp;: 30 forecasts distincts (10 budgets × 3 stratégies), mêmes mots-clés, même zone, même période. Les leads et coûts par table sont des hypothèses NMF étiquetées comme telles.</p>
  ${footer("Projection Ads", 7)}
</section>

<!-- ============ PAGE 8 — PREUVE BUDGÉTAIRE ============ -->
<section class="page">
  <header class="page-head">
    <div>
      <div class="kicker">Preuve budgétaire</div>
      <h2>Le marché plafonne à ${fmtEur(p500.cost)} de dépense utile — inutile d'y mettre plus, prouvé sur 10 paliers.</h2>
    </div>
    <div class="head-status">30 appels<br>0 erreur</div>
  </header>

  <div class="mt-lg">
    <p class="figure-title">Budget demandé contre dépense réellement prévue — 10 paliers, 3 stratégies</p>
    ${budgetCurves()}
    <p class="legend mt-md"><span><i class="legend-dot d0"></i>Présence</span><span><i class="legend-dot d1"></i>Haut de page</span><span><i class="legend-dot d2"></i>Domination</span></p>
  </div>

  <div class="mt-lg">
    <p class="figure-title">Matrice complète — dépense prévue · clics · CPC réel, par palier mensuel</p>
    <table class="mt-md">
      <tr><th class="num" style="width:20mm">Budget demandé</th><th>Présence (max. clics)</th><th>Haut de page (CPC 0,67${NBSP}€)</th><th>Domination (CPC 1,01${NBSP}€)</th></tr>
      ${matrixRows}
    </table>
  </div>

  <div class="decision-band mt-lg">
    <strong>Plafond démontré</strong>
    <p>En stratégie Présence, la dépense prévue se fige à ${fmtEur(p500.cost)} et ${fmtInt(p500.clicks)} clics dès le palier de ${fmtEur(500)}, et reste identique à ±0&nbsp;% sur les paliers ${fmtEur(750)}, ${fmtEur(1000)}, ${fmtEur(1500)} et ${fmtEur(2000)}. Les trois critères de preuve NMF sont réunis (dépense &lt;&nbsp;90&nbsp;% du budget, deux paliers supérieurs, stabilité ±5&nbsp;%)&nbsp;: le plafond d'inventaire est démontré. Le budget de test conseillé reste ${fmtEur(150)}&nbsp;: au-delà de ${fmtEur(300)}, chaque clic supplémentaire coûte plus du double (CPC 1,58 à 1,89${NBSP}€) pour 19 clics de mieux.</p>
  </div>

  <p class="source mt-md">Donnée Google Ads — KeywordPlanService, 30 appels, portefeuille et zone constants, période 01–30/09/2026, devise EUR, 0 erreur API.</p>
  ${footer("Preuve budgétaire", 8)}
</section>

<!-- ============ PAGE 9 — PLAN D'ACTION ET CLÔTURE ============ -->
<section class="page">
  <header class="page-head">
    <div>
      <div class="kicker">Plan d'action</div>
      <h2>Quatre étapes, dans cet ordre — la mesure d'abord, le budget ensuite.</h2>
    </div>
    <div class="head-status">Fenêtre<br>sept. – déc.</div>
  </header>

  <div class="roadmap mt-lg">
    <div class="road-row">
      <span class="phase">01 · Prérequis</span>
      <h3>Prouver la mesure</h3>
      <p style="color:var(--muted);font-size:7.2pt;line-height:1.45">Événement GA4 «&nbsp;réservation confirmée&nbsp;» déclenché à la confirmation réelle, importé comme conversion dans Google Ads, testé de bout en bout. Consentement cookies conservé tel quel.</p>
      <span style="color:var(--nmf-navy);font-size:6.5pt;text-align:right">Condition du go <span class="priority p0">P0</span></span>
    </div>
    <div class="road-row">
      <span class="phase">02 · Fondations</span>
      <h3>Lisser le chemin de réservation</h3>
      <p style="color:var(--muted);font-size:7.2pt;line-height:1.45">Date présélectionnée sur le prochain service ouvert, téléphone cliquable pour les groupes, splash écarté des atterrissages publicitaires, images compressées pour passer sous 2,5${NBSP}s d'affichage principal.</p>
      <span style="color:var(--nmf-navy);font-size:6.5pt;text-align:right">Conversion <span class="priority p1">P1</span></span>
    </div>
    <div class="road-row">
      <span class="phase">03 · Test encadré</span>
      <h3>Campagne Présence à ${fmtEur(150)}/mois</h3>
      <p style="color:var(--muted);font-size:7.2pt;line-height:1.45">Réseau Search seul, zone des 10 communes, familles gastronomie, italien, occasions et découverte, 27 exclusions appliquées, atterrissage sur /reservation. Prévision Google&nbsp;: ${fmtInt(p150.clicks)} clics/mois à ${fmtCpc(p150.cpc)}.</p>
      <span style="color:var(--nmf-navy);font-size:6.5pt;text-align:right">Donnée Google</span>
    </div>
    <div class="road-row">
      <span class="phase">04 · Pilotage</span>
      <h3>Décider sur les chiffres</h3>
      <p style="color:var(--muted);font-size:7.2pt;line-height:1.45">Lecture hebdomadaire des termes réels, coupe des requêtes hors cible, montée vers ${fmtEur(200)}–${fmtEur(300)} uniquement si le coût par table mesuré le justifie. La fenêtre sept.–déc. concentre le pic annuel de demande (17${NBSP}000+ recherches/mois contre 8${NBSP}600 en juin).</p>
      <span style="color:var(--nmf-navy);font-size:6.5pt;text-align:right">Décision sur données</span>
    </div>
  </div>

  <div class="closing-copy mt-xl">
    <span class="verdict-chip">Go pour un test encadré</span>
    <p class="body-copy mt-md" style="font-size:9pt">La Rencontre a déjà fait le plus dur&nbsp;: une table que les clients notent 5,0, un site qui lui ressemble et une réservation qui n'appartient qu'à elle. Ce qu'il reste à faire tient en une phrase — mesurer, corriger deux frictions, puis laisser ${fmtEur(150)} par mois aller chercher les ${fmtInt(nonBrandVol)} recherches qui la cherchent déjà sans la connaître.</p>
    <div class="closing-contact">
      <div class="contact-line"><small>Échanger sur l'audit</small><strong>contact@nmf-agence.com</strong></div>
      <div class="contact-line"><small>Découvrir l'agence</small><strong>www.nmf-agence.com</strong></div>
      <div class="contact-line"><small>Périmètre proposé</small><strong>Site · SEO local · Google Ads</strong></div>
    </div>
    <img class="brand-logo closing-logo mt-lg" src="../assets/nmf/logo-light-bg.png" alt="NMF Agence">
  </div>
  ${footer("Plan d'action", 9)}
</section>

<!-- ============ PAGE 10 — ANNEXE A ============ -->
<section class="page">
  <header class="page-head">
    <div>
      <div class="kicker">Annexe A</div>
      <h2>Inventaire des mots-clés — familles A à C (1/2)</h2>
    </div>
    <div class="head-status">34 mots-clés</div>
  </header>
  <div class="appendix-note mt-md">Liste exacte envoyée au forecast, dans l'ordre du portefeuille. Volumes&nbsp;: moyenne mensuelle juillet 2025 – juin 2026, zone Bordeaux + 9 communes. Les lignes sur fond violet clair n'ont pas de volume mesurable renvoyé par Google (elles restent ciblables). Enchères&nbsp;: fourchette de haut de page fournie par Google quand elle existe.</div>
  <table class="annex-table mt-md">
    <colgroup><col class="c-kw"><col class="c-fam"><col class="c-int"><col class="c-vol"><col class="c-comp"><col class="c-bid"><col class="c-bid"></colgroup>
    ${ANNEX_HEAD}
    ${annexRows(["A", "B"])}
  </table>
  <p class="source mt-md">A — ${esc(FAM_LABELS.A)} · B — ${esc(FAM_LABELS.B)}</p>
  <table class="annex-table mt-md">
    <colgroup><col class="c-kw"><col class="c-fam"><col class="c-int"><col class="c-vol"><col class="c-comp"><col class="c-bid"><col class="c-bid"></colgroup>
    ${ANNEX_HEAD}
    ${annexRows(["C"])}
  </table>
  <p class="source mt-md">C — ${esc(FAM_LABELS.C)}</p>
  ${footer("Annexe mots-clés", 10)}
</section>

<!-- ============ PAGE 11 — ANNEXE B ============ -->
<section class="page">
  <header class="page-head">
    <div>
      <div class="kicker">Annexe B</div>
      <h2>Inventaire des mots-clés — familles D à H (2/2)</h2>
    </div>
    <div class="head-status">43 mots-clés</div>
  </header>
  <table class="annex-table mt-md">
    <colgroup><col class="c-kw"><col class="c-fam"><col class="c-int"><col class="c-vol"><col class="c-comp"><col class="c-bid"><col class="c-bid"></colgroup>
    ${ANNEX_HEAD}
    ${annexRows(["D", "E", "F"])}
  </table>
  <p class="source" style="margin-top:1.5mm">D — ${esc(FAM_LABELS.D)} · E — ${esc(FAM_LABELS.E)} · F — ${esc(FAM_LABELS.F)}</p>
  <table class="annex-table" style="margin-top:2mm">
    <colgroup><col class="c-kw"><col class="c-fam"><col class="c-int"><col class="c-vol"><col class="c-comp"><col class="c-bid"><col class="c-bid"></colgroup>
    ${ANNEX_HEAD}
    ${annexRows(["G", "H"])}
  </table>
  <p class="source" style="margin-top:1.5mm">G — ${esc(FAM_LABELS.G)} · H — ${esc(FAM_LABELS.H)}</p>
  ${footer("Annexe mots-clés", 11)}
</section>

<!-- ============ PAGE 12 — ANNEXE C ============ -->
<section class="page">
  <header class="page-head">
    <div>
      <div class="kicker">Annexe C</div>
      <h2>Exclusions volontaires et paramètres du forecast</h2>
    </div>
    <div class="head-status">27 exclusions</div>
  </header>
  <div class="two-col-even mt-md">
    <div>
      <p class="figure-title">Expressions écartées du ciblage — et pourquoi</p>
      <table class="excl-table mt-md">
        <tr><th>Expression</th><th>Raison d'exclusion</th></tr>
        ${exclRows}
      </table>
    </div>
    <div>
      <p class="figure-title">Paramètres exacts de l'extraction</p>
      <div class="params-block mt-md">
        <strong>Date d'extraction</strong> — 02/08/2026, 22h32 UTC<br>
        <strong>Outil</strong> — API Google Ads officielle&nbsp;: KeywordPlanIdeaService (volumes historiques) et KeywordPlanService (forecasts)<br>
        <strong>Zone</strong> — 10 communes ciblées individuellement&nbsp;: ${esc(communesList)}<br>
        <strong>Langue</strong> — français (languageConstants/1002)<br>
        <strong>Réseau</strong> — Google Search seul, devise EUR<br>
        <strong>Période de forecast</strong> — 01/09/2026 → 30/09/2026<br>
        <strong>Portefeuille</strong> — 77 mots-clés (liste exacte en annexes A–B), constant sur les 30 appels<br>
        <strong>Stratégies</strong> — Présence (maximisation des clics)&nbsp;· Haut de page (CPC manuel 0,67${NBSP}€, médiane des enchères haut de page)&nbsp;· Domination (CPC manuel 1,01${NBSP}€, médiane des enchères de domination)<br>
        <strong>Paliers testés</strong> — ${BUDGETS.map((b) => fmtInt(b)).join(", ")}${NBSP}€/mois<br>
        <strong>Appels exécutés</strong> — 30 (10 paliers × 3 stratégies), tous aboutis<br>
        <strong>Erreurs API</strong> — 0
      </div>
      <div class="appendix-note mt-lg">Regroupements Google&nbsp;: «&nbsp;restaurant gastro bordeaux&nbsp;» est compté dans le volume de «&nbsp;restaurant gastronomique bordeaux&nbsp;» (variante proche)&nbsp;: les volumes des familles ne s'additionnent pas à l'unité près, les totaux publiés en tiennent compte. «&nbsp;la rencontre restaurant&nbsp;» est une expression courante du langage&nbsp;: une part de son volume peut ne pas viser l'établissement.</div>
      <div class="appendix-note mt-md">Limites connues&nbsp;: les volumes Google sont arrondis par tranches&nbsp;; les forecasts de septembre 2026 reposent sur l'historique de la zone et peuvent différer des résultats réels&nbsp;; l'API PageSpeed est restée en quota (HTTP 429) pendant la fenêtre d'audit — la performance publiée provient d'une mesure Lighthouse 12 locale du 03/08/2026 (Chrome headless, émulation mobile), livrée avec le rapport (lighthouse-mobile.json)&nbsp;; la mesure terrain CrUX reste à relever. Aucun chiffre de ce rapport ne provient d'un autre client ou d'une extrapolation non testée.</div>
      <p class="source mt-lg">Rapport établi par NMF Agence — août 2026. Données sources livrées avec le rapport&nbsp;: donnees-google-ads-brutes.json, portefeuille-mots-cles.json, captures des 02–03/08/2026.</p>
    </div>
  </div>
  ${footer("Annexe paramètres", 12)}
</section>

</body>
</html>
`;

const out = resolve(ROOT, "report/audit-la-rencontre-2026.html");
writeFileSync(out, html, "utf8");
console.log(`OK — ${out}`);
console.log(`totalVol=${totalVol} brand=${brandVol} nonBrand=${nonBrandVol} noVol=${noVolCount}`);
console.log(`p150: cost=${p150.cost} clicks=${p150.clicks} cpc=${p150.cpc}`);
