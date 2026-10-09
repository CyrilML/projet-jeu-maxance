# Village · demande n° 36 : des bâtiments qui ne débordent plus, de grands gisements, un placement plus facile

> Demandée par Maxance (via Cyril) le 09/10/2026. Statut : ✅ livrée le 09/10/2026 (étape 38 du carnet du village),
> à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Certains bâtiments débordent sur la route : ce n'est pas esthétique. »
- « Le géologue trouve des filons sur la route aussi, ce n'est pas joli, et il en trouve énormément. Peut-être qu'il faut
  juste qu'il trouve de nouveaux filons dans les mines existantes, et que la carte contienne de base plusieurs
  emplacements de différents minerais. »
- « Le placement des bâtiments n'est pas très agréable : difficile de les aligner pour faire un village propre. »

## ❓ Les questions posées, et les choix de Maxance
- Les minerais ? → **des gisements visibles dès le début**.
- Une mine épuisée ? → **le géologue la recharge**.
- Le placement ? → **voir toute la place**, **l'aimant à la route**, **la grille et les lignes guides**.

## 📏 Les règles
- Débordement : rien d'un bâtiment (ni de sa cour) n'est dessiné à gauche, à droite ou devant le losange de sa place
  (comme avec des ciseaux) ; les huttes, maisons et puits ne sont plus plus larges que leur case.
- Gisements (`config.js` : `gisements`) : 7 de charbon, 6 de fer, 3 d'or, des taches rondes de paillettes sur un sol
  rocheux, visibles dès le début (et sur la mini-carte). Le premier charbon est à 12-26 cases du village, le premier fer
  à 18-34, le premier or à 28-48 ; les autres plus loin ; jamais deux gisements à moins de 22 cases. Plus de paillettes
  dessinées sur une route.
- Le géologue (`config.js` : `recharge`) fait le tour des mines épuisées : en 20 s, il trouve une nouvelle veine sous la
  mine (+60 morceaux, +120 avec « Prospection »). Les recherches « Carte des veines » et « Sondes profondes » le rendent
  30 % plus rapide (elles remplacent « Filons de fer » et « Filons d'or »).
- Placement (`config.js` : `placement`) : le doigt tient le bâtiment par son milieu ; on voit le grand losange de toute sa
  place ; à 2 cases au plus d'une route, il se colle tout le long d'elle (la porte vers la route d'abord) : contour jaune
  et « 🧲 collé à la route » ; une grille légère sur 9 cases ; des lignes bleues pointillées quand un de ses côtés est dans
  le prolongement de celui d'un voisin (« 📏 aligné »).
- Sauvegarde : version 21. Une partie plus ancienne garde ses mines : celles qui n'ont plus de filon reçoivent une veine.

## ✅ Critères pour valider
- [ ] Aucun bâtiment ne déborde sur la route.
- [ ] Des gisements noirs, roux et dorés sont visibles dès le début (aussi sur la mini-carte).
- [ ] Une mine épuisée est rechargée par le géologue (« Mine de charbon repart »).
- [ ] En plaçant un bâtiment près d'une route, il se colle à elle ; les lignes bleues montrent les alignements.
- [ ] Version 39 en haut ; ma partie est toujours là.
