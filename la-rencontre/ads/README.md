# Google Ads — La Rencontre

Copies d'archive. Ces scripts ne sont **pas exécutables depuis ce dossier** : ils importent
`google-ads-api` et `app/lib/googleAds/`, et vivent sous `scripts/` du checkout `scrapProsp`
(`C:\Users\n.maillard\VueJS\scrapProsp`), **où ils sont versionnés**. La copie ici sert à
documenter exactement ce qui a produit les données et monté la campagne.

> **Correction du 03/09/2026.** Une première version de ce fichier affirmait que le script
> d'extraction n'avait jamais été archivé. C'est faux : `audit-la-rencontre-ads.mjs` est
> versionné dans `scrapProsp` depuis le début, avec les trois scripts de campagne. Le dossier
> était vide, pas la traçabilité.

## Les quatre scripts

| Script | Rôle | Date |
|---|---|---|
| `audit-la-rencontre-ads.mjs` | **la collecte de l'audit**, lecture seule — 4 phases : zones (Bordeaux + première couronne), historique du portefeuille, matrice 3 stratégies × 10 paliers (30 forecasts), idées Google sur graines « diner gastronomique » en contrôle de couverture | 02/08/2026 |
| `larencontre-creer-compte.mjs` | crée le compte client sous le MCC, après vérification d'identité au registre | 01/09/2026 |
| `larencontre-campagne.mjs` | monte la campagne **en PAUSE** : budget, réseau Recherche seul, zones, langue, calendrier, 27 exclusions, 3 groupes, mots clés en expression **et** exact, une annonce responsive par groupe | 01/09/2026 |
| `larencontre-composants.mjs` | pose les composants (liens annexes, téléphone) **au niveau campagne** — ils servent les trois groupes d'un coup | 01/09/2026 |

`audit-la-rencontre-ads.mjs` écrit au fil de l'eau pour ne rien perdre en cas de coupure.
Il produit `../data/donnees-google-ads-brutes.json` et lit `../data/portefeuille-mots-cles.json`.

## Le compte et la campagne

| | |
|---|---|
| Client | Restaurant La Rencontre — SAS, SIREN 937 965 390, RCS Bordeaux, capital 7 000 € |
| Compte Google Ads | `404-054-1764`, sous le MCC `671-181-3801` |
| Campagne | `Recherche - La Rencontre Soir` — `campaignId 24197703801` |
| Budget | 150 €/mois, soit **4,93 €/jour** (`4 930 000` micros — multiple de 10 000, sinon Google refuse) |
| Réseau | Recherche seul |
| Calendrier | tous les jours, **17 h 00 → 22 h 00** — « soir uniquement » porte sur le service vendu, pas sur les jours d'ouverture |
| Groupes | 3 — Italien (famille B), Gastronomique (famille A), Découverte (famille F) |
| URL finale | `https://restaurantlarencontre.com/reservation` |
| Exclusions | 27, au niveau campagne |
| État | **PAUSED** — rien ne diffuse |

> **Ne pas dé-pauser avant que la conversion `generate_lead` soit étoilée dans GA4 puis
> importée dans le compte.** Le script le dit dans son en-tête, et c'est la raison d'être de
> la pause : sans conversion, on dépense à l'aveugle. C'est le même P0 que celui déjà posé par
> l'audit — l'événement « réservation confirmée ».

## Deux limites à connaître avant de relancer

1. **La copie des annonces est introuvable sur cette machine.** `larencontre-campagne.mjs` et
   `larencontre-composants.mjs` lisent un markdown `docs/ads/annonces-google-ads.md` du projet
   du site, qui vivait sous `D:\projets\restaurant-larencontre\`. Ce lecteur n'existe pas ici,
   et le fichier n'est **nulle part** sous `VueJS\` ni dans le vault. Les deux scripts pointent
   désormais vers `C:\Users\n.maillard\VueJS\retaurantLaRencontre\docs\ads\annonces-google-ads.md`
   — **où il n'est pas encore**. La copie vit donc uniquement dans le compte Google Ads : la
   récupérer de là avant toute relance, sinon les deux scripts échouent à la lecture.
2. **Les `GOOGLE_ADS_*` ne sont pas dans le `.env.local` de `scrapProsp`** sur cette machine
   (vérifié le 03/09) — ils sont dans `Credentials.md` du vault Obsidian. Les quatre scripts
   ne lisent que le `.env.local` : leur passer les variables autrement, ou leur ajouter le
   chargement du vault comme le font les scripts `../../gpelec/ads/audit-gp-elec-v3-*.mjs`.

## Ce que la donnée dit d'elle-même

Le bloc `meta` de `../data/donnees-google-ads-brutes.json` documente l'appel de l'audit :

| Champ | Valeur |
|---|---|
| Extraction | `2026-08-02T22:32:40.075Z` |
| MCC | `6711813801` |
| API | `google-ads-api` / `KeywordPlanIdeaService` |
| Langue / réseau / devise | français · `GOOGLE_SEARCH` · EUR |
| Fenêtre de prévision | 01/09/2026 → 30/09/2026 |
| Communes | 10 |
| Paliers de budget | 10 |
| Mots-clés soumis | 77 |
| Enchère de référence | médiane haut de page 0,6716 € · haut de page 0,67 € · domination 1,01 € · échantillon 21 |

> Les plafonds géographiques de l'API et les autres pièges connus sont dans `../../ETAT-ADS.md`.
