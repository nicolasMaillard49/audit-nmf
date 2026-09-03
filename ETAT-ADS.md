# État des travaux Google Ads — 3 septembre 2026

Vue transverse des quatre dossiers clients. Ce fichier ne contient **aucun chiffre qui ne
soit pas déjà dans un `data/*.json`, un script versionné ou un relevé daté** : il dit où en
est chaque client, quelle donnée fait foi, et quelle est la prochaine action. Le détail reste
dans le `README.md` de chaque dossier.

Tous les comptes clients sont sous le MCC **`671-181-3801`**.

| Client | Compte Ads | Campagne | Statut | Prochaine action |
|---|---|---|---|---|
| [Totowood](#totowood) | `370-246-3294` | **diffuse** depuis le 31/08 | 63/72 étapes | débloquer les mentions légales du client |
| [La Rencontre](#la-rencontre) | `404-054-1764` | **montée, en pause** | chaîne de conversion câblée de bout en bout, **zéro conversion enregistrée** | déclencher une vraie conversion depuis un navigateur sans bloqueur |
| [GP elec](#gp-elec) | **à créer** | — | zone et enchère tranchées, livrables périmés | réécrire les 3 PDF, créer le compte à la main |
| [RH Patrimoine](#rh-patrimoine) | existant, au client | déjà active chez lui | audit prospect livré | aucune en cours |

> **Le travail Ads n'est pas entièrement dans ce dépôt.** Ce dépôt porte les **audits**. Les
> scripts qui appellent l'API vivent dans `C:\Users\n.maillard\VueJS\scrapProsp` (versionnés,
> repo `scrapProsp`) et sont **copiés en archive** dans `<client>/ads/`. Le dispositif de
> campagne de Totowood — landing pages, suivi des 72 étapes — vit dans
> `C:\Users\n.maillard\VueJS\totowood-lp`. Les sites clients ont chacun leur dépôt.

---

## Totowood

Menuiserie sur-mesure, Annet-sur-Marne (77). S.A.S., SIREN 934 186 412.
**Le dossier le plus avancé : c'est le seul qui dépense de l'argent.**

**Le dispositif**

| | |
|---|---|
| Campagne | `Recherche - Sur-mesure 77`, `campaignId 24204097327` — **diffuse depuis le 31/08 au soir** |
| Budget | 16,45 €/jour |
| Enchères | Maximiser les clics, plafond CPC 3,04 € |
| Groupes | 4 : Sous-pente & sous-escalier (760 rech./mois), Dressing (580), Bibliothèque (310), Cuisine (120) |
| Landing pages | `devis.totowood.fr` — 4 pages que l'agence possède, **pas** le site du client |
| Conversions | 2 actions actives, remontée **hors ligne via `gclid`**, testée (`check-conversions.mjs` sort 0) |
| Facturation | **Totowood paie** — carte du client, seuil 10 € |
| Exclusions | 42 au niveau compte |

**Premier jour de diffusion — relevé au navigateur le 01/09/2026**

| | Impr. | Clics | CTR | CPC moy. | Coût |
|---|---:|---:|---:|---:|---:|
| Sous-pente & sous-escalier | 20 | 4 | 20,00 % | 1,37 € | 5,48 € |
| Dressing | 61 | 3 | 4,92 % | 2,17 € | 6,51 € |
| Cuisine | 25 | 0 | — | — | 0,00 € |
| Bibliothèque & meubles | 19 | 0 | — | — | 0,00 € |
| **Compte** | **125** | **7** | **5,60 %** | **1,71 €** | **11,99 €** |

Zéro conversion — ce qui ne veut rien dire à 7 clics. Les 4 annonces sont **Éligibles**, les
4 groupes diffusent. Les liens annexes travaillent : 92 des 125 impressions en portent un, à
7,61 % de CTR contre 5,60 % pour la campagne.

**Ce qui a déjà été corrigé le jour 1.** Le rapport Termes de recherche a montré, sur 56
termes, que les 14 exclusions de compte **ne couvraient pas les marques concurrentes** :
4,86 € des 11,99 € partaient sur `schmidt dressing sur mesure` et `dressing celio sur mesure`.
28 exclusions ajoutées le 01/09, le compte passe à 42.

**Ce qui reste — 9 étapes sur 72, par ordre d'urgence**

1. **Les mentions légales du client sont incomplètes et publiques.** L'encadré « à compléter
   avant mise en ligne » est servi sur `devis.totowood.fr/mentions-legales` **alors que les
   annonces tournent**. Manquent : capital social, ville du greffe (RCS), assurance décennale.
   C'est le seul feu rouge du dispositif, et il dépend d'Antoine.
2. **Validation de l'annonceur** — plus aucune tâche requise, mais une question reste ouverte
   exprès : celle qui fait accepter que Google publie les créations, les emplacements, les
   coordonnées et l'historique des noms. C'est un engagement au nom de Totowood, Google la
   marque facultative — à trancher, pas à cocher machinalement.
3. Le **brouillon résiduel `Campaign #1`** traîne à 1 €/jour. Il ne diffuse pas ; sa
   suppression est irréversible, donc laissée à toi. `totowood-brouillon.mjs` est le garde-fou.
4. Le **passage à Maximiser les conversions au 30ᵉ lead** — c'est le prochain geste
   d'enchères, pas un retour au CPC manuel.

Suivi détaillé, preuve par preuve : `totowood-lp/docs/avancement.json` (`npm run docs`).
L'audit de juillet et les scripts : [`totowood/README.md`](totowood/README.md) et
[`totowood/ads/README.md`](totowood/ads/README.md).

## La Rencontre

Restaurant italien, 42 rue Maréchal Joffre, Bordeaux. SAS, SIREN 937 965 390.
Périmètre : **le service du soir**.

**Le dispositif est monté, il ne diffuse pas.**

| | |
|---|---|
| Compte | `404-054-1764`, créé le 01/09/2026 après vérification au registre |
| Campagne | `Recherche - La Rencontre Soir`, `campaignId 24197703801` — **PAUSED** |
| Budget | 150 €/mois, soit 4,93 €/jour |
| Réseau | Recherche seul |
| Calendrier | tous les jours, **17 h → 22 h** — « soir » porte sur le service vendu, pas sur les jours d'ouverture |
| Groupes | 3 : Italien, Gastronomique, Découverte — mots clés en expression **et** exact |
| Exclusions | 27, au niveau campagne |
| Composants | posés au niveau campagne (liens annexes, téléphone) |

**Ce qui bloque, et c'est volontaire.** La campagne a été créée en pause exprès : il ne faut
pas la démarrer avant que la conversion **`generate_lead` soit étoilée dans GA4 puis importée**
dans le compte. Sans elle on dépense à l'aveugle. C'est exactement le P0 que l'audit avait
posé début août — l'événement « réservation confirmée ».

**La chaîne de conversion — tout est câblé, il manque une conversion réelle**

| # | Maillon | État |
|---|---|---|
| 1 | Événement `generate_lead` au succès du formulaire | ✅ posé le 01/09 |
| 2 | Déployé en production | ✅ dans le bundle de `restaurantlarencontre.com/reservation`, balise `G-WP4T76RWV4` active |
| 3 | L'événement part avec les bons paramètres | ✅ vérifié au navigateur le 03/09 |
| 4 | `generate_lead` marqué **événement clé** dans GA4 | ✅ étoilé dans Admin › Événements |
| 5 | Importé comme conversion dans le compte `404-054-1764` | ✅ action `restaurant la rencontre (web) generate_lead`, **Principale**, incluse dans les objectifs, fenêtre 90 j |
| 6 | Une conversion réellement enregistrée | ❌ **« En attente de conversions » — zéro à ce jour** |
| 7 | Campagne dé-pausée | ❌ — le dernier geste |

**Le test du 03/09.** Une vraie demande a été passée en production (2 couverts, jeudi 10/09 à
20 h) puis **annulée dans la foulée**. L'événement est parti avec tous ses paramètres justes —
`en=generate_lead`, `ep.transaction_id` = le cancelToken, `epn.party_size=2`,
`ep.service_date=2026-09-10T20:00:00`, `ep.service=Service Soir`. **Mais la requête a répondu
HTTP 503**, et GA4 « Temps réel » affiche 0 utilisateur sur 30 minutes : le hit n'est pas
arrivé.

> **Ce n'est ni le site ni le réseau : c'est ce profil Chrome.** Un `curl` vers le même
> endpoint depuis la même machine répond 204. Une extension intercepte
> `region1.analytics.google.com` et renvoie 503 — dans la même page,
> `www.google.fr/ads/ga-audiences` passe en 200, et la propriété reçoit du trafic normalement
> (306 utilisateurs sur 7 jours, 2,4 k événements).

**Pour finir** : refaire la demande depuis un navigateur **sans bloqueur** (un téléphone en 4G
suffit), puis regarder l'action passer de « En attente de conversions » à active — le décalage
GA4 → Ads peut prendre quelques heures. Ensuite seulement, dé-pauser.

**Ce que l'audit avait établi** (extraction du 02/08, 77 mots-clés, 10 communes, 10 paliers) :
11 750 recherches mensuelles hors marque ; plafond de dépense réellement utile aux alentours
de **360 €/mois**, au-delà le budget n'est plus absorbé ; recommandation d'un test à
**150 €/mois** — c'est le budget effectivement posé. Verdict : go pour un test encadré.

**À savoir**

- **La copie des annonces a été retrouvée le 03/09.** Elle était sur `origin/main` du dépôt du
  site, mais le checkout local avait **sept commits de retard** : un `git pull` l'a ramenée à
  `VueJS\retaurantLaRencontre\docs\ads\annonces-google-ads.md`. Son compteur de caractères
  contrôle 80 lignes dans 10 sections et passe.
- **Le téléphone à utiliser est le 05 47 74 03 99**, celui du site en ligne. Le dump SQL local
  porte encore `05 56 81 88 88`, périmé.
- Les deux PDF livrés (audit + proposition) sont **calés sur un calendrier échu** — « dès la
  mi-août », « 1er septembre, pleine vitesse sur le pic ». À redater avant tout renvoi.

Détail : [`la-rencontre/README.md`](la-rencontre/README.md) et
[`la-rencontre/ads/README.md`](la-rencontre/ads/README.md).

## GP elec

Électricien, Brissac Loire Aubance (49). Entreprise individuelle, SIREN 990 872 129,
créée le 02/09/2025. **Rien n'est encore ouvert côté Google.**

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

1. **Les trois PDF portent encore la base du 04/08** — dix communes, 3 000 recherches,
   133 clics à 1,49 €, plafond 291,81 €. Ils n'ont pas été réécrits sur la zone retenue.
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
4. **Le formulaire de contact est toujours en `mailto:`, et il n'y a pas de page `/merci`.**
   C'est le constat P1 #7, ouvert depuis le 31/07 et **jamais corrigé** : vérifié le 03/09,
   le dépôt du site ne porte aucun backend d'envoi — ni route Nitro, ni Resend, ni Formspree —
   et son dernier commit reste le merge de conformité du 02/09. Conséquence directe pour
   Google Ads : **aucune conversion n'est mesurable sur ce site**. Le brancher est un
   prérequis à l'ouverture de la campagne, au même titre que `generate_lead` l'est pour
   La Rencontre.

> **Il n'y a aucun dispositif de mailing propre à GP elec.** Le seul envoi d'e-mail de
> l'agence est celui de `scrapProsp` — `app/lib/email.ts` via Resend, habillé le 27/08
> (`793dc25`) et testable par `node scripts/apercu-lead.mts --mail` (`14fde44`). Il notifie
> l'agence et l'artisan d'une demande de devis arrivée par les **landing pages Totowood**,
> et n'est branché sur rien chez GP elec.

Détail complet, limites d'API et pièges : [`gpelec/README.md`](gpelec/README.md) et
[`gpelec/ads/README.md`](gpelec/ads/README.md).

## RH Patrimoine

Agence immobilière, Talence / Bordeaux Métropole. Audit prospect livré en juillet 2026.
Deux passes ont été menées : la passe retenue occupe la racine du dossier, la première est
conservée dans `rh-patrimoine/legacy/passe-claude/`.

**C'est le seul dossier adossé à des dépenses réellement constatées.** Le prospect avait déjà
un compte Google Ads actif — le sien, pas un compte MCC — et
`rh-patrimoine/ads/google_ads_real_estimate.mts` lit le **rapport réel** de sa campagne
(`customerId 4838999588`, `campaignId 23955483287` : impressions, clics, CTR mesurés) avant de
le confronter à la découverte de mots-clés sur Bordeaux. Partout ailleurs dans ce dépôt, les
chiffres sont des prévisions.

> Ce script ne lit **que** le `.env.local` du checkout `scrapProsp` — où les `GOOGLE_ADS_*`
> ne sont pas. Lui ajouter le chargement du vault avant toute relance.

Aucune action en cours.

---

## Ce que contient réellement le MCC — relevé au navigateur le 03/09/2026

Le MCC `671-181-3801` (« Compte Parent ») porte **exactement trois sous-comptes** :

| Compte | Identifiant |
|---|---|
| Totowood | `370-246-3294` |
| RESTAURANT LA RENCONTRE | `404-054-1764` |
| Couvreur Peter 06 72 44 92 46 | `483-899-9588` |

Deux conséquences.

1. **Il n'existe aucun compte GP elec** — cohérent avec le refus d'API du 02/09.
2. **`483-899-9588` s'appelle aujourd'hui « Couvreur Peter »**, alors que
   `rh-patrimoine/ads/google_ads_real_estimate.mts` lit ce même `customerId` (`4838999588`,
   campagne `23955483287`) et présente le résultat comme le rapport réel de RH Patrimoine.
   Soit le compte a été renommé et réaffecté depuis juillet, soit l'audit RH Patrimoine s'est
   appuyé sur les chiffres d'un autre client. **À vérifier avant de réutiliser ces chiffres.**

## Rappels transverses

**Où sont les credentials.** Les `GOOGLE_ADS_*` ne sont **pas** dans le `.env.local` du
checkout `scrapProsp` sur cette machine — vérifié le 03/09/2026, le fichier n'en porte aucune.
Ils vivent dans `Credentials.md` du vault Obsidian (`C:\Users\n.maillard\Obsidian\Cerveau`).
Seuls les scripts GP elec de la passe du 02/09 chargent les deux sources et journalisent au
démarrage combien de variables viennent du vault ; **tous les autres — La Rencontre, Totowood,
RH Patrimoine — ne lisent que le `.env.local` et ne tourneront pas ici en l'état.**

> Une note de `totowood-lp/docs/avancement.json` affirme le contraire (« les identifiants
> `GOOGLE_ADS_*` SONT en local »). Elle parlait de `D:\projets\scrapProsp\.env.local`, sur la
> machine précédente. Elle est fausse ici.

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

**Tout montant en micros doit être un multiple de 10 000** (EUR), sinon l'API répond
`keyword_plan_idea_error: UNKNOWN`, qui est une erreur de validation déguisée.

**Tout plafond de dépense doit être daté.** Google reprévoit en continu : le même plafond
mesuré à la même enchère a bougé de +5 % en un jour (291,81 € le 04/08, 306 € le 05/08).

**Certaines écritures sensibles déclenchent « Confirmez votre identité »** dans l'interface
Google Ads — une ré-authentification que seul toi peux passer. C'est ce qui avait arrêté la
saisie du budget de campagne Totowood le 31/08.
