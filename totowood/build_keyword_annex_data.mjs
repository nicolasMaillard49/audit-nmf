import { readFileSync, writeFileSync } from "node:fs";

const source = JSON.parse(
  readFileSync(
    new URL("./data/google-ads-seine-et-marne-keyword-stats.json", import.meta.url),
    "utf8",
  ),
);

const geoCode = (level) => {
  if (level === "Seine-et-Marne") return "77";
  if (level === "Île-de-France") return "IDF";
  if (level === "France") return "FR";
  return null;
};

const payload = {
  extractedAt: source.extractedAt,
  source: source.source,
  volumeGeo: source.volumeGeo.label,
  requestedKeywords: source.requestedKeywords,
  counts: {
    withVolume: source.keywordStats.filter((item) => item.avgMonthlySearches > 0).length,
    withCpc: source.keywordStats.filter(
      (item) => item.averageCpc != null || item.highTopOfPageBid != null,
    ).length,
    withCompetition: source.keywordStats.filter(
      (item) => item.competitionIndex != null,
    ).length,
  },
  keywordStats: source.keywordStats.map((item) => ({
    order: item.order,
    keyword: item.keyword,
    volume: item.avgMonthlySearches,
    competition: item.competition,
    competitionIndex: item.competitionIndex,
    averageCpc: item.averageCpc,
    bidLow: item.lowTopOfPageBid,
    bidHigh: item.highTopOfPageBid,
    cpcGeo: geoCode(item.cpcGeoLevel),
  })),
};

writeFileSync(
  new URL("./report/keyword-annex-data.js", import.meta.url),
  `window.keywordAnnexData = ${JSON.stringify(payload)};\n`,
  "utf8",
);

console.log(
  `Annexe préparée : ${payload.requestedKeywords} mots-clés, ` +
    `${payload.counts.withVolume} avec volume, ${payload.counts.withCpc} avec CPC.`,
);
