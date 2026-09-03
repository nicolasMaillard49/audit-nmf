# Google Ads — La Rencontre

**Ce dossier ne contient aucun script : c'est un trou de traçabilité assumé, pas un oubli
de rangement.**

Les données Google Ads de l'audit sont dans `../data/donnees-google-ads-brutes.json` et
`../data/portefeuille-mots-cles.json`, mais **le script qui les a produites n'a jamais été
archivé**. Il a tourné depuis un checkout `scrapProsp` la nuit du 2 au 3 août 2026, dans une
session dont il ne reste pas de transcript local. À la différence de GP elec — dont les
quatorze scripts d'extraction sont copiés dans `../../gpelec/ads/` — l'extraction de
La Rencontre n'est donc **pas reproductible en l'état**.

## Ce que la donnée dit d'elle-même

Le bloc `meta` de `../data/donnees-google-ads-brutes.json` documente l'appel :

| Champ | Valeur |
|---|---|
| Client | Restaurant La Rencontre |
| Extraction | `2026-08-02T22:32:40.075Z` |
| MCC | `6711813801` |
| API | `google-ads-api` / `KeywordPlanIdeaService` |
| Langue | `languageConstants/1002` (français) |
| Réseau | `GOOGLE_SEARCH` |
| Devise | EUR |
| Fenêtre de prévision | 01/09/2026 → 30/09/2026 |
| Communes | 10 |
| Paliers de budget | 10 |
| Mots-clés soumis | 77 |
| Enchère de référence | médiane haut de page 0,6716 € · haut de page 0,67 € · domination 1,01 € · échantillon 21 |

Le fichier porte aussi `geo`, `historical`, `matrix`, `ideas` et `errors` — la même forme de
sortie que les scripts `../../gpelec/ads/audit-gp-elec-*.mjs`, ce qui indique un script de la
même famille.

## Refaire l'extraction

Il n'y a pas de raccourci : il faut réécrire le script. Le plus proche modèle est
`../../gpelec/ads/audit-gp-elec-v3-base-livrables.mjs`, qui produit exactement cette
structure et gère déjà le chargement des `GOOGLE_ADS_*` depuis les deux sources
(`.env.local` du checkout **et** `Credentials.md` du vault Obsidian, absents du premier).

```bash
cd C:/Users/n.maillard/VueJS/scrapProsp
node --import tsx scripts/<le-script-a-ecrire>.mjs
```

Contraintes à respecter pour rester comparable à l'extraction d'août : 10 communes,
français, réseau Recherche, EUR — et **surtout redater la fenêtre de prévision**, qui vaut
septembre 2026 dans le fichier existant.

> Les plafonds géographiques de l'API (10 cibles pour `generateKeywordIdeas` et
> `generateKeywordHistoricalMetrics`, 20 pour `generateKeywordForecastMetrics`) et les autres
> pièges connus sont documentés dans `../../ETAT-ADS.md` et `../../gpelec/ads/README.md`.
