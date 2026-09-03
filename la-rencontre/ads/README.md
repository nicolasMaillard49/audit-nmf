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

## La chaîne de conversion — test de bout en bout du 03/09/2026

**Tout est câblé. Il manque une seule chose : qu'une vraie conversion arrive.**

| # | Maillon | État |
|---|---|---|
| 1 | Événement `generate_lead` au succès du formulaire de réservation | ✅ posé le 01/09 (`apps/frontend/utils/analytics.ts` du dépôt du site) |
| 2 | Déployé en production | ✅ `generate_lead` est dans le bundle servi par `restaurantlarencontre.com/reservation`, balise GA4 `G-WP4T76RWV4` active |
| 3 | L'événement part avec les bons paramètres | ✅ vérifié au navigateur — voir le relevé ci-dessous |
| 4 | `generate_lead` marqué **événement clé** dans GA4 | ✅ étoilé dans Admin › Événements (avec `form_submit`) |
| 5 | Importé comme conversion dans le compte Ads `404-054-1764` | ✅ action **`restaurant la rencontre (web) generate_lead`**, source GA4, **Principale**, incluse dans les objectifs du compte, fenêtre 90 jours |
| 6 | Une conversion réellement enregistrée | ❌ **l'action est « En attente de conversions » — zéro à ce jour** |
| 7 | Campagne `24197703801` dé-pausée | ❌ — le dernier geste, une fois le 6 vert |

Le compte porte trois actions de conversion : `Lead form - Submit` (formulaire hébergé par
Google, secondaire), `Formulaire` (GA4, secondaire) et
`restaurant la rencontre (web) generate_lead` (GA4, **principale**). Les trois sont « En
attente de conversions ».

### Le test du 03/09 — ce qu'il a prouvé, et ce qui l'a arrêté

Une vraie demande de réservation a été passée en production (2 couverts, jeudi 10/09 à 20 h,
service soir), puis **annulée dans la foulée** par `/reservation/annuler/<cancelToken>`.

L'événement est parti avec **tous ses paramètres justes** :

```
POST region1.analytics.google.com/g/collect
  tid=G-WP4T76RWV4
  en=generate_lead
  ep.method=reservation_en_ligne
  ep.transaction_id=cmtlba0vp00guasd9otqspbr2   ← le cancelToken, pour dedoublonner
  epn.party_size=2
  ep.service_date=2026-09-10T20:00:00
  ep.service=Service Soir
```

**Mais la requête a répondu HTTP 503, pas 204** — comme le second appel,
`/measurement/conversion`. GA4 « Temps réel » affiche **0 utilisateur sur 30 minutes** : le hit
n'est jamais arrivé.

> **Ce n'est ni le site ni le réseau : c'est ce profil Chrome.** Un `curl` vers le même
> endpoint depuis la même machine répond **204**. Une extension du navigateur intercepte les
> requêtes vers `region1.analytics.google.com` et renvoie 503 ; dans la même page,
> `www.google.fr/ads/ga-audiences` passe en 200. La propriété reçoit par ailleurs du trafic
> normalement (306 utilisateurs sur 7 jours, 2,4 k événements).

**Pour finir le test** : refaire la même demande depuis un navigateur ou un profil **sans
bloqueur** — un téléphone en 4G fait l'affaire — puis regarder l'action
`restaurant la rencontre (web) generate_lead` passer de « En attente de conversions » à
active dans le compte Ads. Le décalage GA4 → Ads peut prendre quelques heures.

**Deux arbitrages du 01/09, à ne pas ré-ouvrir sans raison.** On compte la **demande**, pas la
table confirmée — c'est ce que le visiteur peut faire depuis une annonce, donc ce sur quoi
Google peut apprendre ; la confirmation arrive plus tard par mail, hors du parcours web, et la
remonter demanderait de capter le `gclid` et de faire un import hors ligne. Et **aucune
`value`** n'est envoyée : le panier moyen n'est pas connu, et Google prendrait un chiffre
inventé au sérieux pour ses enchères.

> **L'écran « Demande reçue » est un `v-else` sur la même URL `/reservation`.** Il n'y a pas de
> page de confirmation distincte : le contournement habituel — définir la conversion sur un
> `page_path` — était impossible. C'est pour ça que l'événement a dû être posé dans le code.

## La copie des annonces — récupérée le 03/09/2026

`larencontre-campagne.mjs` et `larencontre-composants.mjs` lisent un markdown
`docs/ads/annonces-google-ads.md` du projet du site, jamais de ressaisie. Il annonçait
`D:\projets\restaurant-larencontre\`, un lecteur qui n'existe pas ici, et il était absent du
checkout local — **parce que ce checkout avait sept commits de retard sur `origin/main`**.
Un `git pull` l'a ramené. Il est maintenant à
`C:\Users\n.maillard\VueJS\retaurantLaRencontre\docs\ads\annonces-google-ads.md`, et c'est là
que les deux scripts pointent.

Le fichier fait 236 lignes, écrit le 01/09/2026, et rien n'y est inventé : ses sources sont
`../data/site.json` et le site en production. Son compteur de caractères
(`node docs/ads/check-annonces.mjs`, à lancer depuis le dépôt du site) contrôle **80 lignes
dans 10 sections** et passe — Google refuse un titre de 31 caractères sans le dire clairement,
et tronque les composants en silence.

> **Un piège consigné dans cette copie.** Le téléphone à utiliser est le **05 47 74 03 99**,
> celui du site en ligne. Le dump SQL local porte encore `05 56 81 88 88`, périmé : ne jamais
> s'en servir.

## Les credentials ne sont pas là où les scripts les cherchent

Les `GOOGLE_ADS_*` ne sont **pas** dans le `.env.local` de `scrapProsp` sur cette machine
(vérifié le 03/09) — ils sont dans `Credentials.md` du vault Obsidian. Les quatre scripts ne
lisent que le `.env.local` : leur passer les variables autrement, ou leur ajouter le
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
