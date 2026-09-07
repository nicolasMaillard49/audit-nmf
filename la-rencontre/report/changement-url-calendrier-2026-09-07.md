# La Rencontre — l'accueil comme page d'atterrissage, et plus de diffusion dimanche ni lundi

**7 septembre 2026.** Campagne `Recherche - La Rencontre Soir` `24197703801`, compte
`404-054-1764`. Décision de Nicolas le 07/09, appliquée le jour même par
`ads/larencontre-url-calendrier.mjs` (versionné dans `scrapProsp`, commit `28cc1ca`).
Données avant/après : [`../data/changement-url-calendrier-2026-09-07.json`](../data/changement-url-calendrier-2026-09-07.json).

Point de départ : la question « pourquoi il n'y a pas d'image sur les annonces ? ». Réponse
courte : personne n'en a jamais posé — ni `larencontre-campagne.mjs` ni
`larencontre-composants.mjs` ne créent de composant Image. En creusant, la page
d'atterrissage s'est révélée être le vrai sujet.

---

## Ce qui a été changé dans Google Ads

| | Avant | Après |
|---|---|---|
| URL finale des 3 annonces | `restaurantlarencontre.com/reservation` | `restaurantlarencontre.com/` |
| Calendrier | 7 jours, 17 h–22 h | **mardi → samedi**, 17 h–22 h |
| Budget | 4,93 €/jour | 4,93 €/jour — **inchangé** |
| Statut | ENABLED | ENABLED |

Cinq opérations, tout ou rien, relues après écriture : URLs ✓, dimanche/lundi retirés ✓, budget
intact ✓, statut intact ✓. Les trois annonces sont repassées de `APPROVED` à `UNKNOWN` : Google
ré-examine la page de destination après un changement d'URL. **À vérifier au relevé J+7 : les
trois doivent être revenues `APPROVED`.**

## Pourquoi l'accueil et pas le formulaire

Aucune justification du choix de `/reservation` n'était écrite, ni dans ce dossier ni dans
`docs/ads/annonces-google-ads.md`. La logique implicite était celle du tracking : l'événement
`generate_lead` part au succès du formulaire, donc on envoyait le clic au plus près du
formulaire. C'est un raisonnement de mesure, pas de vente.

Ce qu'un clic payant voyait sur `/reservation` :

- un formulaire nu — couverts, date, créneau. Aucune photo, aucun avis, aucune promesse. Rien
  ne dit « italien » ni « gastronomique ». Le relevé J+1 attribue précisément à cette page le
  Quality Score à 1–3 et les 26 % d'impressions perdues au classement ;
- un lundi soir, « Pas de créneaux disponibles à cette date » : la date par défaut était
  aujourd'hui, et le restaurant est fermé le lundi ;
- quelqu'un qui a tapé « restaurant italien bordeaux » n'a pas encore choisi La Rencontre.
  Cette page suppose qu'il a déjà décidé.

Ce que l'accueil a pour lui : la devanture plein écran, « Plus de 150 avis », la promesse
franco-italienne, les boutons Menu et Réserver visibles tout de suite, un bouton Réserver
collant en bas d'écran, les photos de plats juste en dessous. **Le tracking ne casse pas** :
Réserver mène à `/reservation`, où `generate_lead` part comme avant. Ça ajoute un tap, pas une
perte de mesure.

Ce que l'accueil a contre lui, et qui a été corrigé côté site le même jour (voir plus bas) :
un écran d'intro animé de 3,3 s avant tout contenu.

L'accueil reste générique — « Bienvenue à La Rencontre » ne répond pas plus à « italien » qu'à
« gastronomique ». **Une page par intention reste le chantier de fond du relevé J+1. Il est
explicitement laissé de côté pour l'instant** (arbitrage du 07/09).

Pas de test A/B accueil contre formulaire dans Google Ads : à six clics par jour, aucun test ne
conclura. C'est une décision, pas une mesure.

## Pourquoi couper dimanche et lundi — et pas le mardi

`larencontre-campagne.mjs` avait gardé les 7 jours en le justifiant : « une table du samedi se
réserve souvent le lundi », à rouvrir avec le rapport Heure de la journée après deux semaines.
L'argument tient pour quelqu'un qui anticipe — mais la fenêtre 17 h–22 h cible l'intention
« ce soir ». Un dimanche ou un lundi à 19 h, « restaurant italien bordeaux » veut manger ce
soir, et le restaurant est fermé.

