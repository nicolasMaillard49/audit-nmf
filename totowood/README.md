# Totowood — audit digital & potentiel Google Ads

Audit prospect livré en **juillet 2026**, décliné par zone géographique et par scénario de
budget. Extraction Google Ads du **28 juillet 2026**
(`Keyword Planner` + `generateKeywordForecastMetrics`).

## Les livrables

Tous dans `output/pdf/`.

| Fichier | Destinataire |
|---|---|
| `Audit-Totowood-NMF-2026-Client.pdf` | **client — la version à envoyer** |
| `Audit-Totowood-NMF-2026-Interne.pdf` | interne |
| `Audit-Totowood-NMF-2026-Seine-et-Marne.pdf` | déclinaison Seine-et-Marne |
| `Audit-Totowood-NMF-2026-Ile-de-France.pdf` | déclinaison Île-de-France |
| `Audit-Totowood-NMF-2026-Budget-2000.pdf` | scénario budget 2 000 € |
| `Recap-Totowood-NMF-2026.pdf` | récapitulatif |

Les fichiers `final`, `final-v2`, `v3`, `AC`, `draft`, `audit-totowood-fr*` sont les itérations
successives. Elles sont conservées pour l'historique et **ne doivent pas être envoyées**.

## Les deux zones mesurées

| | Seine-et-Marne | Île-de-France |
|---|---:|---:|
| `geoTargetConstant` | `9040885` | `20321` |
| Idées brutes | 2 539 | 2 111 |
| Idées avec volume | 2 025 | 2 077 |
| Requêtes distinctes | 1 173 | 1 187 |
| Volume mensuel à intention commerciale | 580 | 1 370 |
| CPC moyen haut de page | 3,03 € | 3,14 € |
| Mots-clés prévus | 90 | 50 |
| Paliers de budget testés | 5 | 5 |

`google-ads-seine-et-marne.json` est la mesure de référence ;
`…-expanded.json` la reprend avec un portefeuille élargi (volume prévisionnel 1 560) et sert
de source aux rapports ; `…-keyword-stats.json` porte le détail des 90 mots-clés.

## Organisation du dossier

```
ads/                              chaine Google Ads
  fetch_keyword_stats.mjs         appelle l'API depuis le checkout scrapProsp
  build_ads_data.mjs              normalise tmp/forecast-*.json -> data/*.json
  build_keyword_annex_data.mjs    prepare report/keyword-annex-data.js (annexe 90 mots-cles)
data/                             les quatre JSON Google Ads
report/
  audit-totowood-2026.html        source de la version interne
  audit-totowood-2026-client.html source de la version client
  recap-totowood-2026.html        source du recapitulatif
  keyword-annex-data.js           annexe generee, ne pas editer a la main
tools/
  make_audit_pdf.py               generation des PDF
  verify_audit.mjs                verifie la version interne (12 pages, 90 mots-cles, 30 appels)
  verify_client_audit.mjs         verifie la version client (8 pages, ton simplifie)
assets/                           logos NMF + photos et captures Totowood
shots/totowood-desktop.png        capture d'ecran du site
design-previews/                  maquettes de mise en page (3 options explorees)
output/
  pdf/                            les livrables et leurs iterations
  design-previews/                les 3 options rendues en PNG
  mots-cles-totowood-google-ads.txt   la liste de mots-cles Google Ads
tmp/                              profils Chrome jetables de Puppeteer + forecasts bruts
PRODUCT.md, DESIGN.md             notes produit et parti pris graphique
```

## Régénérer

**Tous les chemins sont résolus depuis ce dossier**, pas depuis le répertoire courant.

```bash
cd totowood
node ads/build_ads_data.mjs             # renormalise data/ depuis tmp/forecast-*.json
node ads/build_keyword_annex_data.mjs   # regenere report/keyword-annex-data.js
python tools/make_audit_pdf.py          # rend les PDF
node tools/verify_audit.mjs             # controle la version interne
node tools/verify_client_audit.mjs      # controle la version client
```

Les deux vérificateurs sortent en code 1 au moindre défaut : nombre de pages, chiffre
divergent, mention obsolète encore présente, ressource manquante. **Ils passent au
03/09/2026.**

### Refaire l'extraction Google Ads

`ads/fetch_keyword_stats.mjs` s'appuie sur `app/lib/googleAds/` et sur le
`google-ads-api` du checkout `scrapProsp` — il ne tourne pas sans lui :

```bash
cd C:/Users/n.maillard/VueJS/scrapProsp   # constante scrapRoot du script
```

Les `GOOGLE_ADS_*` **ne sont pas** dans le `.env.local` de ce checkout : ils sont dans
`Credentials.md` du vault Obsidian. Limites d'API connues : `../ETAT-ADS.md`.

## À savoir

`tmp/` contient les **profils Chrome jetables** créés par Puppeteer lors des exports PDF
(vérifiés : profils vierges, aucun cookie ni identifiant personnel) et les forecasts bruts
`forecast-totowood-*.json` que `ads/build_ads_data.mjs` consomme. Ce dossier est versionné :
il pèse l'essentiel du poids du dépôt mais **`build_ads_data.mjs` en dépend**, il ne peut
donc pas être vidé sans casser la chaîne.
