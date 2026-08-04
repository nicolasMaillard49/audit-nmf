# GP elec — Potentiel Google Ads

Étude réalisée pour **GP elec (Pierre Guille)**, électricien à Brissac Loire Aubance (49320),
zone Brissac + Angers. Site du client : [gp-elec-49.com](https://gp-elec-49.com).

> **Passe du 4 août 2026.** Les trois livrables ont été régénérés sur une extraction Google Ads
> complète. La passe précédente (31/07) annonçait `generate_keyword_ideas` comme source alors que
> l'appel n'avait jamais été exécuté : le portefeuille n'avait donc jamais été confronté à la
> découverte Google. Détail dans « Ce qui a changé le 4 août ».

## Les trois livrables

| Fichier | Pages | Destinataire | Contenu |
|---|---:|---|---|
| `GP-elec-audit-digital-google-ads.pdf` | 15 | **Interne** | Tout : audit visuel, conformité, technique, 12 constats dont 5 P0, score de préparation 41/100, plan d'action. |
| `GP-elec-potentiel-google-ads.pdf` | 13 | Client | Même marché, mêmes chiffres, **aucune analyse négative du site**. |
| `Proposition-GP-elec-Campagne-Test.pdf` | 2 | Client | Le résumé d'envoi : trois chiffres, quatre étapes, la décision. |

Tous dans `output/pdf/`. Les trois sont générés et vérifiés par `report/render-all.mjs`, qui
échoue si une image ne charge pas, si une page déborde de la zone imprimable, si le nombre de
pages attendu n'est pas atteint, si un chiffre partagé diverge entre variantes, **si un chiffre de
la passe du 31/07 a survécu**, ou si une formulation négative fuit dans une variante client.

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
| Recherches mensuelles cumulées | 3 000 sur 69 lignes canoniques (73 mots-clés soumis) |
| Premier volume du portefeuille | `electricien angers` — 390/mois |
| Coût par clic tenu | 1,49 € en enchère manuelle plafonnée à 2,07 € (contre 4,20 € en estimation sectorielle) |
| Budget recommandé | 200 €/mois → 197,40 € dépensés, 133 clics |
| Plafond d'inventaire démontré | 291,81 € et 196 clics, identiques de 500 à 2 000 € demandés |

### Les plafonds, stratégie par stratégie

Les trois conditions du skill — dépense sous 90 % du budget demandé, deux paliers supérieurs
supplémentaires, stabilité à ±5 % — sont évaluées séparément pour chaque stratégie par
`audit-gp-elec-marche.mjs`. Elles ne sont pas toutes réunies :

| Stratégie | Plafond | Statut |
|---|---|---|
| Haut de page (CPC manuel 2,07 €) — **retenue** | 291,81 € / 196 clics dès 500 € | **démontré** (750 € et 1 000 € identiques) |
| Domination (CPC manuel 3,10 €) | 440,82 € / 229 clics dès 500 € | **démontré** |
| Présence (maximisation des clics) | 1 055,80 € / 279 clics à 1 500 € | capacité **observée**, plafond non démontré : un seul palier supérieur testé au-delà du plateau |

### Capacité d'absorption par famille de service

Chaque famille a reçu **seule** la totalité du budget de référence (200 €, haut de page). Le
tableau mesure sa capacité propre, ce n'est pas une répartition du budget.

| Famille | Clics | Dépense |
|---|---:|---:|
| A — Climatisation et PAC air/air | 121 | 197,40 € |
| C — Électricien général et entreprise | 23 | 24,13 € |
| G — Domotique | 19 | 19,28 € |
| D — Rénovation, mise aux normes, Consuel | 7 | 4,95 € |
| B — Dépannage et urgence | 3 | 3,30 € |
| F — Aménagement cuisine | 1 | 0,40 € |
| H — Devis, prix et tarifs | 1 | 0,43 € |
| E — Installation neuve | 0 | 0,00 € |

**La famille climatisation sature à elle seule le budget de 200 €.** Les autres familles n'ont
quasiment pas d'inventaire achetable. À budget de test, la campagne sera de fait une campagne
climatisation : c'est le point à trancher avec le client avant l'ouverture.

## Ce qui a changé le 4 août

**L'appel de découverte manquait.** `generateKeywordIdeas` n'avait jamais été exécuté malgré la
mention dans le rapport. Il a été lancé sur deux lots de graines métier (40 graines) **et** sur
l'URL du site : 20 000 idées brutes côté graines, 234 déduites du site. Les candidats à volume
≥ 30 absents du portefeuille ont été remesurés en `generateKeywordHistoricalMetrics`.

**Sept mots-clés sont entrés au portefeuille** (+580 recherches/mois, 2 420 → 3 000) : `consuel`
(210), `electricien autour de moi` (110), `volet roulant electrique` (90), `alarme somfy` (50),
`climatiseur reversible`, `pompe a chaleur reversible` et `prix installation climatisation` (40
chacun). Neuf exclusions supplémentaires ont été documentées (20 → 29).

**Règle de non-gonflement.** Un candidat dont le couple (volume, enchère haute) est déjà porté par
une ligne du portefeuille est une variante que Google n'a pas fusionnée lui-même ; l'ajouter
compterait deux fois la même demande. Quatre ajouts pressentis ont été écartés par ce test —
`clim reversible prix`, `consuel electrique`, `entreprise en electricité`, `électricien prix`.

**Un gisement hors offre.** L'installation de **bornes de recharge pour véhicule électrique**
représente 23 requêtes canoniques et **3 420 recherches par mois** sur la zone, enchère haute
médiane 1,18 €, concurrence faible à moyenne sur les premiers volumes. GP elec ne la vend pas :
aucune mention sur le site au 04/08. Ce volume n'est **pas** compté dans les 3 000 du marché
adressable. C'est une piste commerciale, pas une correction de marché.

**Le portefeuille v1 est confirmé.** Les 62 lignes du 31/07 renvoient exactement les mêmes volumes
et les mêmes enchères le 04/08 — zéro ligne modifiée, 2 420 recherches inchangées. Seule la
matrice de prévisions a bougé (Google reprévoit en continu) : les plateaux montent de 17 à 25 %.

## Limite d'API à connaître

`KeywordForecastMetrics` (v24) ne contient que `average_cpc_micros`, `clicks`, `cost_micros`,
`conversions` et `average_cpa_micros`. **Ni impressions, ni CTR, ni position moyenne.** La route
historique qui les rendait — `KeywordPlanService.GenerateForecastMetrics` sur un KeywordPlan
enregistré — n'existe plus : le service n'expose que `MutateKeywordPlans` (vérifié dans les protos
`google-ads-node` v24). Aucun rapport ne doit donc annoncer d'impressions prévisionnelles.

`generateAdGroupThemes` n'a pas été appelé : il exige des `ad_groups` déjà créés
(`REQUIRED_FIELD_MISSING`). Sans compte client ni campagne, l'appel est sans objet ; la capacité
par famille le remplace.

## Origine des données

Volumes, indices de concurrence, fourchettes d'enchères, découverte et les 38 prévisions
budgétaires proviennent de l'**API Google Ads v24**, extraction du **4 août 2026**, MCC
`671-181-3801`, sur les 10 communes les plus peuplées dans un rayon de 30 km autour de Brissac.
Zone, langue (fr), réseau (Recherche), devise (EUR) et période de prévision (septembre 2026)
constants entre tous les appels. **Zéro erreur API.**

`generateKeywordIdeas` plafonne à 10 `geo_target_constants` par requête : la zone retenue est donc
volontairement conservatrice.

Les mesures du site (Lighthouse 12) et les captures ont été refaites le **4 août 2026**.

## Contenu

```
data/
  marche-google-ads.json                    source unique de chiffres des 3 rapports, generee
  donnees-google-ads-brutes-2026-08-04.json reponses API brutes de la passe du 04/08
  donnees-google-ads-brutes-2026-07-31.json reponses API brutes de la passe du 31/07, conservees
  portefeuille-mots-cles.json               73 mots-cles, 8 familles, 29 exclusions motivees
  diagnostic.json                           les 12 constats dates, le score et le verdict
  site.json                                 collecte HTTP : redirections, en-tetes, pages, assets
  seo.json                                  titres, meta, JSON-LD, structure, poids
  lighthouse.json                           scores et metriques desktop + mobile
  pages/                                    HTML brut des pages collectees
shots/                                      captures desktop (d-*) et mobile (m-*), sequentielles
report/
  audit-gp-elec-2026.html                   source de la version technique (15 p.)
  potentiel-gp-elec-2026.html               source de la version commerciale (13 p.)
  proposition-gp-elec.html                  source du resume d'envoi (2 p.)
  assets/audit-design-lock.css              charte NMF verrouillee, version 1.1
  render-all.mjs                            rend les 3 PDF, controle debordement, concordance,
                                            chiffres perimes et etancheite
  patch-2026-08-04.mjs                      report des chiffres du 04/08 (61 substitutions)
  patch-2026-08-04-b.mjs                    seconde passe : couverture, synthese, annexes
  scan-perimes.mjs                          recense les chiffres du 31/07 encore presents
  fix-typo.mjs                              espaces insecables — NE TRAITE QUE LES NOEUDS DE TEXTE
output/
  pdf/                                      les trois livrables
  qa/                                       une capture par page : tech-*, page-*, resume-*
legacy/generateur-rapport.py                generateur Python de la passe du 31/07, conserve
collect.mjs, analyze.mjs, lh.mjs, capture.mjs, capture2.mjs, detail.mjs   chaine de collecte
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
pages inattendu, chiffre partagé divergent, chiffre du 31/07 ayant survécu, ou formulation
négative ayant fuité dans la version commerciale ou le résumé.

### Refaire l'extraction Google Ads

Les scripts d'extraction vivent dans `D:\projets\scrapProsp\scripts\` — c'est là que sont les
credentials (`.env.local`) et le module `app/lib/googleAds/`. Ils écrivent directement dans
`gpelec/data/` :

```bash
cd D:/projets/scrapProsp
node --import tsx scripts/audit-gp-elec-v2.mjs        # 7 phases, ~40 appels, ~12 min
node scripts/audit-gp-elec-portefeuille-v2.mjs        # applique la decouverte au portefeuille
node scripts/audit-gp-elec-marche.mjs                 # consolide marche-google-ads.json
```

Puis, côté audit : `node report/patch-…mjs` si des chiffres changent, `node report/fix-typo.mjs`,
`node report/render-all.mjs`.

## Pièges rencontrés, à ne pas refaire

1. **`keyword_metrics` peut être `null`** sur les mots-clés sans donnée. Un défaut de paramètre
   (`m = {}`) ne couvre que `undefined` : la phase entière lève et toutes les lignes déjà mappées
   sont perdues. Normaliser `null` explicitement.
2. **`fix-typo.mjs` ne doit traiter que les nœuds de texte.** Appliquée à la source brute, la règle
   du séparateur de milliers réécrit l'intérieur des attributs SVG : `viewBox="0 0 640 210"` et
   `points="120,129 260,105"` deviennent invalides, les polylignes disparaissent sans aucune
   erreur, et ni le contrôle de débordement ni le validateur de charte ne le voient.
3. **Tout montant en micros doit être un multiple de 10 000** (MinCpcBidMicros EUR). Sinon l'API
   répond `keyword_plan_idea_error: UNKNOWN`, qui est en réalité une erreur de validation
   déguisée : ne jamais rejouer sur `UNKNOWN`, seulement sur `RESOURCE_EXHAUSTED`.
4. Le validateur de charte signale `#080F1A` et `#6B6F76` comme « couleurs hors palette » dans la
   version technique : ce sont les codes hexadécimaux **cités dans un constat de contraste sur le
   site du client**, pas du style. Faux positif assumé. Le résumé d'envoi est signalé « incomplet,
   2 pages, minimum 9 » : c'est son format voulu.
