# Passe du 31 juillet 2026 — archive

Chaîne de génération abandonnée : `generateur-rapport.py` produisait un HTML
autonome (images en base64, ~1,2 Mo) directement depuis les JSON de données.
Elle a été remplacée le 4 août par `report/*.html` + `report/render-all.mjs`,
qui ajoute le contrôle de débordement, la concordance entre variantes et
l'étanchéité des versions client.

Les chiffres de ces PDF sont ceux du 31/07 et **ne sont plus à jour** :
2 420 recherches/mois, CPC tenu 1,63 €, plafond 754,34 € / 187 clics.
Conservés pour l'historique, à ne pas envoyer.

Les données brutes correspondantes sont dans
`../data/donnees-google-ads-brutes-2026-07-31.json`.
