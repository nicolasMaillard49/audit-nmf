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

### Le résumé d'envoi a été refondu le 5 août

**Le plafond d'inventaire n'y figure plus.** En faire le titre et le troisième chiffre-clé d'une
proposition à 2 pages plafonnait la relation avant qu'elle commence, sans aucun gain commercial. Il
reste porté par la version commerciale (page « Preuve budgétaire ») et par la technique : rien n'est
dissimulé, c'est une question de place dans le document d'envoi. Le contrôle `plafond arrondi` a été
retiré de `render-all.mjs` en conséquence — son absence dans le résumé n'est pas une régression.

**Le document suit désormais le skill `vente-artisans`** (PPCO : problème, preuve, calcul, offre) :

- le jargon est sorti — plus de « visites qualifiées », « enchère plafonnée », « portefeuille de
  mots-clés » ni « API » ; le troisième chiffre-clé est le coût d'un clic expliqué en clair ;
- le document dit où le budget achète réellement quelque chose, et où il n'achète rien : sur
  `electricien angers`, les annonceurs montent à **5,14 €** le clic et le plafond retenu est de
  2,07 € — **cette place ne s'achète pas à 200 €/mois**, le résumé l'écrit noir sur blanc. Ce que le
  budget achète, c'est la climatisation (enchères hautes 1,28–2,43 €, **121 des 133 visites**) ;
- le calcul est laissé au client (« une installation de climatisation signée sur les trois mois et
  les 600 € sont derrière vous — faites le calcul »), conformément au skill ;
- la clôture est un choix binaire, pas un « n'hésitez pas » ;
- **« Deux semaines de préparation » a été retiré** de l'étape 01 : la règle NMF interdit toute
  estimation de temps dans un document client. L'étape s'appelle « Avant l'ouverture ».

Trois affirmations ont été écartées parce qu'elles étaient fausses ou non démontrables :

1. « le budget qui rend le plus par euro dépensé » — le coût par clic est **plat à 1,49 €** sur tous
   les paliers en haut de page, aucun palier ne « rend » mieux qu'un autre.
2. « votre nom s'affiche en premier » — l'enchère cible le haut de page, elle ne garantit aucune
   position.
3. **« des annonceurs montent jusqu'à 5,14 € le clic pour cette place, nous on la prend à
   1,49 € »** — sous-entendait qu'on gagne la même place trois fois moins cher. La donnée du dossier
   dit l'inverse : le plafond retenu est 2,07 €, et quand la famille C (`electricien angers` et ses
   390 recherches, 9 mots-clés) reçoit **seule** les 200 €, elle ne dépense que **24,13 € pour 23
   clics**. C'est la signature d'une enchère trop basse pour l'inventaire : on ne gagne que les
   enchères les moins chères de la famille. Les 133 clics viennent à **121 sur 133** de la
   climatisation, où les enchères hautes plafonnent entre 1,28 € et 2,43 €.

> **Aucune affirmation de position ne doit figurer dans un livrable.** `KeywordForecastMetrics` v24
> ne rend ni impressions, ni CTR, ni position moyenne : nous n'avons pas de quoi étayer un rang. Et
> l'Ad Rank intègre la qualité de la page d'arrivée — mobile à 81, LCP 4,5 s, aucune page dédiée
> climatisation, aucun événement de conversion. Promettre le haut de page sur la requête la plus
> disputée à 200 €/mois serait indéfendable.

Le cas GP elec / « Pierre » sert de preuve client dans le skill `vente-artisans` : **inutilisable
ici**, c'est le destinataire du document, et le chiffre de 45 appels par mois qu'il avance n'existe
dans aucune de nos données.

**`fix-typo.mjs` gère maintenant les guillemets** (insécable après `«` et avant `»`). Sans elle, le
`»` de « électricien » partait seul en fin de ligne dans le résumé. La règle a été appliquée aux
trois rapports.

## Les sept points bloquants (version technique)

