# Village · demande n° 42 : des ateliers qui stockent plus, des porteurs qui portent plus

> Demandée par Maxance (via Cyril) le 10/10/2026. Statut : ✅ livrée le 10/10/2026 (étape 44 du carnet du village),
> à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Il faudrait que les ateliers puissent stocker plus de ressources pour fabriquer, et stocker plus de produits fabriqués. »
- « Le porteur doit aussi en porter plus, surtout au fil des améliorations. »

## ❓ Les questions posées, et les choix de Maxance
- La réserve d'un atelier ? → **6 de chaque ingrédient, puis + 3 par amélioration ⭐** (jusqu'à 12).
- Devant la porte ? → **16 produits, puis + 8 par amélioration ⭐** (jusqu'à 32).
- Les porteurs ? → **4 au départ, et plus à chaque recherche** : × 1,5 « Brouettes », × 2 « Ânes et charrettes »,
  × 1,5 l'écurie de l'entrepôt : 4 → 6 → 12 → 18 objets par voyage.

## 📏 Les règles (`config.js` : `entreeMax`, `entreeParAmelioration`, `sortieMax`, `sortieParAmelioration`, `porteurs.charge`)
- Le panneau d'un atelier montre « 📦 En réserve : 🪵 5 / 6 » et « Devant la porte : 2 / 16 » ; la prochaine amélioration
  dit ce qu'elle ajoute (+3 de réserve, +8 places devant la porte).
- La pile dessinée devant la porte montre 12 objets au plus (le chiffre exact est dans le panneau).
- Sous le capot : « 🫏 objets par voyage ».

## ✅ Critères pour valider
- [ ] Une scierie garde jusqu'à 6 troncs (12 avec ses 2 améliorations).
- [ ] 16 planches peuvent attendre devant sa porte (32 avec ses 2 améliorations).
- [ ] Un porteur emporte 4 objets, puis 6, 12, 18 avec les recherches et l'écurie.
- [ ] Version 45 en haut.
