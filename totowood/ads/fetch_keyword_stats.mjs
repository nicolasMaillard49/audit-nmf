import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const scrapRoot = "C:/Users/n.maillard/VueJS/scrapProsp";
const loaderPath = `${scrapRoot}/node_modules/tsx/dist/loader.mjs`;

if (!process.env.__TOTOWOOD_KW_STATS_BOOTSTRAPPED) {
  if (!existsSync(loaderPath)) {
    throw new Error(`Loader tsx introuvable : ${loaderPath}`);
  }
  const result = spawnSync(
    process.execPath,
    ["--import", pathToFileURL(loaderPath).href, fileURLToPath(import.meta.url)],
    {
      stdio: "inherit",
      env: { ...process.env, __TOTOWOOD_KW_STATS_BOOTSTRAPPED: "1" },
    },
  );
  process.exit(result.status ?? 1);
}

const env = Object.fromEntries(
  readFileSync(`${scrapRoot}/.env.local`, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.trimStart().startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
    }),
);
for (const [key, value] of Object.entries(env)) {
  if (process.env[key] === undefined) process.env[key] = value;
}

const { clientCustomer } = await import(
  pathToFileURL(`${scrapRoot}/app/lib/googleAds/client.ts`).href
);
const googleAds = await import(
  pathToFileURL(`${scrapRoot}/node_modules/google-ads-api/build/src/index.js`).href
);

const source = JSON.parse(
  readFileSync(new URL("../data/google-ads-seine-et-marne-expanded.json", import.meta.url), "utf8"),
);
const keywords = source.forecastPortfolio;
const customerId = process.env.GOOGLE_ADS_AUDIT_CID || "4838999588";
const customer = clientCustomer(customerId);
const network = googleAds.enums.KeywordPlanNetwork.GOOGLE_SEARCH;

const geographies = [
  { label: "Seine-et-Marne", resource: "geoTargetConstants/9040885" },
  { label: "Île-de-France", resource: "geoTargetConstants/20321" },
  { label: "France", resource: "geoTargetConstants/2250" },
];

const normalize = (text) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
const toNumber = (value) => (value == null ? null : Number(value));
const toEuros = (value) => (value == null ? null : Number(value) / 1e6);
const competitionLabels = {
  0: "non précisée",
  1: "inconnue",
  2: "faible",
  3: "moyenne",
  4: "forte",
  UNSPECIFIED: "non précisée",
  UNKNOWN: "inconnue",
  LOW: "faible",
  MEDIUM: "moyenne",
  HIGH: "forte",
};

async function fetchForGeo(geo) {
  const response = await customer.keywordPlanIdeas.generateKeywordHistoricalMetrics({
    customer_id: customerId,
    keywords,
    language: "languageConstants/1002",
    geo_target_constants: [geo.resource],
    keyword_plan_network: network,
    include_adult_keywords: false,
    historical_metrics_options: { include_average_cpc: true },
  });
  const results = response?.results ?? [];
  const byInput = new Map();
  for (const result of results) {
    for (const candidate of [result.text, ...(result.close_variants ?? [])].filter(Boolean)) {
      byInput.set(normalize(candidate), result);
    }
  }
  return { ...geo, results, byInput };
}

const geoResults = [];
for (const geo of geographies) {
  geoResults.push(await fetchForGeo(geo));
}

const keywordStats = keywords.map((keyword, index) => {
  const normalized = normalize(keyword);
  const localResult = geoResults[0].byInput.get(normalized) ?? null;
  const localMetrics = localResult?.keyword_metrics ?? null;

  let cpcResult = null;
  let cpcGeo = null;
  for (const geo of geoResults) {
    const candidate = geo.byInput.get(normalized);
    const metrics = candidate?.keyword_metrics;
    if (
      metrics &&
      (Number(metrics.low_top_of_page_bid_micros ?? 0) > 0 ||
        Number(metrics.high_top_of_page_bid_micros ?? 0) > 0)
    ) {
      cpcResult = candidate;
      cpcGeo = geo.label;
      break;
    }
  }
  if (!cpcResult) {
    for (const geo of geoResults) {
      const candidate = geo.byInput.get(normalized);
      if (Number(candidate?.keyword_metrics?.average_cpc_micros ?? 0) > 0) {
        cpcResult = candidate;
        cpcGeo = geo.label;
        break;
      }
    }
  }
  const cpcMetrics = cpcResult?.keyword_metrics ?? null;
  const competitionValue = localMetrics?.competition ?? null;

  return {
    order: index + 1,
    keyword,
    googleCanonicalKeyword: localResult?.text ?? cpcResult?.text ?? null,
    closeVariants: localResult?.close_variants ?? cpcResult?.close_variants ?? [],
    avgMonthlySearches: toNumber(localMetrics?.avg_monthly_searches) ?? 0,
    monthlySearchVolumes: (localMetrics?.monthly_search_volumes ?? []).map((item) => ({
      year: toNumber(item.year),
      month: item.month,
      searches: toNumber(item.monthly_searches),
    })),
    competition: competitionLabels[competitionValue] ?? String(competitionValue ?? "non disponible"),
    competitionIndex: toNumber(localMetrics?.competition_index),
    lowTopOfPageBid: toEuros(cpcMetrics?.low_top_of_page_bid_micros),
    highTopOfPageBid: toEuros(cpcMetrics?.high_top_of_page_bid_micros),
    averageCpc: toEuros(cpcMetrics?.average_cpc_micros),
    cpcGeoLevel: cpcGeo,
    localMetricsReturned: Boolean(localResult),
  };
});

const output = {
  source: "Google Ads generateKeywordHistoricalMetrics",
  extractedAt: "2026-07-28",
  volumeGeo: geographies[0],
  cpcFallbackOrder: geographies,
  language: "languageConstants/1002",
  network: "GOOGLE_SEARCH",
  requestedKeywords: keywords.length,
  returnedCanonicalRowsByGeo: Object.fromEntries(
    geoResults.map((geo) => [geo.label, geo.results.length]),
  ),
  keywordStats,
};

writeFileSync(
  new URL("../data/google-ads-seine-et-marne-keyword-stats.json", import.meta.url),
  `${JSON.stringify(output, null, 2)}\n`,
  "utf8",
);

const localReturned = keywordStats.filter((item) => item.localMetricsReturned).length;
const withVolume = keywordStats.filter((item) => item.avgMonthlySearches > 0).length;
const withCpc = keywordStats.filter(
  (item) => item.averageCpc != null || item.highTopOfPageBid != null,
).length;
console.log(
  `Stats mots-clés : ${keywordStats.length} expressions, ` +
    `${localReturned} associées par Google, ${withVolume} avec volume, ${withCpc} avec CPC.`,
);
