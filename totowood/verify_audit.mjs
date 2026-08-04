import { existsSync, readFileSync } from "node:fs";

const html = readFileSync(new URL("./report/audit-totowood-2026.html", import.meta.url), "utf8");
const data = JSON.parse(
  readFileSync(new URL("./data/google-ads-seine-et-marne-expanded.json", import.meta.url), "utf8"),
);
const keywordData = JSON.parse(
  readFileSync(
    new URL("./data/google-ads-seine-et-marne-keyword-stats.json", import.meta.url),
    "utf8",
  ),
);
const annexDataScript = readFileSync(
  new URL("./report/keyword-annex-data.js", import.meta.url),
  "utf8",
);

const expectedBudgets = [50, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000];
const expectedAt500 = {
  Présence: { spend: 517, clicks: 512, cpc: 1.01 },
  "Haut de page": { spend: 517, clicks: 315, cpc: 1.64 },
  Domination: { spend: 517, clicks: 247, cpc: 2.09 },
};
const expectedAt2000 = {
  Présence: { spend: 2067, clicks: 926 },
  "Haut de page": { spend: 1258, clicks: 768 },
  Domination: { spend: 1875, clicks: 897 },
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(data.extractedAt === "2026-07-28", "Date d'extraction Google Ads incorrecte");
assert(data.zone === "Seine-et-Marne", "La zone Google Ads doit rester la Seine-et-Marne");
assert(data.geoTargetConstant === "geoTargetConstants/9040885", "Geo target Seine-et-Marne incorrect");
assert(data.totals.forecastedKeywords === 90, "Le portefeuille prévu doit contenir 90 mots-clés");
assert(data.totals.monthlyCommercialIntentVolume === 580, "Volume commercial mensuel incorrect");
assert(data.totals.monthlyForecastPortfolioVolume === 1560, "Volume du portefeuille prévu incorrect");
assert(data.totals.averageTopOfPageCpc === 3.03, "CPC moyen haut de page incorrect");
assert(data.budgetTests.complete === true, "Grille Google Ads marquée incomplète");
assert(data.budgetTests.apiErrors.length === 0, "Erreurs API présentes");
assert(data.budgetTests.separateApiCalls === 30, "Le total doit être de 30 appels API");
assert(
  JSON.stringify(data.budgetTests.requiredMonthlyBudgets) === JSON.stringify(expectedBudgets),
  "La grille budgétaire ne couvre pas exactement 50 à 2 000 €",
);
assert(data.comparisonBaseline.zone === "Seine-et-Marne", "Zone de comparaison incorrecte");
assert(data.comparisonBaseline.forecastedKeywords === 50, "Portefeuille de référence incorrect");
assert(data.comparisonBaseline.presenceSpend === 106, "Dépense de référence incorrecte");
assert(data.comparisonBaseline.presenceClicks === 23, "Clics de référence incorrects");
assert(keywordData.source === "Google Ads generateKeywordHistoricalMetrics", "Source des statistiques mots-clés incorrecte");
assert(keywordData.extractedAt === "2026-07-28", "Date des statistiques mots-clés incorrecte");
assert(keywordData.volumeGeo.label === "Seine-et-Marne", "Les volumes doivent rester ciblés Seine-et-Marne");
assert(keywordData.keywordStats.length === 90, "L'annexe doit contenir 90 mots-clés");
assert(
  JSON.stringify(keywordData.keywordStats.map((item) => item.keyword)) ===
    JSON.stringify(data.forecastPortfolio),
  "L'annexe ne reprend pas exactement le portefeuille prévu",
);
assert(
  new Set(keywordData.keywordStats.map((item) => item.keyword)).size === 90,
  "L'annexe contient des mots-clés en double",
);
assert(
  keywordData.keywordStats.filter((item) => item.avgMonthlySearches > 0).length === 79,
  "Le nombre de mots-clés avec volume est incorrect",
);
assert(
  keywordData.keywordStats.filter(
    (item) => item.averageCpc != null || item.highTopOfPageBid != null,
  ).length === 78,
  "Le nombre de mots-clés avec CPC est incorrect",
);
assert(
  keywordData.keywordStats.filter((item) => item.competitionIndex != null).length === 60,
  "Le nombre de mots-clés avec concurrence est incorrect",
);
assert(
  annexDataScript.includes("window.keywordAnnexData") &&
    annexDataScript.includes('"requestedKeywords":90'),
  "Les données d'annexe navigateur ne sont pas à jour",
);

for (const scenario of Object.keys(expectedAt500)) {
  const summary = data.forecast.find((item) => item.scenario === scenario);
  assert(summary, `Synthèse absente : ${scenario}`);
  assert(summary.verifiedCap === false, `Un plafond ne doit pas être affirmé : ${scenario}`);

  const points = data.budgetTests.results.filter((item) => item.scenario === scenario);
  assert(points.length === 10, `Le scénario ${scenario} doit contenir dix paliers`);
  assert(
    JSON.stringify(points.map((item) => item.requestedBudget)) === JSON.stringify(expectedBudgets),
    `Paliers incomplets ou désordonnés : ${scenario}`,
  );

  const point500 = points.find((item) => item.requestedBudget === 500);
  assert(point500.forecastSpend === expectedAt500[scenario].spend, `Dépense à 500 € incorrecte : ${scenario}`);
  assert(point500.clicks === expectedAt500[scenario].clicks, `Clics à 500 € incorrects : ${scenario}`);
  assert(point500.averageCpc === expectedAt500[scenario].cpc, `CPC à 500 € incorrect : ${scenario}`);

  const point2000 = points.find((item) => item.requestedBudget === 2000);
  assert(point2000.forecastSpend === expectedAt2000[scenario].spend, `Dépense à 2 000 € incorrecte : ${scenario}`);
  assert(point2000.clicks === expectedAt2000[scenario].clicks, `Clics à 2 000 € incorrects : ${scenario}`);
}

const recommended = expectedAt500["Haut de page"];
const leadsMin = recommended.clicks * 0.02;
const leadsMax = recommended.clicks * 0.05;
assert(Math.round(leadsMin) === 6, "Leads bas du test recommandé incorrects");
assert(Math.round(leadsMax) === 16, "Leads hauts du test recommandé incorrects");
assert(Math.round(recommended.spend / leadsMax) === 33, "CPL bas du test recommandé incorrect");
assert(Math.round(recommended.spend / leadsMin) === 82, "CPL haut du test recommandé incorrect");

const basePageCount = (
  html.match(/<section class="page(?! appendix-page)(?:\s|")/g) || []
).length;
const annexPageCount = Math.ceil(keywordData.keywordStats.length / 30);
assert(basePageCount === 9, "Le corps du rapport doit contenir 9 pages");
assert(basePageCount + annexPageCount === 12, "Le rapport final doit contenir 12 pages");
for (const needle of [
  "12 pages · données Google Ads réelles",
  "Seine-et-Marne · 90 mots-clés",
  "1 560 recherches/mois",
  "15 830",
  "580",
  "3,03 €",
  "30 appels",
  "0 erreur",
  "500 €",
  "517 €",
  "512",
  "315",
  "247",
  "6–16 leads",
  "33 et 82 €",
  "2 067 / 926",
  "1 258 / 768",
  "1 875 / 897",
  "Aucun plafond n’est affirmé",
  "08 / 12",
  "09 / 12",
  "Annexe · inventaire Google Ads",
  "correspondance Expression (PHRASE)",
  "keyword-annex-data.js",
]) {
  assert(html.includes(needle), `Mention requise absente du rapport : ${needle}`);
}
for (const obsolete of [
  "8 pages · données Google Ads réelles",
  "9 pages · données Google Ads réelles",
  "/ 09",
  "18 appels Google Ads",
  "Île-de-France : un plafond",
  "Google Ads API, Île-de-France",
  "selon le budget demandé en Île-de-France",
  "Ciblage Île-de-France",
  "plafond à 418 €",
  "73 360",
  "1 370",
  "27 juillet 2026",
  "hypothèse NMF de 4–7 %",
]) {
  assert(!html.includes(obsolete), `Mention obsolète encore présente : ${obsolete}`);
}

for (const asset of [
  "./assets/nmf/logo-light-bg.png",
  "./assets/nmf/logo-symbol.png",
  "./assets/totowood/photos/project-1.jpg",
  "./assets/totowood/photos/project-2.jpg",
  "./assets/totowood/photos/project-3.jpg",
  "./report/keyword-annex-data.js",
]) {
  assert(existsSync(new URL(asset, import.meta.url)), `Ressource manquante : ${asset}`);
}

console.log("Audit vérifié : 12 pages dont 3 annexes, 90 mots-clés détaillés et 30 appels budgétaires.");
