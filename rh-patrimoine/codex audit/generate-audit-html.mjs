import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(".").replaceAll("\\", "/");
const asset = (name) => `file:///${root}/assets/rhpatrimoine/${name}`;
const out = resolve("output/pdf/audit-rh-patrimoine-nmf.html");

const colors = { intention: "#2a78d6", generic: "#eb6834", brands: "#1baf7a" };

function marketStack() {
  const total = 1855;
  const data = [
    ["Projets proches d'une décision", 610, colors.intention],
    ["Recherches générales", 1109, colors.generic],
    ["Noms concurrents à bloquer", 136, colors.brands],
  ];
  let x = 20;
  const pieces = data.map(([label, value, color]) => {
    const width = 660 * value / total;
    const pct = (100 * value / total).toFixed(1).replace(".", ",");
    const r = `<rect x="${x}" y="34" width="${width}" height="34" fill="${color}"/>`;
    x += width;
    return r + `<text x="${x-width/2}" y="56" text-anchor="middle" class="inside">${pct} %</text>`;
  }).join("");
  const legendPos = [[35,102],[370,102],[35,132]];
  const labels = data.map(([label, value, color], i) => {
    const [lx, ly] = legendPos[i];
    return `<circle cx="${lx}" cy="${ly}" r="6" fill="${color}"/><text x="${lx+12}" y="${ly+5}" class="label">${label} · ${value}</text>`;
  }).join("");
  return `<svg class="figure" viewBox="0 0 720 150" role="img" aria-label="Répartition des 1855 requêtes distinctes entre intention commerciale, génériques et marques à exclure">
    <title>Répartition du marché</title><text x="20" y="18" class="chart-title">Répartition des requêtes distinctes</text>${pieces}${labels}</svg>`;
}

function scatter() {
  const pts = [
    [210,4.60,"estimation maison",colors.intention], [140,6.67,"estimation bien",colors.intention],
    [70,6.46,"estimation immobilière",colors.intention], [40,9.26,"estimation appartement",colors.intention],
    [50,3.69,"vente appartement",colors.intention], [50,5.95,"estimation gratuite",colors.intention],
    [90,1.91,"meilleurs agents prix",colors.intention], [70,1.37,"maison location vente",colors.intention],
    [40,1.24,"vente à terme",colors.intention], [2900,1.37,"agence immobilière",colors.generic],
    [2400,1.06,"immobilière",colors.generic], [1300,.67,"agence à proximité",colors.generic],
    [590,.99,"autour de moi",colors.generic], [590,.17,"Laforêt immobilier",colors.generic],
    [480,.80,"vente immobilière",colors.generic], [480,2.58,"meilleur agent",colors.generic],
    [390,1.89,"grand sud immobilier",colors.generic], [320,1.37,"viager",colors.generic],
    [720,1.55,"Espaces Atypiques",colors.brands], [590,.78,"Nestenn",colors.brands],
    [170,1.40,"Arthurimmo",colors.brands], [140,.24,"Orpi",colors.brands], [140,.20,"L'Adresse",colors.brands],
    [110,1.64,"VEFA",colors.brands], [70,.11,"contact immo",colors.brands],
    [70,.62,"Patrice Besse",colors.brands], [70,1.26,"Mon Aide Immo",colors.brands],
  ];
  const xmin=Math.log10(30), xmax=Math.log10(3200), ymin=0, ymax=10;
  const X=v=>60+(Math.log10(v)-xmin)/(xmax-xmin)*610;
  const Y=v=>250-(v-ymin)/(ymax-ymin)*210;
  const dots=pts.map(([v,c,l,col],i)=>{
    const dx = l.includes("agence immobilière") ? -105 : 8;
    const dy = l.includes("agence immobilière") ? -8 : (i%2?12:-8);
    const show = ["estimation appartement","estimation maison","agence immobilière","Nestenn"].includes(l);
    const display = l === "estimation appartement" ? "estim. appartement" : l === "agence immobilière" ? "agence immo" : l;
    return `<circle cx="${X(v)}" cy="${Y(c)}" r="5" fill="${col}" stroke="#fff" stroke-width="1.5"/>${show?`<text x="${X(v)+dx}" y="${Y(c)+dy}" class="point-label">${display}</text>`:""}`;
  }).join("");
  const grid=[0,2,4,6,8,10].map(v=>`<line x1="60" x2="670" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="48" y="${Y(v)+4}" text-anchor="end" class="tick">${v} €</text>`).join("");
  const xt=[40,100,300,1000,3000].map(v=>`<text x="${X(v)}" y="270" text-anchor="middle" class="tick">${v}</text>`).join("");
  return `<svg class="figure scatter" viewBox="0 0 720 290" role="img" aria-label="Nuage de points opposant volume mensuel et CPC haut de page">
  <title>Inversion volume valeur</title><text x="60" y="18" class="chart-title">Beaucoup de recherches ne veut pas dire beaucoup de valeur</text>${grid}<line x1="60" x2="670" y1="250" y2="250" class="axis"/>${xt}${dots}<text x="365" y="287" text-anchor="middle" class="axis-label">Nombre de recherches par mois</text></svg>`;
}

