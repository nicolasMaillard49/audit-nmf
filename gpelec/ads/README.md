# Scripts d'extraction Google Ads — copie d'archive

Ces scripts ne sont **pas exécutables depuis ce dossier** : ils importent `google-ads-api` et
`app/lib/googleAds/`, et vivent sous `scripts/` du checkout `scrapProsp` (non versionnés là-bas).
Ils écrivent directement dans `gpelec/data/`. La copie ici sert à documenter exactement ce qui a
produit les données.

> **Chemins corrigés le 03/09/2026.** Les en-têtes des scripts d'août annonçaient
> `D:\projets\scrapProsp` et écrivaient dans `D:/projets/audit/gpelec` : **ce lecteur n'existe pas**
> sur la machine courante. Les quatorze scripts pointent désormais vers
> `C:\Users\n.maillard\VueJS\scrapProsp` et `C:/Users/n.maillard/audit-nmf/gpelec`.
>
> **Les credentials, eux, restent ailleurs.** Le `.env.local` de ce checkout **ne porte pas** les
> `GOOGLE_ADS_*` — ils sont dans le `Credentials.md` du vault Obsidian. Les scripts du 02/09
> (`…-matchtype`, `…-v3-departement`, `…-v3-zone-brissac-angers`, `…-v3-zone-complement`,
> `…-v3-base-livrables`, `…-controle-zone`, `…-saison-multi-annees`, `gpelec-creer-compte`)
> chargent les deux sources et journalisent au démarrage combien de variables viennent du vault.
> Les six scripts d'août (`…-v2`, `…-portefeuille-v2`, `…-marche`, `…-saisonnalite`,
> `…-septembre-cd`, `…-zone-elargie`) ne lisent que le `.env.local` : **leur ajouter ce chargement
> avant toute relance**.

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

## Passe du 2 septembre 2026 — le type de correspondance

| Script | Question | Sortie |
|---|---|---|
| `audit-gp-elec-matchtype.mjs` | la famille climatisation est-elle 12× plus performante que l'électricien, ou seulement mieux servie par le phrase match ? 3 périmètres × 3 correspondances **dans une seule passe** | `data/matchtype-2026-09-02.json` |

Les trois correspondances sont mesurées dans la même passe pour que la comparaison soit **interne** et
insensible à la dérive de Google (mesurée à +5 % en un jour le 05/08). Tout le reste est constant :
budget 200 €, CPC manuel plafonné à 2,07 €, dix communes, fr, Recherche, fenêtre 03/09 → 02/10/2026.
Lecture seule, 9 prévisions, zéro erreur API.

Résultat et interprétation : voir « Relecture du 2 septembre » dans `../README.md`. En bref,
l'hypothèse du gonflement par phrase match est **fausse** — c'est l'électricien qui a la plus grosse
longue traîne, et l'écart entre les deux familles **s'élargit** en correspondance exacte.

> La fenêtre de cette passe (03/09 → 02/10) n'est pas celle des passes d'août (mois de septembre) :
> **rien ici ne se compare terme à terme au 04/08 ou au 05/08.**

## Passe du 2 septembre 2026 — la zone, refaite de bout en bout

Six scripts, dans l'ordre où ils ont tourné. Tous en **lecture seule** : aucune campagne,
aucun plan, rien n'est créé côté Google. **Zéro erreur d'API sur l'ensemble de la journée**,
sauf une, volontairement provoquée et documentée plus bas.

