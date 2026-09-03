# État des travaux Google Ads — 3 septembre 2026

Vue transverse des quatre dossiers clients. Ce fichier ne contient **aucun chiffre qui ne
soit pas déjà dans un `data/*.json`** du dépôt : il dit où en est chaque client, quelle
donnée fait foi, et quelle est la prochaine action. Le détail reste dans le `README.md`
de chaque dossier.

| Client | Dernière mesure | Compte Ads | Statut | Prochaine action |
|---|---|---|---|---|
| [GP elec](#gp-elec) | 02/09/2026 | **à créer** | zone et enchère tranchées, **livrables périmés** | réécrire les 3 PDF sur la zone retenue |
| [La Rencontre](#la-rencontre) | 02/08/2026 | inconnu | audit livré, proposition de test **datée** | statuer : le test a-t-il démarré ? |
| [Totowood](#totowood) | 28/07/2026 | — | audit livré, 4 déclinaisons | aucune en cours |
| [RH Patrimoine](#rh-patrimoine) | juillet 2026 | **existant, actif** | audit prospect livré | aucune en cours |

---

## GP elec

Électricien, Brissac Loire Aubance (49). MCC `671-181-3801`. Entreprise individuelle,
SIREN 990 872 129, créée le 02/09/2025.

**Ce qui est tranché** (passe du 02/09/2026, `data/base-livrables-2026-09-02.json`)

- **Zone retenue** : agglomération d'Angers + couronne jusqu'à Brissac, Chalonnes, Seiches,
  Beaufort, Saint-Georges — **20 cibles géographiques** après dédoublonnage et troncature.
- **Enchère 2,12 €** (CPC manuel plafonné), mesurée sur la zone retenue et non sur le
  département, qui dilue avec des enchères rurales.
- **Le choix de zone est un choix de plafond de budget, pas de trafic** : à budget de test les
  trois zones rendent la même chose à 5 % près. Plafonds respectifs 360 € / 448 € / 720 €.
- La famille **climatisation** porte 78 à 90 % des clics dans les quatre zones testées.
  L'hypothèse « c'est le phrase match qui la gonfle » a été **testée et réfutée** le 02/09
  (`data/matchtype-2026-09-02.json`) : l'écart s'élargit en correspondance exacte.
- La saison a été refaite sur **48 mois** (`data/saison-multi-annees-2026-09-02.json`) : juin
  est le meilleur mois, mai le pire, et le pic de septembre de la famille domotique vient
  entièrement de `domotique` seul — requête informationnelle, déjà écartée.

**Ce qui bloque**

1. **Les trois PDF portent encore la base du 04/08** — dix communes, 3 000 recherches, 133 clics
   à 1,49 €, plafond 291,81 €. Ils n'ont **pas** été réécrits sur la zone retenue.
   → **Aucun des trois ne doit partir chez le client en l'état.**
2. **Le compte Ads ne peut pas être créé par l'API.** `createCustomerClient` répond
   `customer_error 5` : Google exige que le MCC ait un compte lié ayant dépassé 1 000 $ de
   dépense. → **Passer par l'interface.** `ads/gpelec-creer-compte.mjs` reste en dry-run et
   sert de garde-fou anti-doublon ; il porte l'identité vérifiée au registre et rappelle que
   **devise et fuseau sont définitifs** (EUR / Europe/Paris).
3. **Trois faux témoignages sont en ligne.** Constat 6 de l'audit : Marie D., Patrick M.,
   Sophie L., sous un badge « Avis vérifiés » et la mention Google My Business, alors que la
   fiche porte neuf avis réels dont aucun de ces textes. La branche `p0-conformite` du dépôt
   du site (`nicolasMaillard49/GP-elec`) a été **mergée et déployée** — elle corrigeait
   Qualifelec, le consentement GA4 et le domaine canonique, **mais pas les témoignages**.
   Le relevé des neuf vrais avis est bloqué : l'extension Claude in Chrome ne se connecte pas
   sur cette machine.

Détail complet, limites d'API et pièges : [`gpelec/README.md`](gpelec/README.md) et
[`gpelec/ads/README.md`](gpelec/ads/README.md).

## La Rencontre

Restaurant italien, 42 rue Maréchal Joffre, Bordeaux. Périmètre : service du soir.
Extraction du **02/08/2026**, même MCC (`6711813801`), 77 mots-clés, 10 communes, 10 paliers
de budget (`data/donnees-google-ads-brutes.json`).

**Ce qui a été livré**

- `output/pdf/Audit-La-Rencontre-NMF-2026.pdf` — 12 pages, design lock 1.1 validé.
- `output/pdf/Proposition-La-Rencontre-Campagne-Test.pdf` — 2 pages : test à **150 €/mois**,
  sans engagement, décision chaque fin de mois. Plafond utile démontré à ~360 € : au-delà, le
  budget n'est plus absorbé.
- Verdict de l'audit : **go pour un test encadré**, conditionné à un P0 — l'événement GA4
  « réservation confirmée », sans lequel rien n'est mesurable.

**Ce qui est à statuer**

La proposition est **calée sur un calendrier échu** : « dès la mi-août », « 1er septembre,
pleine vitesse sur le pic ». Nous sommes le 3 septembre et le dépôt ne porte aucune trace
d'un compte, d'une campagne ni d'un événement GA4 posé.
→ **Trancher : le test a-t-il démarré ?** Si non, la proposition doit être redatée avant
tout renvoi — son argument central est le rodage d'août avant le pic de septembre, qui
n'existe plus.

**Trou de traçabilité connu** : les scripts d'extraction Google Ads de ce dossier n'ont
jamais été archivés — voir [`la-rencontre/ads/README.md`](la-rencontre/ads/README.md).

## Totowood

Audit livré en juillet 2026 avec quatre déclinaisons (Île-de-France, Seine-et-Marne,
scénario budget 2 000 €, récapitulatif). Données Google Ads dans `totowood/data/`, pipeline
dans `totowood/ads/`. Les deux vérificateurs `totowood/tools/verify_audit.mjs` et
`verify_client_audit.mjs` passent au 03/09/2026.

Aucune action en cours.

## RH Patrimoine

Audit prospect livré en juillet 2026 (Bordeaux Métropole). Deux passes ont été menées : la
passe retenue occupe la racine du dossier, la première est conservée dans
`rh-patrimoine/legacy/passe-claude/`.

**C'est le seul dossier adossé à des dépenses réellement constatées.** Le prospect avait
déjà un compte Google Ads actif, et `rh-patrimoine/ads/google_ads_real_estimate.mts` lit le
**rapport réel** de sa campagne (`customerId 4838999588`, `campaignId 23955483287` —
impressions, clics, CTR mesurés) avant de le confronter à la découverte de mots-clés sur
Bordeaux. Partout ailleurs dans ce dépôt, les chiffres sont des prévisions.

> Ce script ne lit **que** le `.env.local` du checkout `scrapProsp` — où les `GOOGLE_ADS_*`
> ne sont pas. Lui ajouter le chargement du vault avant toute relance.

Aucune action en cours.

---

## Rappels transverses

**Où sont les credentials.** Les `GOOGLE_ADS_*` ne sont **pas** dans le `.env.local` du
checkout `scrapProsp` : ils vivent dans `Credentials.md` du vault Obsidian
(`C:\Users\n.maillard\Obsidian\Cerveau`). Les scripts de la passe du 02/09 chargent les deux
sources et journalisent au démarrage combien de variables viennent du vault.

**Limites d'API à ne pas réapprendre.**

| Appel | Plafond géographique |
|---|---:|
| `generateKeywordIdeas` | 10 cibles |
| `generateKeywordHistoricalMetrics` | 10 cibles |
| `generateKeywordForecastMetrics` | 20 cibles |

Au-delà de 10 cibles, ni le volume de recherches ni l'enchère médiane ne sont mesurables :
ils ne peuvent qu'être encadrés par un sous-ensemble et un sur-ensemble. Le contournement
est de viser **un seul objet géographique de niveau supérieur** (le département
Maine-et-Loire est une cible, `geoTargetConstants/9040907`).

`historical_metrics_options.year_month_range` accepte **48 mois** — c'est ce qui permet de
séparer la saison de la croissance du marché.

`KeywordForecastMetrics` v24 ne rend **ni impressions, ni CTR, ni position moyenne**.
Aucun livrable ne doit donc annoncer de position ou d'impressions prévisionnelles.

**Tout plafond de dépense doit être daté.** Google reprévoit en continu : le même plafond
mesuré à la même enchère a bougé de +5 % en un jour (291,81 € le 04/08, 306 € le 05/08).
