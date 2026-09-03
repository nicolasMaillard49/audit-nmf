# Audits NMF

Archive des audits réalisés sous la marque **NMF**. Un dossier par client, contenant le
livrable final (PDF), les rapports HTML source, les données collectées, les captures d'écran
et les scripts de génération.

> **Où en est chaque client côté Google Ads : [`ETAT-ADS.md`](ETAT-ADS.md).**
> C'est le point d'entrée pour reprendre un dossier — décisions arrêtées, blocages, prochaine
> action, et les limites d'API à ne pas réapprendre.

## Clients

| Client | Période | Livrable principal | Détail |
|---|---|---|---|
| [Totowood](totowood/) | juillet 2026 | `totowood/output/pdf/Audit-Totowood-NMF-2026-Client.pdf` | [README](totowood/README.md) |
| [RH Patrimoine](rh-patrimoine/) | juillet 2026 | `rh-patrimoine/output/pdf/audit-rh-patrimoine-nmf.pdf` | [README](rh-patrimoine/README.md) |
| [La Rencontre](la-rencontre/) | août 2026 | `la-rencontre/output/pdf/Audit-La-Rencontre-NMF-2026.pdf` | [README](la-rencontre/README.md) |
| [GP elec](gpelec/) | août–septembre 2026 | `gpelec/output/pdf/` — trois versions | [README](gpelec/README.md) |

## Arborescence commune

Les quatre dossiers suivent la même structure. Un dossier absent signifie simplement que le
dossier client n'en a pas eu besoin.

| Dossier | Contenu |
|---|---|
| `ads/` | tout ce qui touche à l'API Google Ads : extraction, prévisions, normalisation |
| `data/` | les données collectées — réponses d'API brutes, mesures du site, portefeuille |
| `report/` | les sources HTML des rapports, la charte verrouillée et les scripts de rendu |
| `output/pdf/` | les livrables |
| `output/qa/` | une capture par page, pour relire le rendu |
| `shots/` | les captures d'écran du site du client |
| `assets/` | visuels du client et logos NMF |
| `tools/` | collecte du site, captures, vérificateurs, chaînes de rendu |
| `legacy/` | les passes antérieures, conservées telles quelles |
| `tmp/` | intermédiaires de rendu |

**Deux règles de chemin**, appliquées le 03/09/2026 :

1. Les scripts sous `ads/` et `tools/` résolvent leurs chemins **depuis la racine du dossier
   client**, pas depuis le répertoire courant. Ils tournent donc d'où qu'on les lance.
2. **Aucun chemin en dur `D:\`** ne subsiste. Ces dossiers ont été produits sur une machine
   où le travail vivait sous `D:\projets\` ; ce lecteur n'existe pas ici. Les chemins pointent
   désormais vers `C:\Users\n.maillard\audit-nmf\` et, pour le checkout d'API,
   `C:\Users\n.maillard\VueJS\scrapProsp`.

## Régénérer un rapport

Chaque dossier client porte sa section « Régénérer ». Le principe est partout le même :

```bash
cd <client>
node ads/…          # refaire ou renormaliser les donnees Google Ads
node report/…       # reconstruire le HTML puis rendre les PDF
node tools/…        # verifier le rendu
```

Les dépendances Node sont versionnées pour `la-rencontre/`. Pour `gpelec/`, les
`node_modules` sont exclus du dépôt (Lighthouse pèse à lui seul ~123 Mo) : un `npm install`
les restaure, `package-lock.json` étant versionné. `totowood/` et `rh-patrimoine/` n'utilisent
que la bibliothèque standard de Node, plus Pillow et WeasyPrint côté Python.

## Credentials

Les `GOOGLE_ADS_*` ne sont **dans aucun fichier de ce dépôt**, ni dans le `.env.local` du
checkout `scrapProsp`. Ils vivent dans `Credentials.md` du vault Obsidian
(`C:\Users\n.maillard\Obsidian\Cerveau`). Les scripts de la passe du 02/09 chargent les deux
sources et journalisent au démarrage combien de variables viennent du vault ; les scripts plus
anciens ne lisent que le `.env.local` et doivent être complétés avant relance — le détail est
dans le README de chaque dossier.

## Méthode

Les audits NMF suivent le skill Obsidian `audit-digital-google-ads` du vault
(`Skills/audit-digital-google-ads/SKILL.md` + `references/design.md`,
`assets/audit-design-lock.css`, `scripts/validate_design.py`), **pas** le skill `ads`
générique : design lock 1.1, structure 9 pages + annexes, matrice multi-budgets, et
`validate_design.py` en exit 0 obligatoire avant tout rendu PDF.

## Note sur le contenu versionné

Le dépôt contient l'intégralité des dossiers de travail, y compris :

- `la-rencontre/node_modules/` — dépendances Node de ses scripts de capture et de rendu,
  versionnées pour que le dossier tourne sans `npm install` ;
- `totowood/tmp/` — profils Chrome jetables créés par Puppeteer lors des exports PDF
  (vérifiés : profils vierges, aucun cookie ni identifiant personnel) **et** les forecasts
  bruts `forecast-totowood-*.json`, dont `totowood/ads/build_ads_data.mjs` dépend.

Ces ensembles représentent l'essentiel du poids du dépôt (`.git` ≈ 324 Mo) et ne font pas
partie des livrables. Ils sont conservés volontairement. S'ils devaient être retirés un jour,
`totowood/tmp/forecast-*.json` doit être préservé — ce ne sont pas des fichiers jetables.