1. `aggregateRating` **4,9 / 84 faux** dans le JSON-LD et affiché en page — la fiche porte **5,0 / 9**.
2. Qualification **Qualifelec** revendiquée alors qu'elle **n'est pas détenue** (vérifié le 02/09).
3. **Cinq** `[À COMPLÉTER]` servis en production dans `/mentions-legales`.
4. **GA4 chargé sans consentement**, aucun bandeau, aucune politique de confidentialité liée.
5. `canonical`, `og:*`, `twitter:image` et les deux `hreflang` pointent sur **www**, qui répond **307** vers l'apex.
6. **Trois témoignages inventés** — Marie D., Patrick M., Sophie L., `ville: "[À COMPLÉTER]"` — servis
   sous un badge « Avis vérifiés », la mention Google My Business et un lien mort. La fiche porte neuf
   avis réels, dont aucun de ces textes.
7. **Ancienneté de 40 ans revendiquée** et `foundingDate: '1986'` dans le JSON-LD, alors que l'entreprise
   a été créée le **2 septembre 2025** et que son dirigeant est né en 2001.

> **Les constats 6 et 7 ont été ajoutés le 2 septembre : ils manquaient à la passe du 4 août.** Le
> constat 1 avait relevé l'`aggregateRating` faux sans voir les trois témoignages eux-mêmes, et
> personne n'avait confronté l'ancienneté au registre. Le score de préparation passe de **41 à 39
> sur 100** — l'axe Conformité tombe de 3 à 1 sur 20.
>
> **Statut au 02/09.** Les constats 2 (Qualifelec), 4 (consentement) et 5 (canonique) sont **corrigés
> en local, non déployés** — branche `p0-conformite` du dépôt du site. Le 6 attend le relevé des
> neuf vrais avis, bloqué. Le 7 est **laissé en l'état sur arbitrage client**. Le 3 attend Pierre.

> **Le constat 3 demandait des champs qui n'existent pas.** Vérification au registre le 02/09
> (SIREN 990 872 129) : GP elec est une **entreprise individuelle**, pas une société. Ni capital
> social, ni RCS. Les lignes « forme juridique au capital de » et « RCS » des mentions légales sont à
> **supprimer**, pas à compléter. Restent le SIRET — déjà en ligne et concordant —, la TVA si
> assujetti et la décennale.

Aucun des cinq P0 relevés le 31/07 n'a été corrigé, et la performance mobile a reculé de
**97 à 81** (LCP 2,0 s → 4,5 s). Détail dans `data/diagnostic.json`.

> **Recomptage du 2 septembre 2026 — constats 2 et 3 seulement.** Le site a reçu **sept commits**
> depuis la mesure du 04/08 ; tout le reste de `diagnostic.json` reste daté du 04/08 et n'a pas été
> revérifié. Deux corrections : la qualification Qualifelec n'était pas un défaut de documentation
> mais une **revendication sans objet** — elle tenait à quatre endroits, dont la donnée structurée lue
> par Google ; et le comptage des `[À COMPLÉTER]` **annonçait deux occurrences pour cinq**. Le SIRET,
> lui, a été renseigné côté client entre-temps et l'accueil n'en porte plus aucune. Les quatre sources
> de la revendication ont été retirées en local le 02/09 — **non déployé**.

## Relecture du 5 août : saison, enchère, zone

Trois questions posées après coup, trois mesures. Données dans `data/saisonnalite-forecast-2026-08-05.json`,
`data/septembre-sans-clim-2026-08-05.json`, `data/zone-elargie-2026-08-05.json` — **327 prévisions au
total, zéro erreur API**, tout en lecture seule.

### 1. La prévision tient compte de la saison

Vérifié à budget (200 €), plafond (2,07 €), zone, langue, réseau et portefeuille constants, seule la
fenêtre variant :

| Cible | Septembre 2026 | Mai 2027 | Juin 2027 |
|---|---|---|---|
| Portefeuille | 197,40 € · **132** cl · 1,50 € | 203,98 € · 109 cl · 1,87 € | 197,40 € · **182** cl · **1,08 €** |
| A climatisation | 197,40 € · 121 cl · 1,63 € | 203,98 € · **91** cl · **2,25 €** | 197,40 € · **176** cl · **1,12 €** |
| C électricien | 24,26 € · 23 cl | 27,22 € · 26 cl | 30,55 € · 25 cl |

