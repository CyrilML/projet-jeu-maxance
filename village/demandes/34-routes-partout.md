# Village · demande n° 34 : une route doit toujours pouvoir passer

> Demandée par Maxance (via Cyril) le 09/10/2026. Statut : ✅ livrée le 09/10/2026 (étape 36 du carnet du village),
> à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Il y a beaucoup d'endroits où les routes ne peuvent pas passer, car soit il y a des rochers, soit des arbres ou
  autres. C'est très, très embêtant. Évite ce genre de problème afin qu'il y ait toujours une route qui puisse passer. »

## ❓ Les questions posées, et les choix de Maxance
- Un arbre, un rocher ou une jeune pousse sur le passage ? → **dégagé, et ce qu'il donne va à l'entrepôt**.
- Et l'eau ? → **des ponts partout** (même sur l'eau profonde), 2 planches par case.

## 📏 Les règles (dans `village/config.js` : `routes`)
- La route dégage son passage au moment où on la construit : 🪓 un arbre → +1 tronc ; ⛏️ un rocher → ses pierres
  (8 au plus) ; une jeune pousse est arrachée. Tout est rangé à l'entrepôt tout de suite.
- 🌉 Sur l'eau, la route devient un pont (planches, pieux et garde-corps) : 2 planches par nouvelle case. Démolir un
  pont rend ses planches. Les ouvriers et les villageois peuvent traverser un pont à pied.
- En 2 touchers, ou pour la route proposée d'un nouveau bâtiment, le jeu essaie d'abord de contourner les obstacles ;
  si le détour fait plus de 2 fois le trajet tout droit (ou s'il n'y en a pas), la route passe tout droit.
- Seuls les bâtiments, la tente et le feu de camp du chef bloquent encore une route.
- L'aperçu du tracé montre le prix, les ponts 🌉, les arbres 🪓 et les rochers ⛏️ qui seront dégagés.

## ✅ Critères pour valider
- [ ] Une route tracée à travers une forêt passe : les arbres disparaissent, des troncs arrivent à l'entrepôt.
- [ ] Une route sur une rivière fait un pont, et coûte 2 planches par case.
- [ ] Un bâtiment de l'autre côté de la rivière est relié (les porteurs passent sur le pont).
- [ ] Le journal (sous le capot) dit « 🚜 La route a dégagé son passage » ; version 37 en haut.
