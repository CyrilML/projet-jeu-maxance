# Village · demande n° 39 : toutes les routes pavées après la recherche

> Demandée par Maxance (via Cyril) le 10/10/2026. Statut : ✅ livrée le 10/10/2026 (étape 41 du carnet du village),
> à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Les routes doivent toutes être pavées à partir de l'amélioration : plus de chemin en terre possible. »

## 📏 Les règles (`logique/routes.js` : `sorteDe`)
- Après la recherche 🧱 « Routes pavées », toute nouvelle route est pavée, quel que soit l'outil : le tracé au doigt, les
  2 touchers, et aussi la route proposée jusqu'à la porte d'un nouveau bâtiment (avant, celle-ci restait en terre).
- Les chemins de terre déjà là deviennent pavés au moment de la recherche (comme avant), et au chargement d'une partie.
- Une route pavée coûte 1 🪨 par case : en plaçant un bâtiment, la bulle montre ce prix, et on ne peut pas valider s'il
  n'y a pas assez de pierres pour sa route (« il faut N 🪨 pour la route pavée jusqu'à la porte »).

## ✅ Critères pour valider
- [ ] Après « Routes pavées », un nouveau bâtiment a une route pavée jusqu'à sa porte (plus jamais de terre).
- [ ] Sans assez de pierres pour sa route, la bulle le dit.
- [ ] Version 42 en haut.
