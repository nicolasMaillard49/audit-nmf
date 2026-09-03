import { readFileSync, writeFileSync } from "node:fs";

const rawPath = new URL("../tmp/forecast-totowood-77-expanded-20260728.json", import.meta.url);
const outputPath = new URL("../data/google-ads-seine-et-marne-expanded.json", import.meta.url);
const baselinePath = new URL("../data/google-ads-seine-et-marne.json", import.meta.url);
const raw = JSON.parse(readFileSync(rawPath, "utf8"));
const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));

const scenarios = raw.projection.previsionsGoogle.map((item) => ({
  scenario: item.scenario,
  strategy: item.strategie,
  monthlyBudget: item.budgetMensuel,
  clicks: item.clics,
  averageCpc: item.cpcMoyen,
  costPerClick: item.coutParClic,
  capturedVolumePercent: item.partVolume,
  inventoryCapped: item.plafonneParInventaire,
  verifiedCap: item.plafondVerifie,
  capProofBudgets: item.paliersConfirmation,
  budgetTestsComplete: item.testsBudgetairesComplets,
}));

const scenarioByName = new Map(scenarios.map((item) => [item.scenario, item]));
const budgetResults = raw.projection.courbeBudgetsGoogle.map((item) => ({
  scenario: item.scenario,
  requestedBudget: item.budgetDemandeMensuel,
  forecastSpend: item.budgetMensuel,
  clicks: item.clics,
  averageCpc: item.cpcMoyen,
}));

const allKeywords = [
  ...raw.buckets.intention,
  ...raw.buckets.generique,
  ...raw.buckets.marque,
];
const keywordByName = new Map(allKeywords.map((item) => [item.text, item]));
const keywordSelection = [
  ["dressing sur mesure", "générique qualifié"],
  ["meubles pour sous pente", "générique qualifié"],
  ["meuble pour sous escalier", "générique qualifié"],
  ["meuble sur mesure", "générique qualifié"],
  ["cuisine sur mesure", "générique qualifié"],
  ["bibliothèque sur mesure", "générique qualifié"],
  ["placard sur mesure", "générique qualifié"],
  ["meuble télé sur mesure", "générique qualifié"],
  ["menuisier sur mesure", "générique qualifié"],
  ["agencement intérieur", "générique qualifié"],
  ["prix dressing sur mesure", "intention commerciale"],
  ["devis cuisine sur mesure", "intention commerciale"],
];

const selectedKeywords = keywordSelection.map(([name, segment]) => {
  const item = keywordByName.get(name);
  if (!item) throw new Error(`Mot-clé introuvable dans l'export Google : ${name}`);
  return {
    keyword: name,
    segment,
    monthlyVolume: item.avgMonthlySearches,
    lowTopOfPageBid: item.lowTopOfPageBid,
    highTopOfPageBid: item.highTopOfPageBid,
    competitionIndex: item.competitionIndex,
    cpcLevel: item.cpcNiveau || raw.zone,
  };
});

const expectedBudgets = [50, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000];
for (const scenario of ["Présence", "Haut de page", "Domination"]) {
  const actual = budgetResults
    .filter((item) => item.scenario === scenario)
    .map((item) => item.requestedBudget);
  if (JSON.stringify(actual) !== JSON.stringify(expectedBudgets)) {
    throw new Error(`Grille budgétaire incomplète pour ${scenario}: ${actual.join(", ")}`);
  }
}
if (raw.projection.erreursForecast.length) {
  throw new Error(`${raw.projection.erreursForecast.length} erreur(s) Google Ads dans l'export`);
}
if (raw.projection.motsClesSimules !== 90) {
  throw new Error(`Le portefeuille prévu doit contenir 90 mots-clés, reçu : ${raw.projection.motsClesSimules}`);
}

const output = {
  source: "Google Ads Keyword Planner et generateKeywordForecastMetrics",
  extractedAt: "2026-07-28",
  zone: raw.zone,
  geoTargetConstant: raw.geoTargetConstant,
  seeds: raw.seeds,
  totals: {
    rawIdeas: raw.totaux.brut,
    ideasWithVolume: raw.totaux.avecVolume,
    distinctQueries: raw.totaux.requetesDistinctes,
    monthlyCommercialIntentVolume: raw.projection.volumeIntentionMensuel,
    monthlyForecastPortfolioVolume: raw.projection.volumePortefeuilleForecastMensuel,
    averageTopOfPageCpc: raw.projection.cpcMoyenHautDePage,
    forecastedKeywords: raw.projection.motsClesSimules,
  },
  forecast: scenarios,
  budgetTests: {
    requiredMonthlyBudgets: expectedBudgets,
    separateApiCalls: budgetResults.length,
    complete: budgetResults.length === expectedBudgets.length * scenarios.length,
    apiErrors: raw.projection.erreursForecast,
    results: budgetResults,
  },
  comparisonBaseline: {
    zone: baseline.zone,
    forecastedKeywords: baseline.totals.forecastedKeywords,
    monthlyCommercialIntentVolume: baseline.totals.monthlyCommercialIntentVolume,
    presenceSpend: baseline.forecast.find((item) => item.scenario === "Présence").monthlyBudget,
    presenceClicks: baseline.forecast.find((item) => item.scenario === "Présence").clicks,
  },
  forecastPortfolio: raw.projection.portefeuilleForecast,
  selectedKeywords,
  methodNotes: [
    "La zone reste strictement la Seine-et-Marne ; seule la couverture de mots-clés est élargie.",
    "Le portefeuille contient 90 expressions contrôlées couvrant douze familles de services réellement proposées par Totowood.",
    "Les mots-clés de marques, pas cher, DIY, occasion, emploi et formation ne font pas partie du portefeuille prévu.",
    "Lorsqu'un CPC départemental est indisponible, le script remonte au niveau Île-de-France puis France et trace ce niveau.",
    "Chaque stratégie a été testée par dix appels API séparés, aux budgets mensuels de 50, 100, 150, 200, 300, 500, 750, 1 000, 1 500 et 2 000 €.",
    "À 500 € demandés, les trois stratégies prévoient 517 € dépensés : 512 clics en Présence, 315 en Haut de page et 247 en Domination.",
    "Le palier conseillé pour un premier test est 500 € : 1 000 € reste techniquement absorbable, mais ne doit être engagé qu'après validation des termes de recherche et des leads.",
    "Aucun plafond n'est prouvé sous 2 000 € pour Présence et Domination ; le rapport ne présente donc pas 2 000 € comme recommandation de départ.",
    "Pour ce portefeuille mixte, le taux clic vers lead de 2–5 % reste une hypothèse NMF à valider.",
  ],
};

writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Données Ads normalisées : ${budgetResults.length} appels, 0 erreur.`);
