import { readFileSync } from "node:fs";

const repo = "C:/Users/n.maillard/VueJS/scrapProsp";
const env = Object.fromEntries(
  readFileSync(`${repo}/.env.local`, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.trimStart().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }),
);
for (const [key, value] of Object.entries(env)) {
  if (process.env[key] === undefined) process.env[key] = value as string;
}

const { mccCustomer, clientCustomer, MCC_ID } = await import(
  "file:///C:/Users/n.maillard/VueJS/scrapProsp/app/lib/googleAds/client.ts"
);
const { resolveGeoTargetConstant, fetchKeywordIdeas } = await import(
  "file:///C:/Users/n.maillard/VueJS/scrapProsp/app/lib/googleAds/keywordIdeas.ts"
);
const { fetchCampaignReport } = await import(
  "file:///C:/Users/n.maillard/VueJS/scrapProsp/app/lib/googleAds/report.ts"
);

const mcc = mccCustomer();
const geo = await resolveGeoTargetConstant(mcc, "Bordeaux");
if (!geo) throw new Error("Géociblage Bordeaux introuvable");

const seeds = [
  "agence immobilière",
  "estimation immobilière",
  "vendre appartement",
  "vendre maison",
  "gestion locative",
  "mise en location",
  "viager",
  "immobilier neuf",
];
const ideas = await fetchKeywordIdeas(mcc, {
  customerId: MCC_ID,
  seeds,
  url: "https://www.rhpatrimoine.com/",
  geoTargetConstant: geo,
});

const wanted = /(agence immobili|estimation|vendre|vente immobili|gestion locative|mise en location|viager|immobilier neuf|acheter appartement|location appartement)/i;
const keywordIdeas = ideas
  .filter((idea: any) => idea.avgMonthlySearches > 0 && wanted.test(idea.text))
  .sort((a: any, b: any) => b.avgMonthlySearches - a.avgMonthlySearches)
  .slice(0, 40);

const customerId = "4838999588";
const campaignId = "23955483287";
const campaignReport = await fetchCampaignReport(customerId, campaignId);
const client = clientCustomer(customerId);

const accountRows = await client.query(`
  SELECT metrics.impressions, metrics.clicks, metrics.ctr,
         metrics.average_cpc, metrics.cost_micros, metrics.conversions,
         metrics.cost_per_conversion
  FROM customer
  WHERE segments.date DURING LAST_30_DAYS
`);

const termRows = await client.query(`
  SELECT search_term_view.search_term, campaign.id, campaign.name,
         ad_group.id, ad_group.name, metrics.impressions, metrics.clicks,
         metrics.cost_micros, metrics.conversions
  FROM search_term_view
  WHERE segments.date DURING LAST_30_DAYS
  ORDER BY metrics.cost_micros DESC
  LIMIT 50
`);

const micros = (value: any) => Number(value ?? 0) / 1_000_000;
const account = accountRows[0]
  ? {
      impressions: Number(accountRows[0].metrics?.impressions ?? 0),
      clicks: Number(accountRows[0].metrics?.clicks ?? 0),
      ctr: Number(accountRows[0].metrics?.ctr ?? 0),
      avgCpcEur: micros(accountRows[0].metrics?.average_cpc),
      costEur: micros(accountRows[0].metrics?.cost_micros),
      conversions: Number(accountRows[0].metrics?.conversions ?? 0),
      costPerConversionEur: micros(accountRows[0].metrics?.cost_per_conversion),
    }
  : null;

const searchTerms = termRows.map((row: any) => ({
  term: row.search_term_view?.search_term ?? "",
  campaign: row.campaign?.name ?? "",
  adGroup: row.ad_group?.name ?? "",
  impressions: Number(row.metrics?.impressions ?? 0),
  clicks: Number(row.metrics?.clicks ?? 0),
  costEur: micros(row.metrics?.cost_micros),
  conversions: Number(row.metrics?.conversions ?? 0),
}));

console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  keywordPlan: { geo: `Bordeaux (${geo})`, ideas: keywordIdeas },
  couvreur: { account30d: account, campaignReport, searchTerms },
}, null, 2));