function bars(metric, values, suffix) {
  const cols=["#5c6c83","#7B4FE0","#162033"];
  const max=Math.max(...values);
  const labels=["Présence","Haut de page","Domination"];
  const rects=values.map((v,i)=>{
    const h=120*v/max; const x=48+i*120;
    return `<rect x="${x}" y="${155-h}" width="64" height="${h}" rx="3" fill="${cols[i]}"/><text x="${x+32}" y="${145-h}" text-anchor="middle" class="bar-value">${v.toLocaleString("fr-FR")}${suffix}</text><text x="${x+32}" y="178" text-anchor="middle" class="bar-label">${labels[i]}</text>`;
  }).join("");
  return `<svg class="small-chart" viewBox="0 0 400 195" role="img" aria-label="Comparaison ${metric} des trois scénarios"><title>${metric}</title><text x="20" y="18" class="chart-title">${metric}</text><line x1="28" x2="380" y1="155" y2="155" class="axis"/>${rects}</svg>`;
}

function gauges() {
  const data=[["Présence",5.6,"#5c6c83"],["Haut de page",10,"#7B4FE0"],["Domination",11.2,"#162033"]];
  return `<svg class="figure" viewBox="0 0 720 126" role="img" aria-label="Part des recherches atteinte par scénario"><title>Part des recherches atteinte</title><text x="20" y="18" class="chart-title">Part des recherches atteinte</text>${data.map(([l,v,c],i)=>{const y=40+i*27;return `<text x="20" y="${y+12}" class="label">${l}</text><rect x="150" y="${y}" width="500" height="17" rx="8" fill="#e5e9ef"/><rect x="150" y="${y}" width="${500*v/15}" height="17" rx="8" fill="${c}"/><text x="664" y="${y+12}" class="label">${String(v).replace('.',',')} %</text>`}).join("")}</svg>`;
}