| Script | Question | Sortie |
|---|---|---|
| `audit-gp-elec-v3-departement.mjs` | reprise complète de `v2` sur le **département** en une seule cible : découverte, historique, matrice 3 × 10, capacité par famille | `data/donnees-google-ads-brutes-2026-09-02.json` |
| `audit-gp-elec-controle-zone.mjs` | l'élargissement achète-t-il des clics, ou la dérive de Google explique-t-elle tout ? Dix communes rejouées à **l'enchère du département**, seule la zone varie | `data/controle-zone-2026-09-02.json` |
| `audit-gp-elec-v3-zone-brissac-angers.mjs` | la zone intermédiaire retenue avec le client : 33 communes demandées, résolues, dédoublonnées, tronquées à 20 | `data/donnees-zone-brissac-angers-2026-09-02.json` |
| `audit-gp-elec-v3-zone-complement.mjs` | répare les deux trous laissés par la limite de 10 cibles : familles à enchère comparable, borne basse de volume | `data/zone-complement-2026-09-02.json` |
| `audit-gp-elec-v3-base-livrables.mjs` | **la base chiffrée des trois livrables** : zone retenue, enchère 2,12 €, matrice 3 × 10 + 8 familles | `data/base-livrables-2026-09-02.json` |
| `audit-gp-elec-saison-multi-annees.mjs` | juin est-il un pic de saison ou le marché a-t-il grossi ? **48 mois** au lieu de 12 | `data/saison-multi-annees-2026-09-02.json` |

### Trois limites d'API, dont deux découvertes ce jour

> **1. `generateKeywordHistoricalMetrics` refuse 20 cibles géographiques.**
> `keyword_plan_idea_error: INVALID_VALUE`, mesuré le 02/09. Le dossier affirmait depuis le
> 05/08 que seul `generateKeywordIdeas` plafonnait à 10 et que le forecast en acceptait 20.
> C'est vrai, mais incomplet : **le plafond de 10 vaut aussi pour l'appel historique**. Seul
> `generateKeywordForecastMetrics` accepte 20.
>
> Conséquence pratique : sur une zone de plus de 10 cibles, **ni le volume de recherches ni
> l'enchère médiane ne sont mesurables**. Ils ne peuvent qu'être encadrés par un sous-ensemble
> et un sur-ensemble. `audit-gp-elec-v3-zone-brissac-angers.mjs` s'y est cassé les dents : sa
> phase historique a échoué, l'enchère de référence est tombée sur son **défaut de 2,50 €**, et
> ses 30 prévisions de matrice sont donc inexploitables. C'est `…-base-livrables.mjs` qui les
> refait à l'enchère mesurée.

> **2. `historical_metrics_options.year_month_range` remonte à 48 mois.** Jamais utilisé
> jusqu'ici : le dossier travaillait sur le défaut de 12 mois, ce qui rendait impossible de
> séparer la saison de la croissance. Août 2022 → juillet 2026 accepté du premier coup.

> **3. Rappel du 05/08, toujours valable.** `generateKeywordIdeas` plafonne à 10 cibles ; viser
> un objet géographique de niveau supérieur (le département, `geoTargetConstants/9040907`) rend
> la limite sans objet.

### Le dédoublonnage géographique n'est pas cosmétique

`…-zone-brissac-angers.mjs` résout 33 communes, en garde 20, et **journalise ce qu'il écarte** :
Chalonnes-sur-Loire et Briollay pointent sur le même objet Google que Rochefort-sur-Loire et
Verrières-en-Anjou — elles sont donc couvertes sans consommer de cible ; dix communes de bordure
tombent par la troncature ; Bellevigne-en-Layon n'est pas résolue par Google. Sans ce journal, la
zone réellement mesurée serait devinée.

### `audit-gp-elec-portefeuille-v2.mjs` n'est pas rejouable

Sa liste d'ajouts est écrite en dur — les sept mots-clés retenus le 04/08. Le relancer
ré-appliquerait les décisions d'août aux nouveaux candidats. L'étape « portefeuille » n'est pas
mécanique : c'est là que s'applique la règle de non-gonflement, candidat par candidat.

> **Défaut connu de cette règle.** Sa signature est le couple (volume, enchère haute) : deux
> mots-clés sans enchère collisionnent. Le 02/09, `borne de recharge electra` (480, 0,00 €) est
> signalé comme doublon de `consuel` (480, 0,00 €). Sans conséquence ici — l'IRVE est hors offre —
> mais la règle écarte **en silence** : à corriger avant de la rejouer.

Ordre d'exécution et limites d'API : voir `../README.md`.
