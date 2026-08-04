# Scripts d'extraction Google Ads — copie d'archive

Ces trois scripts ne sont **pas exécutables depuis ce dossier** : ils importent
`google-ads-api` et `app/lib/googleAds/` et lisent les credentials dans `.env.local`,
tous situés dans `D:\projets\scrapProsp`. Ils y vivent sous `scripts/` et écrivent
directement dans `gpelec/data/`. La copie ici sert à documenter exactement ce qui a
produit les données du 4 août 2026.

| Script | Rôle |
|---|---|
| `audit-gp-elec-v2.mjs` | 7 phases : geo, découverte par graines, découverte par URL, historique du portefeuille, historique des candidats, matrice 3 × 10, capacité par famille |
| `audit-gp-elec-portefeuille-v2.mjs` | Applique la découverte au portefeuille, avec la règle de non-gonflement |
| `audit-gp-elec-marche.mjs` | Consolide `marche-google-ads.json`, évalue les trois conditions du plafond par stratégie |

Ordre d'exécution et limites d'API : voir `../README.md`.
