# Audits NMF

Archive des audits réalisés sous la marque **NMF**. Un dossier par client, contenant
le livrable final (PDF), les rapports HTML source, les données collectées, les
captures d'écran et les scripts de génération.

## Clients

| Client | Période | Livrable principal |
|---|---|---|
| [Totowood](#totowood) | juillet 2026 | `totowood/output/pdf/Audit-Totowood-NMF-2026-Client.pdf` |
| [RH Patrimoine](#rh-patrimoine) | juillet 2026 | `rh-patrimoine/codex audit/output/pdf/audit-rh-patrimoine-nmf.pdf` |
| [La Rencontre](#la-rencontre) | août 2026 | `la-rencontre/output/pdf/Audit-La-Rencontre-NMF-2026.pdf` |

---

## Totowood

Audit complet avec déclinaisons par zone géographique et par audience.

**PDF livrés** (`totowood/output/pdf/`)

- `Audit-Totowood-NMF-2026-Client.pdf` — version client, la plus récente
- `Audit-Totowood-NMF-2026-Interne.pdf` — version interne
- `Audit-Totowood-NMF-2026-Ile-de-France.pdf` — déclinaison Île-de-France
- `Audit-Totowood-NMF-2026-Seine-et-Marne.pdf` — déclinaison Seine-et-Marne
- `Audit-Totowood-NMF-2026-Budget-2000.pdf` — scénario budget 2 000 €
- `Recap-Totowood-NMF-2026.pdf` — récapitulatif
- les versions `final`, `final-v2`, `v3`, `AC`, `draft`… sont les itérations
  successives, conservées pour l'historique

**Sources**

- `report/` — rapports HTML (`audit-totowood-2026-client.html`, version interne, récap)
- `data/` — données collectées
- `assets/` — visuels et captures
- `design-previews/` — maquettes de mise en page
- `build_ads_data.mjs`, `build_keyword_annex_data.mjs`, `fetch_keyword_stats.mjs` —
  collecte et préparation des données Google Ads / mots-clés
- `make_audit_pdf.py` — génération du PDF
- `verify_audit.mjs`, `verify_client_audit.mjs` — vérification du rendu
- `PRODUCT.md`, `DESIGN.md` — notes produit et parti pris graphique
- `report/mots-cles-totowood-google-ads.txt` — liste de mots-clés Google Ads

## RH Patrimoine

Deux passes d'audit menées en parallèle, conservées séparément.

**PDF livrés**

- `rh-patrimoine/codex audit/output/pdf/audit-rh-patrimoine-nmf.pdf` — version finale
- `audit-rh-patrimoine-nmf-proof.pdf` — version relecture
- `audit-rh-patrimoine-nmf-grand.pdf` / `-lisible.pdf` — variantes de mise en page
- `rh-patrimoine/claude audit/RH-Patrimoine-Audit-NMF.pdf` — première passe

**Sources**

- `codex audit/assets/rhpatrimoine/` — visuels du site et captures
  (`screens/` : hero, formulaire de contact, bandeau cookies, vue mobile)
- `codex audit/generate-audit-html.mjs`, `generate_audit_pdf.py`,
  `generate_audit_pdf_v2.py`, `render_pdf.py` — chaîne de génération
- `codex audit/google_ads_real_estimate.mts` — estimation Google Ads
- `claude audit/build-rh.mjs`, `charts.json` — première passe et ses graphiques

## La Rencontre

Audit accompagné d'une proposition de campagne test.

**PDF livrés** (`la-rencontre/output/pdf/`)

- `Audit-La-Rencontre-NMF-2026.pdf` — audit
- `Proposition-La-Rencontre-Campagne-Test.pdf` — proposition de campagne test

**Sources**

- `report/` — `audit-la-rencontre-2026.html`, `proposition-campagne-test.html`
- `data/` — données collectées, dont les rapports Lighthouse desktop et mobile
- `shots/` — captures d'écran du site
- `assets/` — visuels
- `capture.mjs` — capture automatisée des écrans
- `report/build-report.mjs`, `render-pdf.mjs`, `render-proposition.mjs`,
  `contact-sheet.mjs` — génération du rapport et des PDF

---

## Régénérer un rapport

Les dossiers `totowood/` et `la-rencontre/` sont des projets Node. Les dépendances
sont versionnées dans le dépôt, donc les scripts sont exécutables directement :

```bash
cd la-rencontre
node capture.mjs            # recapture les écrans
node report/build-report.mjs # reconstruit le rapport HTML
node report/render-pdf.mjs   # réexporte le PDF
```

Si les `node_modules` sont supprimés un jour, un `npm install` dans le dossier
concerné les restaure (`package.json` et `package-lock.json` sont présents).

## Note sur le contenu versionné

Le dépôt contient l'intégralité des dossiers de travail, y compris :

- `node_modules/` — dépendances Node des scripts de capture et de génération
- `totowood/tmp/` — profils Chrome jetables créés par Puppeteer lors des exports
  PDF (vérifiés : profils vierges, aucun cookie ni identifiant personnel)

Ces deux ensembles représentent l'essentiel du poids du dépôt et ne font pas
partie des livrables. Ils peuvent être retirés de l'historique si le dépôt devient
trop lourd à cloner.
