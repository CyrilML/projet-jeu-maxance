# Village · demande n° 28 : la tournée du géologue, du maçon et du vétérinaire

> Demandée par Maxance (via Cyril) le 08/10/2026. Statut : ✅ livrée le 08/10/2026 (étape 27 du carnet du village), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Le géologue et le maçon devraient pouvoir se déplacer partout sur la carte, sans forcément rentrer à chaque fois chez
  eux pour faire avancer leur travail. »

## ❓ Les questions posées, et les choix de Maxance
- Les outils du maçon ? → **il part avec 3 outils**, répare 3 bâtiments à la suite, puis rentre en chercher.
- Quand rentrent-ils ? → **quand il n'y a plus rien à faire** (ou plus d'outils pour le maçon).
- Le vétérinaire aussi ? → **oui**.

## 📏 Les règles (dans `village/config.js` : `tournee`)
- Géologue, maçon-couvreur et vétérinaire cherchent leur travail sur **toute la carte**.
- Après un travail, ils cherchent le suivant **depuis l'endroit où ils sont** (le plus proche d'eux), sans rentrer.
- Ils rentrent quand il n'y a plus rien à faire ; le maçon aussi quand il n'a plus d'outils. Il range ses outils en
  rentrant, et les porteurs lui en apportent jusqu'à 3.
- Journal : « 🧭 sans rentrer, il part vers son travail n° … » et « 🏠 fin de la tournée après … travaux ».

## ✅ Critères pour valider
- [ ] Le géologue va explorer loin et enchaîne sans rentrer.
- [ ] Le maçon répare 3 bâtiments à la suite, puis rentre.
- [ ] La fiche du bâtiment dit « 🧭 En tournée : travail n° … ».
- [ ] Ma partie est toujours là (version 28 en haut).
