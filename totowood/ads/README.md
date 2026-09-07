# Google Ads — Totowood

Deux familles de scripts, deux moments.

## 1. La chaîne de l'audit — juillet 2026, exécutable depuis ce dossier

| Script | Rôle |
|---|---|
| `fetch_keyword_stats.mjs` | appelle l'API Google Ads (via `app/lib/googleAds/` du checkout `scrapProsp`) et écrit `../data/google-ads-seine-et-marne-keyword-stats.json` |
| `build_ads_data.mjs` | normalise `../tmp/forecast-*.json` vers `../data/google-ads-seine-et-marne-expanded.json` |
| `build_keyword_annex_data.mjs` | prépare `../report/keyword-annex-data.js` — l'annexe des 90 mots-clés |

Les deux derniers tournent hors ligne, depuis `totowood/` :

```bash
cd totowood
node ads/build_ads_data.mjs
node ads/build_keyword_annex_data.mjs
```

## 2. Les scripts de campagne — août-septembre 2026, copies d'archive

**Pas exécutables depuis ce dossier** : ils importent `google-ads-api` et vivent sous
`scripts/` du checkout `scrapProsp` (`C:\Users\n.maillard\VueJS\scrapProsp`), où ils sont
versionnés. La copie ici documente ce qui a monté la campagne.

| Script | Rôle |
|---|---|
| `totowood-adgroups.mjs` | crée les groupes d'annonces restants, depuis la source de vérité — le markdown de copie `totowood-lp/docs/annonces-google-ads.md`, jamais de ressaisie |
| `totowood-extensions.mjs` | pose les composants (ex-« extensions ») **au niveau campagne** : ils servent les quatre groupes d'un coup |
| `totowood-brouillon.mjs` | garde-fou de suppression du brouillon résiduel « Campaign #1 » laissé par l'assistant de création de compte |
| `composants-image.mjs` | **pose les composants Image** depuis `../data/composants-image.json` (9 photos des landing pages, recadrées carré et paysage). **Refusé par Google le 07/09/2026** : `The given field type is not supported to be added directly through asset links (AD_IMAGE)`, au niveau groupe comme au niveau campagne — alors que le même lien est passé sur La Rencontre le même jour. Refusé aussi au niveau compte (`customer_asset`). **Le compte n'est pas éligible aux images**, et ce n'est pas l'API : dans l'interface, le menu « + » de la page Composants liste quinze types et **pas « Image »** (capture `../shots/2026-09-07-composants-menu-sans-image.png`), et aucune recommandation « Ajouter des images » n'existe chez Totowood quand La Rencontre en a deux. Les quatre annonces sont `APPROVED` sans sujet de règles : ce n'est pas un problème de conformité. Reste la validation de l'annonceur (question ouverte) ou l'ancienneté du compte — La Rencontre, plus jeune, est pourtant éligible, donc l'ancienneté seule n'explique pas. Les recadrages sont prêts dans `../output/composants-image/`, le dossier de l'échec dans `../data/composants-image-2026-09-07.json`. **Retenter** après la validation de l'annonceur, puis chaque semaine : `node --import tsx scripts/composants-image.mjs --manifest C:/Users/n.maillard/audit-nmf/totowood/data/composants-image.json --go` depuis `scrapProsp` — idempotent, il ne fait rien de plus que réessayer |

## Le compte et la campagne

| | |
|---|---|
| Client | Totowood — S.A.S., SIREN 934 186 412, siège 18 rue de la Tuilerie, 93370 Montfermeil |
| Compte Google Ads | `370-246-3294`, sous le MCC `671-181-3801` |
| Facturation | **c'est Totowood qui paie** — profil Organisation, carte du client, seuil à 10 € |
| Campagne | `Recherche - Sur-mesure 77` — `campaignId 24204097327` |
| Budget | **16,45 €/jour** |
| Enchères | Maximiser les clics, plafond CPC 3,04 € |
| Groupes | 4 — Sous-pente & sous-escalier, Dressing, Bibliothèque & meubles, Cuisine |
| Exclusions | **42** au niveau du compte (14 au départ, 28 ajoutées le 01/09) |
| État | **DIFFUSE depuis le 31/08/2026 au soir** |

**Les landing pages ne sont pas sur le site du client.** Le trafic va sur `devis.totowood.fr`,
quatre pages que l'agence possède de bout en bout (`C:\Users\n.maillard\VueJS\totowood-lp`,
repo `nicolasMaillard49/totowood-lp`) — une page par groupe d'annonces. La conversion remonte
**hors ligne via le `gclid`**, en server-to-server, donc aucun tag publicitaire chez le client.

```
Demande de devis   customers/3702463294/conversionActions/7741078076   principale, sans valeur
Devis signé        customers/3702463294/conversionActions/7741078079   secondaire, valeur réelle
```

> **Ne pas les intervertir.** Envoyer une demande sur l'action « Devis signé » ne produit
> aucune erreur : Google enregistre une signature qui n'a pas eu lieu, et la donnée ne se
> retire pas.

## L'état d'avancement vit ailleurs

Le suivi étape par étape — **63 sur 72** au 01/09/2026, avec la preuve datée de chaque verdict —
est dans `totowood-lp/docs/avancement.json`, servi par `npm run docs`. Ce dépôt-ci porte
l'audit ; le dispositif de campagne se pilote depuis `totowood-lp`.

Le relevé du premier jour de diffusion et ce qui reste à faire sont résumés dans
`../../ETAT-ADS.md`.
