# RH Patrimoine — audit digital & potentiel Google Ads

Agence immobilière, **Talence / Bordeaux Métropole** — [rhpatrimoine.com](https://www.rhpatrimoine.com/).
Audit prospect livré en **juillet 2026**.

**Particularité de ce dossier : le prospect avait déjà un compte Google Ads actif.**
`ads/google_ads_real_estimate.mts` ne se contente pas d'une prévision — il lit le **rapport
réel** de la campagne existante (`customerId 4838999588`, `campaignId 23955483287`,
impressions / clics / CTR mesurés) et le confronte à la découverte de mots-clés sur Bordeaux
(8 graines + l'URL du site, top 40 des idées à intention transactionnelle). C'est le seul
dossier du dépôt qui s'appuie sur des dépenses réellement constatées et non sur une
simulation.

## Les livrables

Tous dans `output/pdf/`.

| Fichier | Rôle |
|---|---|
| `audit-rh-patrimoine-nmf.pdf` | **la version finale** |
| `audit-rh-patrimoine-nmf-proof.pdf` | version de relecture |
| `audit-rh-patrimoine-nmf-grand.pdf` | variante de mise en page |
| `audit-rh-patrimoine-nmf-lisible.pdf` | variante de mise en page |
| `audit-rh-patrimoine-nmf.html` | source HTML, **générée** — ne pas éditer à la main |

## Organisation du dossier

```
ads/google_ads_real_estimate.mts   decouverte Bordeaux + rapport reel de la campagne du client
tools/
  generate-audit-html.mjs          genere output/pdf/audit-rh-patrimoine-nmf.html
  generate_audit_pdf.py            premiere chaine de rendu PDF
  generate_audit_pdf_v2.py         chaine retenue : prepare tmp/pdfs/assets-v2 puis rend
  render_pdf.py                    rend un PDF page par page en PNG, pour relecture
assets/rhpatrimoine/               visuels du site
  screens/                         hero, formulaire de contact, banniere cookies, vue mobile
shots/                             captures d'accueil (desktop, mobile, pleine page)
output/pdf/                        les livrables et la source HTML generee
tmp/                               intermediaires de rendu (assets-v2, pages PNG)
legacy/passe-claude/               la premiere passe, conservee telle quelle
  RH-Patrimoine-Audit-NMF.pdf      son PDF
  build-rh.mjs, charts.json        son generateur et ses graphiques
```

> **Deux passes ont été menées en parallèle sur ce client.** La passe retenue occupe
> désormais la racine du dossier ; la première est conservée sous `legacy/passe-claude/`,
> autonome et rejouable telle quelle (`node legacy/passe-claude/build-rh.mjs`).

## Régénérer

**À lancer depuis ce dossier** — `generate_audit_pdf.py` et `render_pdf.py` résolvent
`output/` et `tmp/` par rapport au répertoire courant.

```bash
cd rh-patrimoine
node tools/generate-audit-html.mjs      # regenere le HTML
python tools/generate_audit_pdf_v2.py   # rend le PDF (chaine retenue)
python tools/render_pdf.py              # eclate le PDF en PNG dans tmp/pdfs/ pour relecture
```

### Refaire l'estimation Google Ads

```bash
node --import tsx rh-patrimoine/ads/google_ads_real_estimate.mts
```

Le script importe `app/lib/googleAds/{client,keywordIdeas,report}.ts` depuis le checkout
`C:/Users/n.maillard/VueJS/scrapProsp` et charge son `.env.local`.

> **Les `GOOGLE_ADS_*` ne sont pas dans ce `.env.local`** — ils sont dans `Credentials.md`
> du vault Obsidian. Ce script ne lit **que** le `.env.local` : il faut lui ajouter le
> chargement du vault, comme le font les scripts `../gpelec/ads/audit-gp-elec-v3-*.mjs`,
> avant de le relancer.

## À savoir

Les chemins `file:///D:/projets/...` qui figuraient dans le HTML généré et dans le script
pointaient vers une machine qui n'existe plus. Ils ont été corrigés le 03/09/2026, et
`tools/generate-audit-html.mjs` résout désormais sa racine **depuis sa propre position** au
lieu du répertoire courant — le HTML régénéré porte donc automatiquement le bon chemin.