**Le planning réel est dans `/public/schedule`, pas dans le doc des annonces.** Le doc du 01/09
dit « du mercredi au samedi ». La prod sert :

| Plage | Jours | Horaire | Validité |
|---|---|---|---|
| Service Soir | mer, jeu, ven, sam | 19 h 00 – 21 h 15 | permanent |
| Service Midi | mer, jeu, ven, sam | 12 h 00 – 14 h 00 | permanent |
| Mardi | **mar** | 19 h 00 – 21 h 15 | **21/07/2026 → 31/12/2026** |

Le mardi soir est donc ouvert jusqu'à fin décembre : on le garde. **À rouvrir début janvier**
si la plage du mardi n'est pas prolongée dans l'admin du site.

Le budget quotidien n'a pas été touché, conformément au relevé J+1. Cinq jours actifs sur sept
à 4,93 €/jour : Google peut monter jusqu'au double sur un jour actif pour compenser, et le
plafond mensuel reste 4,93 × 30,4 = 150 €. La dépense réelle se situera entre 105 et 150 €.

## Ce qui a été changé sur le site (dépôt `retaurantLaRencontre`)

1. **L'intro est sautée pour les clics publicitaires.** `SiteSplash.vue` : si l'URL porte
   `gclid`, `gbraid`, `wbraid` ou `gad_source`, l'écran d'intro (2,2 s + 1,1 s de sortie) ne
   s'affiche pas, et le cookie `site_splash_seen` est posé pour qu'il ne revienne pas à la page
   suivante. Un clic à 1 € ne paie plus 3,3 s de logo.
2. **Le formulaire s'ouvre sur le premier jour qui a des tables.** `useReservationFlow.ts`
   gagne `fetchSlotsFromNextOpenDay()` : si la date du jour n'a aucun créneau prenable (jour
   fermé, fermeture exceptionnelle, service passé, tout complet), il avance jusqu'au premier
   jour qui en a, 14 jours au plus. C'est le backend qui dit ce qui est ouvert — le planning
   n'est pas recopié côté front. Un visiteur du lundi voit les tables du mardi soir.

## Ce que le relevé J+7 doit regarder, en plus des trois points déjà prévus

- les trois annonces sont-elles revenues `APPROVED` ;
- le CTR et le QS ont-ils bougé avec l'accueil comme destination — comparer jour de semaine
  à jour de semaine, plus de dimanche ni de lundi dans la série ;
- la dépense hebdomadaire : cinq jours actifs, le mensuel doit rester sous 150 €.

## Les images — la question d'origine, posées le jour même

Google propose bien le composant Image sur ce compte (bouton « + Images » sans message de
blocage, malgré la règle des 60 jours de la doc), et annonce **+6 % de CTR en moyenne** quand
une image s'affiche avec une annonce Recherche. Sur ce compte c'est un levier secondaire mais
peu coûteux : à budget saturé, ce qui compte est le CPC, et un composant qui remonte le CTR
observé remonte le QS.

**Six images posées au niveau campagne le 07/09** par `composants-image.mjs`, depuis le
manifeste `../data/composants-image.json` : tagliatelles à l'encre, raviolo noir, dessert
chocolat-basilic et devanture en carré 1200×1200 ; devanture et les chefs en paysage 1200×628.
Recadrages dans `../output/composants-image/`, dossier avant/après dans
`../data/composants-image-2026-09-07.json`. Elles passent en examen chez Google.

Deux pièges consignés. Sur Recherche, carré et paysage se lient avec le champ `AD_IMAGE` :
`MARKETING_IMAGE` et `SQUARE_MARKETING_IMAGE` sont refusés (« incompatible with campaign type
SEARCH »). Et **ne pas activer les images dynamiques** : Google les piocherait sur la page de
destination.

**Totowood, même jour, même script : refusé.** « field type not supported to be added
directly through asset links », au niveau groupe comme au niveau campagne. Ce compte n'a
aucune recommandation « Ajouter des images » : il n'est pas éligible. Voir
`../../totowood/ads/README.md`.

## Le dossier est à jour

`ETAT-ADS.md` et `ads/README.md` portent ces changements depuis le 07/09/2026 (URL finale,
calendrier, images), commités avec le relevé J+1 du 04/09 qui ne l'avait pas encore été.