**Juin écrase septembre** : 176 clics contre 121 pour le même budget, à 1,12 € au lieu de 1,63 €. Et
**mai est le pire mois** — la demande monte, la concurrence monte plus vite. La climatisation pèse
**350 recherches en septembre 2025** contre 1 011 de moyenne sur les douze mois et **5 830 en juin
2026** (volumes mensuels réels, `historical[].months`, série **juillet 2025 → juin 2026**).
L'hypothèse « réversible, donc achat d'automne pour chauffer » est **fausse sur cette zone** :
`climatisation reversible` fait 30 en septembre 2025 pour 480 en juin 2026. Seul
`pompe a chaleur air air` a un profil d'hiver.

> **Ces volumes mensuels ne sont pas un dénominateur de la prévision** — correction du 02/09. La
> série `months` s'arrête en juin 2026 : son « septembre » est **septembre 2025**, onze mois avant la
> fenêtre prévue, sur un marché où la famille A est passée de 1 020 (juil. 2025) à 5 830 (juin 2026).
> Rapporter les clics prévus pour septembre 2026 à ces volumes pour en tirer un « taux de capture »
> mélange deux millésimes et ne veut rien dire. L'erreur a été commise en relecture, **elle n'a
> jamais atteint un livrable**. Le profil de saison, lui, tient : il se lit **à l'intérieur** d'une
> seule série continue.

### 2. Le plafond de 292 € est celui de l'enchère, pas du marché

Même zone, même fenêtre, seul le plafond d'enchère varie :

| Plafond | Dépense max | Clics | CPC |
|---:|---:|---:|---:|
| 2,07 € | 306 € | 222 | 1,38 € |
| 3,50 € | **513 €** | 269 | 1,91 € |
| 5,20 € | 677 € | 293 | 2,31 € |
| maximisation des clics | 1 110 € | 318 | 3,49 € |

**Un objectif de 500 € de dépense mensuelle réelle est donc atteignable sans toucher à la zone.**
Les deux rapports affirmaient « au-delà de 292 €, Google n'a plus rien à vendre » et « le reste ne
s'achète pas : il n'existe pas assez de recherches sur votre zone » — **faux**, corrigé le 05/08 dans
les deux variantes. L'inventaire existe ; il coûte plus cher au clic.

À noter : le plafond mesuré à 2,07 € vaut **306 €** le 05/08 contre 291,81 € le 04/08 — **+5 % en un
jour**. Google reprévoit en continu, un plafond gravé dans un PDF doit être daté.

### 3. Élargir la zone bat largement monter l'enchère

| Route vers 500 € de dépense réelle | Clics | CPC |
|---|---:|---:|
| Dix communes, enchère portée à 3,50 € | 269 | 1,91 € |
| **Maine-et-Loire, enchère laissée à 2,07 €** | **451** | **1,36 €** |

**+68 % de clics pour 29 % moins cher au clic.** Sur le département, le portefeuille absorbe 614 € à
l'enchère d'origine.

