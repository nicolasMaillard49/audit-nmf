# Scripts d'extraction Google Ads — copie d'archive

Ces scripts ne sont **pas exécutables depuis ce dossier** : ils importent
`google-ads-api` et `app/lib/googleAds/` et lisent les credentials dans `.env.local`,
tous situés dans `D:\projets\scrapProsp`. Ils y vivent sous `scripts/` (non versionnés
là-bas) et écrivent directement dans `gpelec/data/`. La copie ici sert à documenter
exactement ce qui a produit les données.

## Passe du 4 août 2026 — l'audit

| Script | Rôle |
|---|---|
| `audit-gp-elec-v2.mjs` | 7 phases : geo, découverte par graines, découverte par URL, historique du portefeuille, historique des candidats, matrice 3 × 10, capacité par famille |
| `audit-gp-elec-portefeuille-v2.mjs` | Applique la découverte au portefeuille, avec la règle de non-gonflement |
| `audit-gp-elec-marche.mjs` | Consolide `marche-google-ads.json`, évalue les trois conditions du plafond par stratégie |

## Passe du 5 août 2026 — saison, enchère, zone

Trois questions ouvertes par la relecture du 5 août. Toutes en **lecture seule** côté
Google : uniquement `generateKeywordForecastMetrics`, aucune campagne créée.

| Script | Question | Sortie |
|---|---|---|
| `audit-gp-elec-saisonnalite.mjs` | la prévision varie-t-elle avec la fenêtre ? 9 cibles × 3 fenêtres, seule `forecast_period` change | `data/saisonnalite-forecast-2026-08-05.json` |
| `audit-gp-elec-septembre-cd.mjs` | une campagne de septembre sans climatisation est-elle finançable ? 3 périmètres × 4 plafonds × 3 budgets | `data/septembre-sans-clim-2026-08-05.json` |
| `audit-gp-elec-zone-elargie.mjs` | élargir la zone débloque-t-il la dépense, et peut-on viser 500 € réels ? 4 zones × 4 périmètres × 4 enchères × 4 budgets + contrôle de saison | `data/zone-elargie-2026-08-05.json` |

`audit-gp-elec-zone-elargie.mjs` est **relançable** : il met en cache la résolution
géographique et saute les combinaisons déjà calculées. Il tronque une zone que l'API
refuserait (100 → 50 → 20 → 10 cibles) et le journalise.

> **Les deux appels n'ont pas la même limite géographique.** `generateKeywordIdeas`
> plafonne à **10** `geo_target_constants`. `generateKeywordForecastMetrics` accepte
> **20** : mesuré le 05/08, une liste de 34 communes est refusée en `TOO_MANY`, la même
> tronquée à 20 passe. La zone à dix communes de l'audit était donc une contrainte
> d'outil, mais on ne peut pas pour autant énumérer un département commune par commune.
>
> **Contournement : viser un seul objet géographique de niveau supérieur.** Le
> département Maine-et-Loire est **une** cible (`geoTargetConstants/9040907`), la région
> Pays de la Loire aussi (`geoTargetConstants/20329`). Le plafond de 20 devient sans
> objet, et la zone couverte est bien plus large qu'une énumération de communes.

Ordre d'exécution et limites d'API : voir `../README.md`.
