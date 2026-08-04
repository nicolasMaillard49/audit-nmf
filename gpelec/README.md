# GP elec — Potentiel Google Ads

Étude réalisée pour **GP elec (Pierre Guille)**, électricien à Brissac Loire Aubance (49320),
zone Brissac + Angers. Site du client : [gp-elec-49.com](https://gp-elec-49.com).

## Les trois livrables

| Fichier | Pages | Destinataire | Contenu |
|---|---:|---|---|
| `GP-elec-audit-digital-google-ads.pdf` | 15 | **Interne** | Tout : audit visuel, conformité, technique, 12 constats dont 5 P0, score de préparation 41/100, plan d'action. |
| `GP-elec-potentiel-google-ads.pdf` | 13 | Client | Même marché, mêmes chiffres, **aucune analyse négative du site**. |
| `Proposition-GP-elec-Campagne-Test.pdf` | 2 | Client | Le résumé d'envoi : trois chiffres, quatre étapes, la décision. |

Tous dans `output/pdf/`. Les trois sont générés et vérifiés par `report/render-all.mjs`, qui
échoue si une image ne charge pas, si une page déborde de la zone imprimable, si le nombre de
pages attendu n'est pas atteint, si un chiffre partagé diverge entre variantes, ou si une
formulation négative fuit dans une variante client.

> **Ne pas envoyer la version technique au client.** Elle contient l'analyse des défauts,
> dont trois points qui proviennent de notre propre livraison.

## Les cinq points bloquants (version technique)

1. `aggregateRating` **4,9 / 84 faux** dans le JSON-LD et affiché en page — la fiche porte **5,0 / 9**.
2. Qualification **Qualifelec** revendiquée sans numéro ni date.
3. Deux **`[À COMPLÉTER]`** servis en production dans `/mentions-legales`.
4. **GA4 chargé sans consentement**, aucun bandeau, aucune politique de confidentialité liée.
5. `canonical`, `og:*`, `twitter:image` et les deux `hreflang` pointent sur **www**, qui répond **307** vers l'apex.

Aucun des cinq P0 relevés le 31/07 n'a été corrigé, et la performance mobile a reculé de
**97 à 81** (LCP 2,0 s → 4,5 s). Détail dans `data/diagnostic.json`.

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
  diagnostic.json          les 12 constats dates, le score et le verdict
report/
  audit-gp-elec-2026.html       source de la version technique (15 p.)
  potentiel-gp-elec-2026.html   source de la version commerciale (13 p.)
  proposition-gp-elec.html      source du resume d'envoi (2 p.)
  assets/audit-design-lock.css  charte NMF verrouillee, version 1.1
  render-all.mjs                rend les 3 PDF, controle debordement + concordance + etancheite
  fix-typo.mjs                  espaces insecables (€, %, milliers, ponctuation double)
output/
  pdf/                     les trois livrables
  qa/                      une capture par page : tech-*, page-*, resume-*
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
node report/render-all.mjs             # regenere les TROIS PDF et les verifie
```

`render-all.mjs` sort en code 1 au moindre défaut : image cassée, page qui déborde, nombre de
pages inattendu, chiffre partagé divergent entre variantes, ou formulation négative ayant fuité
dans la version commerciale ou le résumé.
