# GP elec — Potentiel Google Ads

Étude réalisée pour **GP elec (Pierre Guille)**, électricien à Brissac Loire Aubance (49320),
zone Brissac + Angers. Site du client : [gp-elec-49.com](https://gp-elec-49.com).

## Livrable

`output/pdf/GP-elec-potentiel-google-ads.pdf` — 13 pages, **version envoyable au client**.

Ce document porte exclusivement sur le potentiel publicitaire du marché local. Il ne contient
aucune analyse des défauts du site : les prérequis y sont formulés comme des étapes à mettre
en place, et aucun score de préparation n'y figure.

## Ce que dit l'étude

| Chiffre | Valeur |
|---|---|
| Recherches mensuelles cumulées | 2 420 sur 62 mots-clés canoniques |
| Premier volume du portefeuille | `electricien angers` — 390/mois |
| Coût par clic réel | 1,42 € (contre 4,20 € en estimation sectorielle) |
| Budget recommandé | 200 €/mois en CPC manuel plafonné à 1,63 € |
| Plafond d'inventaire démontré | 754,34 € et 187 clics, identiques à 1 000 / 1 500 / 2 000 € demandés |

## Origine des données

Les volumes, indices de concurrence, fourchettes d'enchères et les 30 prévisions budgétaires
proviennent de l'**API Google Ads v24** (`generate_keyword_ideas` et `generate_forecast_metrics`),
extraction du **31 juillet 2026**, MCC `671-181-3801`, sur les 10 communes les plus peuplées
dans un rayon de 30 km autour de Brissac.

> Les fichiers sources de cette extraction (`portefeuille-mots-cles.json`,
> `donnees-google-ads-brutes.json`) vivaient dans `D:\projets\audit\gp-elec`, répertoire qui
> n'existe plus sur la machine. Les credentials Google Ads vivaient dans `D:\projets\scrapProsp`,
> également absent. Les valeurs reprises ici sont celles consignées dans le vault Obsidian au
> moment de l'extraction — aucune n'est estimée, mais **une nouvelle interrogation de l'API sera
> nécessaire avant le lancement** pour rafraîchir volumes et enchères.

Les mesures du site (Lighthouse 12) et les captures ont été refaites le **4 août 2026**.

## Contenu

```
data/
  marche-google-ads.json   valeurs de l'etude + provenance de chaque bloc
  site.json                collecte HTTP : redirections, en-tetes, pages, assets
  seo.json                 titres, meta, JSON-LD, structure, poids
  lighthouse.json          scores et metriques desktop + mobile
  pages/                   HTML brut des pages collectees
shots/                     captures desktop (d-*) et mobile (m-*), sequentielles
report/
  potentiel-gp-elec-2026.html   source du rapport
  assets/audit-design-lock.css  charte NMF verrouillee, version 1.1
  render-pdf.mjs                rendu PDF + captures QA + controle de debordement
  fix-typo.mjs                  espaces insecables (€, %, milliers, ponctuation double)
output/
  pdf/                     le livrable
  qa/                      une capture par page, pour relecture
collect.mjs                collecte HTTP
analyze.mjs                analyse SEO / structure / JSON-LD
lh.mjs                     Lighthouse local
capture.mjs, capture2.mjs  captures d'ecran
detail.mjs                 extraction des diagnostics Lighthouse
```

## Régénérer

```bash
cd gpelec
npm install
node collect.mjs && node analyze.mjs   # recollecte le site
node lh.mjs                            # remesure Lighthouse
node capture2.mjs                      # refait les captures
node report/render-pdf.mjs             # regenere le PDF
```

`render-pdf.mjs` échoue si une image ne charge pas et signale tout dépassement de la zone
imprimable, page par page.
