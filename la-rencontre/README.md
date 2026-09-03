# La Rencontre — audit digital & Google Ads

Restaurant italien, **42 rue Maréchal Joffre, Bordeaux** — [restaurantlarencontre.com](https://restaurantlarencontre.com).
Exploitants : Rosie Maillard & Francesco Vastola. Périmètre de l'étude : **le service du soir**.

Données collectées la nuit du **2 au 3 août 2026**, rapport produit le **3 août 2026**.

## Les deux livrables

| Fichier (`output/pdf/`) | Pages | Contenu |
|---|---:|---|
| `Audit-La-Rencontre-NMF-2026.pdf` | 12 | L'audit — design lock 1.1 validé |
| `Proposition-La-Rencontre-Campagne-Test.pdf` | 2 | La proposition de campagne test |

**Ce que dit l'audit** — 11 750 recherches mensuelles hors marque sur la zone ; le plafond
de dépense réellement utile est démontré aux alentours de **360 €/mois** sur dix paliers de
budget testés, au-delà le budget n'est plus absorbé ; la recommandation est un **test à
150 €/mois**, sans engagement, avec décision chaque fin de mois. Verdict : **go pour un test
encadré**, conditionné à un P0 — l'événement GA4 « réservation confirmée », sans lequel rien
n'est mesurable.

> **La proposition est calée sur un calendrier échu.** Elle articule tout sur « dès la
> mi-août » puis « 1er septembre, pleine vitesse sur le pic ». Cet argument n'existe plus.
> **Redater le document avant tout renvoi.** État de la décision : `../ETAT-ADS.md`.

## Organisation du dossier

```
ads/                      README de traçabilite — les scripts d'extraction ne sont PAS archives
data/                     donnees collectees
  donnees-google-ads-brutes.json    77 mots-cles, geo, historique, matrice 10 budgets
  portefeuille-mots-cles.json       le portefeuille retenu et ses exclusions
  home.html, home-sections.json     collecte du site
  lighthouse-mobile.json            mesure locale (l'API PSI etait en quota 429 les 02-03/08)
  psi-desktop.json, psi-mobile.json
  schedule.json, slots.json, sitemap.xml, site.json
report/
  audit-la-rencontre-2026.html      source du rapport 12 pages
  proposition-campagne-test.html    source du resume d'envoi 2 pages
  assets/audit-design-lock.css      charte NMF verrouillee, version 1.1
  build-report.mjs                  genere le HTML depuis data/
  render-pdf.mjs                    rend le PDF + une capture PNG par page dans output/qa/
  render-proposition.mjs            rend la proposition
  contact-sheet.mjs                 planche-contact de toutes les pages, pour relecture
output/
  pdf/                              les deux livrables
  qa/                               une capture par page + la planche-contact
shots/                    captures desktop et mobile du site
assets/                   visuels du restaurant + logos NMF
tools/capture.mjs         recapture les ecrans du site
```

## Régénérer

Les dépendances sont versionnées dans le dépôt, les scripts tournent directement.
**Tous les chemins sont résolus depuis ce dossier**, pas depuis le répertoire courant.

```bash
cd la-rencontre
node tools/capture.mjs             # recapture les ecrans du site
node report/build-report.mjs       # reconstruit le rapport HTML depuis data/
node report/render-pdf.mjs         # reexporte le PDF + les PNG de QA
node report/render-proposition.mjs # reexporte la proposition
node report/contact-sheet.mjs      # planche-contact pour relecture
```

Si les `node_modules` disparaissent, `npm install` les restaure
(`package.json` et `package-lock.json` sont versionnés).

## Méthode

Cet audit suit le skill Obsidian `audit-digital-google-ads` du vault
(`C:\Users\n.maillard\Obsidian\Cerveau\Skills\audit-digital-google-ads\SKILL.md`), **pas** le
skill `ads` générique : design lock 1.1, structure 9 pages + annexes, matrice multi-budgets,
et `validate_design.py` (exit 0 obligatoire) avant tout rendu PDF.

## Ce qu'il faut savoir avant de rejouer

- **Les scripts d'extraction Google Ads ne sont pas archivés** — voir [`ads/README.md`](ads/README.md).
  C'est le seul dossier client dans ce cas.
- L'API PageSpeed était en **quota 429** les 02–03/08 : la mesure de performance vient d'un
  Lighthouse local lancé via `npx` (84/100 mobile), pas de PSI. Les deux fichiers `psi-*.json`
  sont conservés pour l'historique.
- Le dossier a été produit depuis `D:\la-rencontre`, un chemin qui **n'existe pas** sur la
  machine courante. Les chemins en dur ont été corrigés ; s'il en réapparaît un, c'est de là
  qu'il vient.
