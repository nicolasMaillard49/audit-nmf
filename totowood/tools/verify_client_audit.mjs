import { readFileSync } from "node:fs";

const html = readFileSync(
  new URL("../report/audit-totowood-2026-client.html", import.meta.url),
  "utf8",
);
const data = JSON.parse(
  readFileSync(
    new URL("../data/google-ads-seine-et-marne-expanded.json", import.meta.url),
    "utf8",
  ),
);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(data.zone === "Seine-et-Marne", "Zone Ads incorrecte");
assert(data.totals.forecastedKeywords === 90, "Le portefeuille doit contenir 90 mots-clés");
assert(data.budgetTests.separateApiCalls === 30, "La preuve interne doit conserver 30 appels");
assert(data.budgetTests.apiErrors.length === 0, "Des erreurs API sont présentes");

const basePages = (html.match(/<section class="page(?! appendix-page)(?:\s|")/g) || []).length;
const hiddenInternalPages = (html.match(/<section class="page client-internal-only">/g) || []).length;
assert(basePages === 9, "Le fichier client doit dériver des 9 pages principales");
assert(hiddenInternalPages === 1, "Une seule page de preuve détaillée doit être masquée");
assert(basePages - hiddenInternalPages === 8, "Le PDF client doit contenir 8 pages");

for (const needle of [
  "8 pages · synthèse décisionnelle",
  "Audit de recommandation",
  "À préparer<br>avant lancement",
  "Ce qui doit être renforcé",
  "Avant toute campagne",
  "Une base saine, avec des optimisations prioritaires.",
  "niveau de préparation avant lancement",
  "500 €",
  "6–16 leads",
  "02 / 08",
  "07 / 08",
  "08 / 08",
]) {
  assert(html.includes(needle), `Mention client requise absente : ${needle}`);
}

for (const obsolete of [
  "12 pages · données Google Ads réelles",
  "Audit prospect · juillet 2026",
  "No-go<br>avant corrections",
  "Rendu visuel cassé",
  "Verdict landing page",
  "Claude SEO",
  "09 / 12",
]) {
  assert(!html.includes(obsolete), `Mention interne ou obsolète présente : ${obsolete}`);
}

assert(
  html.includes(".client-internal-only,") &&
    html.includes("#keyword-annex") &&
    html.includes("display: none !important"),
  "La preuve détaillée et l'annexe doivent être masquées dans la version client",
);

console.log("Version client vérifiée : 8 pages, ton simplifié, chiffres Ads inchangés.");