**Mais la domination de la climatisation ne vient pas de la zone.** Dans les quatre zones testées, la
famille A pèse 78 à 90 % des clics du portefeuille. Hors climatisation, même sur tout le département,
le plafond est de 230 € par mois (93 € à l'enchère de 2,07 €). Élargir la zone ne change pas le fait
que les autres familles sont structurellement petites.

**La maximisation des clics reste un piège** : 1 110 € pour 318 clics contre 306 € pour 222 clics en
enchère plafonnée — 3,6 fois la dépense pour 43 % de clics en plus, à 3,49 € le clic. Le choix du CPC
manuel de l'audit est confirmé.

> **Décision en attente.** Rien n'a été re-basé sur une zone plus large : les trois livrables restent
> sur les dix communes, qui correspondent à la zone déclarée du client. Passer l'étude au département
> change la prémisse de l'audit et doit être tranché avec le client.

## Relecture du 2 septembre : le type de correspondance

Une objection restait ouverte : la famille A capte 121 clics quand la famille C en capte 23, alors que
C porte **plus** de recherches canoniques que A. Hypothèse posée : le **phrase match** ratisserait pour
la climatisation une longue traîne absente des volumes du portefeuille, et gonflerait A.

`audit-gp-elec-matchtype.mjs` rejoue le même forecast en EXACT, PHRASE et BROAD **dans une seule
passe** — 9 prévisions, lecture seule, zéro erreur API. Budget 200 €, plafond 2,07 €, dix communes,
fenêtre 03/09 → 02/10/2026. Données dans `data/matchtype-2026-09-02.json`.

| Périmètre | EXACT | PHRASE | BROAD |
|---|---|---|---|
| **A — climatisation** (21 mots) | 78 cl · **84,91 €** · 1,08 € | 184 cl · 197,40 € · 1,07 € | 201 cl · 197,40 € · 0,98 € |
| **C — électricien** (9 mots) | 12 cl · **11,06 €** · 0,93 € | 46 cl · 44,48 € · 0,97 € | 50 cl · 49,90 € · 0,99 € |
| Portefeuille (73 mots) | 109 cl · 116,53 € · 1,07 € | 187 cl · 197,40 € · 1,06 € | 201 cl · 197,40 € · 0,98 € |

**L'hypothèse est fausse, et l'inverse est vrai.** En passant de PHRASE à EXACT, **C perd 74 % de ses
clics et A seulement 57 %** : la longue traîne est proportionnellement *plus* grosse sur électricien
que sur climatisation. Le rapport A/C ne se referme pas, il s'écarte — **4,0× en phrase, 6,5× en
exact**. La conclusion centrale de l'audit tient : la climatisation absorbe le budget, l'électricien
non, et ce n'est **pas** un artefact de correspondance.

**Deux lectures secondaires.**

- **EXACT ne dépense pas le budget** : 116,53 € sur 200 € demandés pour le portefeuille entier, 11,06 €
  pour la seule famille C. En correspondance exacte, l'inventaire de la zone ne suffit pas — une raison
  de plus de ne pas ouvrir la campagne en exact.
- **BROAD n'achète presque rien de plus que PHRASE** (201 clics contre 187, à 0,98 € contre 1,06 €) et
  ouvre le ciblage à des requêtes non contrôlées. Le choix du phrase match de l'audit est confirmé.

> **Ces chiffres ne se comparent pas terme à terme avec ceux du 05/08.** La fenêtre a bougé
> (03/09 → 02/10 au lieu du mois de septembre) et Google reprévoit en continu : la famille A en phrase
> vaut 184 clics ici contre 121 le 05/08, pour la même dépense. **Seuls les écarts internes à cette
> passe font foi** — c'est précisément pour cela que les trois correspondances ont été mesurées dans
> la même passe. Et c'est un rappel de plus : un chiffre de prévision gravé dans un PDF doit être daté.

## La zone, tranchée le 2 septembre

**Décision prise : le test ouvre sur une zone intermédiaire**, l'agglomération d'Angers plus la
couronne jusqu'à Brissac, Chalonnes, Seiches, Beaufort et Saint-Georges-sur-Loire. Ni les dix
communes de l'audit, ni le département.

### Ce que l'élargissement achète, mesuré à variable unique

Trois zones, **même fenêtre, même enchère 1,92 €, même portefeuille, même correspondance**. Seule
la zone varie — c'est la seule façon de ne pas confondre l'effet de zone avec la dérive de Google,
mesurée à +5 % en un jour le 05/08 et bien plus sur un mois.

| Budget/mois | Dix communes | **Zone retenue (20 cibles)** | Département |
|---:|---|---|---|
| 200 € | 197 cl · 1,00 € | **192 cl · 1,03 €** | 188 cl · 1,05 € |
| 300 € | 296 cl · 1,00 € | **289 cl · 1,03 €** | 282 cl · 1,05 € |
| 500 € | 360,77 € · 360 cl | **447,78 € · 437 cl** | 493,50 € · 470 cl |
| 1 000 € et au-delà | 360,77 € · 360 cl | **447,78 € · 437 cl** | 720,42 € · 686 cl |

**À budget de test, les trois zones rendent la même chose à 5 % près.** Élargir ne fait pas venir
plus de monde à 200 €/mois — au contraire, le CPC monte avec la taille de la zone (1,00 → 1,03 →
1,05 €), parce qu'on ajoute des enchères plus disputées autour d'Angers, pas du volume gratuit.

**Le choix de zone est un choix de plafond de budget, pas de trafic.** Les trois plafonds sont
démontrés au sens des trois conditions du skill :

| Zone | Plafond d'inventaire | Clics |
|---|---:|---:|
| Dix communes | 360,77 € | 360 |
| **Zone retenue** | **447,78 €** | **437** |
| Département | 720,42 € | 686 |

Le département reste documenté comme **palier de montée** : il double l'inventaire, au prix d'un
arrosage jusqu'à Cholet, Saumur et Segré, hors rayon d'intervention déclaré.

> **Ce qui est faux et qu'il ne faut pas reprendre.** Le passage « Élargir la zone bat largement
> monter l'enchère : +68 % de clics pour 29 % moins cher » du 05/08 comparait deux enchères
> différentes en même temps que deux zones. À enchère constante, l'élargissement ne rend rien sous
> 300 €/mois. La mesure du 05/08 n'est pas fausse, sa lecture l'était.

### La zone réellement mesurée

**20 cibles** : Brissac Loire Aubance, Angers, Les Ponts-de-Cé, Trélazé, Avrillé,
Saint-Barthélemy-d'Anjou, Bouchemaine, Beaucouzé, Verrières-en-Anjou, Écouflant, Montreuil-Juigné,
Loire-Authion, Les Garennes-sur-Loire, Mûrs-Érigné, Sainte-Gemmes-sur-Loire, Beaufort-en-Anjou,
Rochefort-sur-Loire, Tiercé, Seiches-sur-le-Loir, Saint-Georges-sur-Loire.

- **Couvertes sans consommer de cible** : Chalonnes-sur-Loire et Briollay pointent sur le même
  objet Google que Rochefort-sur-Loire et Verrières-en-Anjou.
- **Hors périmètre**, écartées par le plafond de 20 : Bécon-les-Granits, Longuenée-en-Anjou,
  Le Lion-d'Angers, Jarzé Villages, Mazé-Milon, La Ménitré, Gennes-Val-de-Loire, Tuffalun, Denée,
  Mozé-sur-Louet.
- **Non résolue par Google** : Bellevigne-en-Layon.

### La base chiffrée des livrables

Zone retenue, **enchère 2,12 €**, fenêtre 03/09 → 02/10/2026, phrase match. Zéro erreur d'API.

| Budget demandé | Dépense | Clics | CPC |
|---:|---:|---:|---:|
| 200 € | 197,40 € | **180** | **1,10 €** |
| 500 € | 493,50 € | 451 | 1,10 € |
| 750 € et au-delà | **496,00 €** | **453** | 1,10 € |

Domination (3,18 €) : 655,60 € / 490 clics. Maximisation des clics : 1 368,39 € pour 552 clics à
**2,48 €** le clic — 2,8 fois la dépense pour 22 % de clics en plus. Le CPC manuel reste le choix.

**Capacité par famille**, chacune recevant seule les 200 € :

| Famille | Clics | Dépense |
|---|---:|---:|
| A — Climatisation et PAC air/air | **177** | **197,40 €** |
| C — Électricien général | 51 | 51,67 € |
| G — Domotique | 33 | 36,33 € |
| D — Rénovation, normes, Consuel | 12 | 11,62 € |
| B — Dépannage et urgence | 3 | 4,29 € |
| H — Devis, prix et tarifs | 3 | 2,25 € |
| F — Aménagement cuisine | 1 | 0,14 € |
| E — Installation neuve | 0 | 0,00 € |

La climatisation sature toujours seule le budget de test. Mais la capacité **hors climatisation**
passe à ~106 €/mois, contre ~48 € sur les dix communes du 04/08 : une campagne non-clim devient
finançable. C'est le vrai gain de la zone.

### Deux chiffres qui ne sont pas mesurables, et qu'il faut donner comme tels

`generateKeywordHistoricalMetrics` **refuse plus de 10 cibles géographiques**
(`INVALID_VALUE`, mesuré le 02/09 — voir `ads/README.md`). Sur une zone à 20 cibles, ni le volume
ni l'enchère médiane ne se mesurent. Ils sont encadrés :

| | Sous-ensemble (cœur, 10 cibles) | Sur-ensemble (département) |
|---|---:|---:|
| Recherches mensuelles | 2 510 | 5 670 |
| Enchère haute médiane | 2,12 € | 1,92 € |

**L'enchère retenue est 2,12 €** : le département dilue avec des enchères rurales moins chères que
celles réellement affrontées autour d'Angers, retenir la borne basse sous-estimerait la
concurrence. Le 2,07 € du dossier d'août tombe dans la fourchette.

> Le volume de la zone **ne doit jamais être présenté comme une mesure** dans un livrable, mais
> comme un encadrement. Et « 2 510 contre 3 000 le 04/08 » n'est pas une baisse : ce ne sont pas
> les mêmes dix communes — le cœur de la zone retenue contient Beaucouzé et Écouflant là où
> l'audit avait Loire-Authion et Beaufort-en-Anjou.

## La saison, sur quatre ans au lieu d'un

`historical_metrics_options.year_month_range` remonte à **48 mois** — champ jamais demandé
jusqu'ici, le dossier travaillait sur le défaut de 12. Série obtenue : **août 2022 → juillet 2026**.
Avec une seule année, il était impossible de séparer la saison de la croissance.

### « Attendez juin » ne tient pas

Famille climatisation, mois de juin, sur le cœur de la zone :

| 2023 | 2024 | 2025 | 2026 |
|---:|---:|---:|---:|
| 940 | 600 | 1 030 | **4 040** |

**Juin 2026 fait quatre fois n'importe quel autre juin.** Ce n'est pas un pic saisonnier récurrent,
c'est un événement de 2026 — et il porte sur toute la famille, pas sur un mot-clé :
`climatisation maison` passe de 210 à 880, `climatisation angers` de 170 à 720,
`installateur climatisation` de 140 à 590.

Or la relecture du 05/08 concluait « juin écrase septembre, 176 clics contre 121 » et invitait à
décaler la campagne. **Cette recommandation repose sur un seul mois exceptionnel**, et la prévision
de juin 2027 rendue par Google extrapole vraisemblablement ce niveau. À reprendre dans les
livrables avant tout conseil de calendrier.

Septembre pour la climatisation, en revanche, est **stable et bas** sur quatre ans — 470, 610, 230,
260, soit un indice de **73** pour une moyenne à 100. Ça, c'est solide.

### L'électricien s'érode, et ça pèse plus lourd que la zone

Famille C, mois de septembre : **1 590 → 1 260 → 780 → 620** de 2022 à 2025. **−61 % en trois ans.**
Ce n'est pas de la saison, c'est structurel. Aucun choix de zone ne compense ça.

### Le pic de septembre de la domotique est réel et inachetable

Famille G, indice de septembre **315**, répété tous les ans. Mais mot par mot il vient
**entièrement de `domotique` seul** : 480, 1 000, 720, 720 en septembre contre 140 en octobre.
C'est la requête que le 04/08 avait déjà écartée comme informationnelle — « quelqu'un qui lit une
définition, pas qui cherche un artisan ». Le pic existe, il ne s'achète pas. La règle tient.

> **Les trois PDF portent encore la base du 04/08** : dix communes, 3 000 recherches, 133 clics à
> 1,49 €, plafond 291,81 €. Ils n'ont pas été réécrits sur la zone retenue. Tant que ce n'est pas
> fait, **aucun des trois ne doit partir chez le client**.

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

Les scripts d'extraction vivent dans le checkout `scrapProsp`, avec le module `app/lib/googleAds/`
et le `.env.local`. Ils écrivent directement dans `gpelec/data/`.

> **Le chemin a changé, et les credentials ne sont pas où les en-têtes le disent.** Les scripts de la
> passe d'août annoncent `D:\projets\scrapProsp` — ce chemin **n'existe pas** sur la machine
> courante, où le checkout est `C:\Users\n.maillard\VueJS\scrapProsp`. Et son `.env.local` ne porte
> **pas** les `GOOGLE_ADS_*` : ils sont dans le `Credentials.md` du vault Obsidian.
> `audit-gp-elec-matchtype.mjs` charge les deux sources et journalise au démarrage combien de
> variables il a reprises du vault ; les scripts plus anciens supposent encore le `.env.local` seul et
> doivent être repathés avant d'être relancés.

```bash
cd C:/Users/n.maillard/VueJS/scrapProsp
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