const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Audit RH Patrimoine</title>
<style>
@page{size:A4;margin:0}*{box-sizing:border-box;font-family:Helvetica,Arial,sans-serif}body{margin:0;background:#ddd;font-family:Helvetica,Arial,sans-serif;color:#172033;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{position:relative;width:210mm;height:297mm;margin:0 auto;background-color:#f7f7f4;background-image:radial-gradient(circle at 89% 84%,rgba(123,79,224,.08) 0 1.2px,transparent 1.4px),linear-gradient(135deg,transparent 0 92%,rgba(17,24,39,.035) 92% 94%,transparent 94% 96%,rgba(123,79,224,.04) 96%);background-size:8px 8px,100% 100%;page-break-after:always;overflow:hidden;padding:18mm 15mm 17mm 28mm}.page:last-child{page-break-after:auto}
.rail{position:absolute;left:0;top:0;width:17mm;height:100%;background:#111827}.rail:before{content:"";display:block;height:52mm;background:#7B4FE0}.rail span{position:absolute;bottom:18mm;left:7mm;color:white;font-size:10px;font-weight:700;letter-spacing:.8px;writing-mode:vertical-rl;transform:rotate(180deg)}
.footer{position:absolute;left:28mm;right:15mm;bottom:8mm;border-top:1px solid #d9dee7;padding-top:3mm;display:flex;justify-content:space-between;color:#667085;font-size:12px}.kicker{font-size:14px;letter-spacing:1px;color:#7B4FE0;font-weight:800;margin:0 0 4mm}.title{font-size:31px;line-height:1.06;letter-spacing:-.5px;margin:0 0 4mm;color:#111827}.rule{height:1px;background:#d9dee7;margin-bottom:4mm}.body{font-size:15px;line-height:1.36}.muted{color:#667085}.hero{width:100%;height:58mm;object-fit:cover;display:block}.caption{background:#111827;color:#b5bdca;font-size:13px;padding:2.5mm 3mm;margin-bottom:5mm}.cover{padding:0;color:white;background:#111827;background-image:none}.cover .bg{position:absolute;width:100%;height:100%;object-fit:cover;filter:brightness(.28)}.cover .stripe{position:absolute;left:0;top:0;width:8mm;height:100%;background:#7B4FE0}.cover .content{position:absolute;left:25mm;right:22mm;top:25mm}.cover .logo{width:28mm;height:28mm;object-fit:contain;margin-bottom:45mm}.cover h1{font-size:39px;margin:0 0 5mm}.cover h2{font-size:22px;font-weight:400;margin:0}.goldline{width:54mm;height:2px;background:#c8a36a;margin:10mm 0}.cover .meta{position:absolute;left:25mm;bottom:36mm;font-size:14px;line-height:2}.cover .ticket{position:absolute;right:24mm;bottom:28mm;border:2px solid #c8a36a;border-radius:4mm;padding:8mm 7mm;text-align:center;font-size:13px}.cover .ticket b{font-size:15px;display:block;margin-bottom:3mm}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #d9dee7;background:white;margin-bottom:8mm}.metric{text-align:center;padding:5mm 2mm;border-right:1px solid #d9dee7}.metric:last-child{border:0}.metric b{display:block;font-size:30px}.metric span{font-size:12.5px;color:#667085;font-weight:700}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin:5mm 0}.card{background:white;border:1px solid #d9dee7;border-top:3px solid #7B4FE0;padding:4mm}.card.good{border-top-color:#15856f}.card.bad{border-top-color:#c84b4b}.card h3{font-size:15px;margin:0 0 2mm}.card p{font-size:13.5px;line-height:1.34;color:#667085;margin:0}.note{display:grid;grid-template-columns:34mm 1fr;align-items:center;background:#eee9ff;border-left:3px solid #7B4FE0;padding:4mm;margin-top:5mm}.note b{font-size:13px;color:#7B4FE0}.note p{font-size:14px;line-height:1.34;margin:0}table{width:100%;border-collapse:collapse;font-size:14px;margin:4mm 0}th{background:#111827;color:white;text-align:left;padding:2.8mm 2.2mm;font-size:14px}td{padding:2.4mm 2.2mm;border:1px solid #d9dee7}tbody tr:nth-child(even){background:#eef0f3}.priority{background:#eee9ff!important}.two{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.figure{width:100%;display:block;background:white;margin:3mm 0}.small-chart{width:100%;background:white}.chart-title{font:700 22px Helvetica;fill:#172033}.label{font:18px Helvetica;fill:#344054}.inside{font:700 18px Helvetica;fill:white}.tick{font:17px Helvetica;fill:#667085}.axis-label{font:17px Helvetica;fill:#667085}.point-label{font:16px Helvetica;fill:#172033}.grid{stroke:#e0e4ea;stroke-width:1}.axis{stroke:#98a2b3;stroke-width:1}.bar-value{font:700 18px Helvetica;fill:#172033}.bar-label{font:17px Helvetica;fill:#344054}.source{font-size:12.5px;color:#667085;line-height:1.34}.tag{display:inline-block;border:1px solid #c8a36a;padding:1.5mm 3mm;font-size:12px;font-weight:700;color:#7a5b2c;margin-right:2mm}.score{font-size:31px;font-weight:800;color:#7B4FE0}.compact td{padding:2mm 2.2mm}.cover-source{position:absolute;left:25mm;bottom:18mm;font-size:12px;color:#cbd1dc}
.note{grid-template-columns:42mm 1fr}
.screen{width:100%;height:53mm;object-fit:cover;object-position:top;border:2px solid #d7dce5;border-radius:2mm;display:block}.screen.mobile{height:62mm;object-position:top}.screen-grid{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.proof{background:white;border:1px solid #d7dce5;border-left:5px solid #ef4444;padding:3mm 4mm;margin:3mm 0}.proof.warn{border-left-color:#f59e0b}.proof.good{border-left-color:#10b981}.proof b{display:block;font-size:14px;margin-bottom:1mm}.proof p{font-size:13.5px;line-height:1.32;margin:0;color:#475467}.badrow td{background:#feecec!important}.warnrow td{background:#fff3d6!important}.goodrow td{background:#e7f7ef!important}.bluerow td{background:#e8f2ff!important}th{background:#6d42d8}.priority td{background:#eee8ff!important}
.mobile-proof-layout{display:grid;grid-template-columns:64mm 1fr;gap:5mm;align-items:start}.mobile-native{display:block;width:100%;height:auto;max-height:202mm;object-fit:contain;border:2px solid #d7dce5;border-radius:2mm;background:white}.desktop-native{display:block;width:100%;height:auto;object-fit:contain;border:2px solid #d7dce5;border-radius:2mm;background:white}.mobile-proof-layout .caption{margin-bottom:0}.mobile-proof-layout table{margin-top:4mm}.mobile-proof-layout .proof{margin:3mm 0}
.editorial-grid{display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin:9mm 0 7mm}.editorial-col h2{font-size:18px;margin:0 0 4mm;padding-bottom:2mm;border-bottom:3px solid #7B4FE0}.editorial-col.good h2{border-color:#159477}.editorial-item{display:grid;grid-template-columns:8mm 1fr;gap:2mm;padding:3.5mm 0;border-bottom:1px solid #d9dee7}.editorial-item:last-child{border-bottom:0}.editorial-item .num{font-size:13px;font-weight:800;color:#7B4FE0}.editorial-item b{font-size:14px;display:block;margin-bottom:1mm}.editorial-item p{font-size:13.5px;line-height:1.34;color:#566176;margin:0}.decision{background:#111827;color:white;padding:6mm;border-left:5px solid #c8a36a;margin-top:5mm}.decision .eyebrow{font-size:11px;letter-spacing:1px;color:#c8a36a;font-weight:800}.decision p{font-size:15px;line-height:1.4;margin:2mm 0 0}.decision strong{color:white}
.market-page .hero{height:50mm}.market-page .caption{margin-bottom:3mm}
</style></head><body>
<section class="page cover"><img class="bg" src="${asset("bordeaux.webp")}"><div class="stripe"></div><div class="content"><img class="logo" src="${asset("logo.png")}"><h1>RH PATRIMOINE</h1><h2>Audit digital & potentiel Google Ads</h2><div class="goldline"></div></div><div class="meta"><b>BORDEAUX MÉTROPOLE · JUILLET 2026</b><br>Rapport confidentiel préparé par NMF Agence</div><div class="ticket"><b>DONNÉES GOOGLE ADS</b>Keyword Planner<br>Prévisions natives · Bordeaux</div><div class="cover-source">Visuel de couverture issu de rhpatrimoine.com</div></section>

<section class="page"><div class="rail"><span>NMF AGENCE / AUDIT PROSPECT</span></div><p class="kicker">01 / SYNTHÈSE EXÉCUTIVE</p><h1 class="title">L'essentiel, sans détour</h1><div class="rule"></div>
<div class="metrics"><div class="metric"><b>77 %</b><span>POTENTIEL SOUS CONDITIONS</span></div><div class="metric"><b>1 207 €</b><span>BUDGET RECOMMANDÉ</span></div><div class="metric"><b>720</b><span>VISITES ESTIMÉES / MOIS</span></div><div class="metric"><b>29–43</b><span>CONTACTS / MOIS*</span></div></div>
<div class="editorial-grid"><div class="editorial-col good"><h2>Ce qui fonctionne déjà</h2><div class="editorial-item"><span class="num">01</span><div><b>Une vraie présence locale</b><p>Bordeaux Métropole est immédiatement identifiable.</p></div></div><div class="editorial-item"><span class="num">02</span><div><b>Une équipe incarnée</b><p>Les conseillers, leurs rôles et leurs coordonnées sont visibles.</p></div></div><div class="editorial-item"><span class="num">03</span><div><b>Une offre solide</b><p>Vente, estimation et gestion locative sont déjà bien documentées.</p></div></div></div><div class="editorial-col"><h2>Ce qui limite les résultats</h2><div class="editorial-item"><span class="num">01</span><div><b>Le vendeur n'a pas son propre parcours</b><p>L'accueil parle d'abord à ceux qui cherchent un bien.</p></div></div><div class="editorial-item"><span class="num">02</span><div><b>Le mobile demande trop d'effort</b><p>Le grand visuel et les cookies repoussent l'action vers le bas.</p></div></div><div class="editorial-item"><span class="num">03</span><div><b>La preuve arrive trop tard</b><p>Les avis devraient rassurer juste avant l'appel ou le formulaire.</p></div></div></div></div>
<div class="decision"><span class="eyebrow">NOTRE RECOMMANDATION</span><p>Créer d'abord une page courte pour les propriétaires vendeurs, puis lancer le budget <strong>Haut de page à 1 207 € par mois</strong>. Google estime environ 720 visites mensuelles ; le potentiel est réel si la page transforme mieux ces visites en contacts.</p></div>
<div class="note"><b>LE CHIFFRE À RETENIR</b><p><strong>210 recherches par mois</strong> concernent directement « estimation maison » à Bordeaux.</p></div>
<p class="source">* 29 à 43 contacts : hypothèse NMF si 4 à 6 visiteurs sur 100 appellent ou remplissent le formulaire. Budget et visites estimés directement par Google.</p><div class="footer"><span>Audit RH Patrimoine · Google Ads au 22 juillet 2026</span><span>2 / 8</span></div></section>

<section class="page market-page"><div class="rail"><span>NMF AGENCE / AUDIT PROSPECT</span></div><p class="kicker">02 / ENTREPRISE & MARCHÉ</p><h1 class="title">Une agence locale, six métiers, deux priorités</h1><div class="rule"></div><img class="hero" src="${asset("talence.webp")}"><div class="caption">Visuel issu de rhpatrimoine.com · ancrage Talence / Bordeaux Métropole</div>
<div class="two"><div><h3>Segments commerciaux</h3><p class="body">Vente & estimation<br>Achat ancien et neuf<br>Location<br>Gestion locative<br>Viager<br>Conseil en investissement</p></div><div><h3>Zone & positionnement</h3><p class="body">Bordeaux, Talence et communes métropolitaines. Positionnement humain, moderne et sur mesure. La valeur Ads est concentrée sur les propriétaires vendeurs et bailleurs.</p></div></div>
<h3>Concurrence visible</h3><p class="body">Sporting Immobilier, L'Agencerie, Laforêt, AD Immo, Avileo et plusieurs indépendants disposent déjà de pages locales spécialisées. RH Patrimoine possède une base crédible, mais doit rendre ses preuves et ses parcours plus immédiats.</p>
<h3>Ce que Google comprend du site</h3><table class="compact"><thead><tr><th>Contrôle autonome</th><th>Résultat</th><th>Action</th></tr></thead><tbody><tr class="goodrow"><td>Titre, résumé et page principale</td><td>Bien présents</td><td>Conserver ce socle</td></tr><tr class="warnrow"><td>Fiche numérique de l'agence</td><td>Horaires vides et adresse web incomplète</td><td>Compléter les données envoyées à Google</td></tr><tr class="warnrow"><td>Structure des titres</td><td>Deux téléphones sont lus comme des sous-titres</td><td>Réserver les titres aux vraies sections</td></tr><tr class="warnrow"><td>Coordonnées externes</td><td>Une adresse différente apparaît sur une fiche consultée</td><td>Afficher les mêmes coordonnées partout</td></tr></tbody></table>
<div class="footer"><span>Audit RH Patrimoine · Google Ads au 22 juillet 2026</span><span>3 / 8</span></div></section>

<section class="page"><div class="rail"><span>NMF AGENCE / AUDIT PROSPECT</span></div><p class="kicker">03 / AUDIT DU SITE</p><h1 class="title">Ce que voit un propriétaire en arrivant</h1><div class="rule"></div><img class="screen" src="${asset("screens/homepage-hero.png")}"><div class="caption">Capture réelle de la page d'accueil de rhpatrimoine.com · écran ordinateur</div>
<div class="proof warn"><b>Le constat</b><p>Le premier écran met surtout en avant la recherche d'un bien : type de bien, budget, surface et bouton « Rechercher ».</p></div>
<div class="proof"><b>Pourquoi cela peut faire perdre un mandat</b><p>Un propriétaire venu pour estimer ou vendre ne voit pas immédiatement un parcours conçu pour lui. Le bouton « Estimation » existe, mais reste secondaire.</p></div>
<div class="proof good"><b>La correction concrète</b><p>Pour les annonces Google « estimation », ouvrir une page dédiée avec un seul message : estimer mon bien, être rappelé, obtenir un avis de valeur.</p></div>
<table><tbody><tr class="goodrow"><td><b>Ce qui rassure</b></td><td>Marque premium, ancrage bordelais et accès visible à l'estimation.</td></tr><tr class="warnrow"><td><b>Ce qui disperse</b></td><td>Achat, location, vente et estimation se partagent le même premier écran.</td></tr></tbody></table>
<div class="footer"><span>Audit RH Patrimoine · Google Ads au 22 juillet 2026</span><span>4 / 8</span></div></section>

<section class="page"><div class="rail"><span>NMF AGENCE / AUDIT PROSPECT</span></div><p class="kicker">04 / AUDIT DU SITE</p><h1 class="title">Sur mobile, l'action arrive trop tard</h1><div class="rule"></div>
<div class="mobile-proof-layout"><div><img class="mobile-native" src="${asset("screens/mobile-home.png")}"><div class="caption">Capture mobile complète, format natif iPhone 14 — aucun recadrage</div></div><div><img class="desktop-native" src="${asset("screens/cookie-banner.png")}"><div class="caption">Bannière cookies réelle — capture complète, sans recadrage</div>
<div class="proof"><b>Le visuel prend presque tout l'écran</b><p>Le visiteur doit descendre avant d'atteindre les champs et le bouton de recherche.</p></div>
<div class="proof"><b>La bannière cookies masque le contenu</b><p>Sur une page de contact, elle peut cacher l'essentiel au moment où le prospect veut agir.</p></div>
<div class="proof good"><b>Correction recommandée</b><p>Réduire la hauteur d'ouverture, conserver un bouton « Estimer mon bien » visible et utiliser un bandeau cookies compact en bas.</p></div>
<table class="compact"><thead><tr><th>Priorité</th><th>Action</th></tr></thead><tbody><tr class="badrow"><td>Immédiate</td><td>Raccourcir le premier écran mobile</td></tr><tr class="badrow"><td>Immédiate</td><td>Réduire la bannière cookies</td></tr><tr class="warnrow"><td>Ensuite</td><td>Simplifier le formulaire à trois informations</td></tr></tbody></table></div></div>
<div class="footer"><span>Audit RH Patrimoine · Google Ads au 22 juillet 2026</span><span>5 / 8</span></div></section>

<section class="page"><div class="rail"><span>NMF AGENCE / AUDIT PROSPECT</span></div><p class="kicker">05 / RECHERCHES GOOGLE</p><h1 class="title">Les recherches qui valent le plus</h1><div class="rule"></div>${marketStack()}${scatter()}
<table class="compact"><thead><tr><th>Ce que les gens recherchent</th><th>Personnes / mois</th><th>Prix indicatif pour être visible en haut</th><th>Décision</th></tr></thead><tbody><tr class="goodrow"><td>Estimation maison</td><td>210</td><td>2,37–4,60 €</td><td><b>À cibler</b></td></tr><tr class="goodrow"><td>Estimation bien immobilier</td><td>140</td><td>2,40–6,67 €</td><td><b>À cibler</b></td></tr><tr class="goodrow"><td>Estimation immobilière</td><td>70</td><td>2,38–6,46 €</td><td><b>À cibler</b></td></tr><tr class="goodrow"><td>Estimation appartement</td><td>40</td><td>2,38–9,26 €</td><td><b>À cibler</b></td></tr><tr class="warnrow"><td>Agence immobilière</td><td>2 900</td><td>0,19–1,37 €</td><td>À limiter</td></tr></tbody></table>
<p class="source">Lecture simple : beaucoup de recherches ne signifie pas forcément beaucoup de vendeurs. Les recherches d'estimation sont moins nombreuses, mais bien plus proches d'une prise de mandat. Source : Google Ads, Bordeaux, juillet 2026.</p><div class="footer"><span>Audit RH Patrimoine · Google Ads au 22 juillet 2026</span><span>6 / 8</span></div></section>

<section class="page"><div class="rail"><span>NMF AGENCE / AUDIT PROSPECT</span></div><p class="kicker">06 / TROIS BUDGETS POSSIBLES</p><h1 class="title">Plus de visites ou une meilleure position ?</h1><div class="rule"></div>
<table><thead><tr><th>Choix</th><th>Objectif simple</th><th>Budget/mois</th><th>Visites</th><th>Coût / visite</th><th>Part des recherches</th></tr></thead><tbody><tr class="bluerow"><td>Présence</td><td>Être visible à moindre coût</td><td>310 €</td><td>400</td><td>0,77 €</td><td>5,6 %</td></tr><tr class="goodrow"><td><b>Haut de page</b></td><td><b>Viser les meilleures positions</b></td><td><b>1 207 €</b></td><td><b>720</b></td><td>1,68 €</td><td>10 %</td></tr><tr class="warnrow"><td>Domination</td><td>Occuper un maximum d'espace</td><td>1 706 €</td><td>804</td><td>2,12 €</td><td>11,2 %</td></tr></tbody></table>
<div class="two">${bars("Budget mensuel",[310,1207,1706]," €")}${bars("Visites mensuelles",[400,720,804],"")}</div>${gauges()}
<div class="note"><b>NOTRE CHOIX</b><p><strong>Haut de page.</strong> C'est le meilleur équilibre : 1 207 € pour environ 720 visites. Dépenser 499 € de plus n'apporte qu'environ 84 visites supplémentaires. Google indique aussi qu'il n'y a pas assez de recherches pour dépenser utilement au-delà.</p></div>
<p class="source">Les budgets et visites viennent directement de Google. Les 29 à 43 contacts mensuels restent une hypothèse NMF, calculée si 4 à 6 visiteurs sur 100 remplissent le formulaire ou appellent.</p><div class="footer"><span>Audit RH Patrimoine · Google Ads au 22 juillet 2026</span><span>7 / 8</span></div></section>

<section class="page"><div class="rail"><span>NMF AGENCE / AUDIT PROSPECT</span></div><p class="kicker">07 / PLAN D'ACTION</p><h1 class="title">Passer du site vitrine au dispositif d'acquisition</h1><div class="rule"></div><img class="hero" src="${asset("gestion.webp")}"><div class="caption">Visuel issu de la page Gestion locative de rhpatrimoine.com</div>
<table class="compact"><thead><tr><th>#</th><th>Ordre</th><th>Action concrète</th><th>Résultat attendu</th></tr></thead><tbody><tr class="badrow"><td>01</td><td>À corriger</td><td>Alléger le premier écran mobile et les cookies</td><td>Voir l'action plus vite</td></tr><tr class="badrow"><td>02</td><td>À créer</td><td>Une page courte « Estimer / Vendre mon bien »</td><td>Obtenir plus de vendeurs</td></tr><tr class="warnrow"><td>03</td><td>À créer</td><td>Une page courte « Confier ma gestion locative »</td><td>Obtenir plus de bailleurs</td></tr><tr class="bluerow"><td>04</td><td>À mesurer</td><td>Compter les appels, formulaires et rendez-vous</td><td>Savoir ce qui rapporte</td></tr><tr class="goodrow"><td>05</td><td>À lancer</td><td>Cibler d'abord les recherches d'estimation</td><td>Toucher les vendeurs prêts à agir</td></tr><tr class="goodrow"><td>06</td><td>À protéger</td><td>Bloquer les concurrents et recherches inutiles</td><td>Éviter de gaspiller le budget</td></tr><tr class="goodrow"><td>07</td><td>À améliorer</td><td>Couper chaque mois ce qui ne donne aucun contact</td><td>Baisser le coût par prospect</td></tr></tbody></table>
<div class="note"><b>CAP NMF</b><p>Créer les deux pages dédiées, puis lancer le scénario Haut de page à 1 207 €/mois. Ne pas dépenser 499 € de plus pour seulement 84 visites supplémentaires.</p></div><p class="kicker" style="margin-top:10mm">NMF AGENCE</p><h2>Stratégie digitale · Acquisition · Conversion</h2><p class="body">Rapport préparé pour RH Patrimoine — www.rhpatrimoine.com</p><div class="footer"><span>Audit RH Patrimoine · Google Ads au 22 juillet 2026</span><span>8 / 8</span></div></section>
</body></html>`;

writeFileSync(out, html, "utf8");
console.log(out);
