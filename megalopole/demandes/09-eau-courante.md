# Mégalopole · demande n° 9 : des bâtiments sans eau alors qu'il y a assez de stations

> Signalé par Maxance (via Cyril) le 11/10/2026. Statut : ✅ corrigé le 11/10/2026 (étape 9 du carnet de la
> Mégalopole), à valider.

## 🎯 Ce que Maxance a dit (ses mots)
- « Certaines maisons ou industries n'ont pas l'eau courante alors que j'ai suffisamment de stations : je ne comprends pas. »

## 🔎 L'enquête (une ville de test, avec Playwright)
- La ville produisait **480** unités d'eau, et en demandait **601** : 121 bâtiments étaient coupés.
- **Défaut n° 1 :** l'eau allait aux plus proches des stations d'abord, même aux **petites maisons (niveau 1)**, qui
  n'en ont pas besoin (elles ont un puits). Les immeubles plus loin, eux, étaient coupés.
- **Défaut n° 2 :** les bâtiments **grandissaient même quand il ne restait plus assez d'eau** (ou de courant). Ensuite,
  quelqu'un se faisait couper, et l'on ne voyait pas pourquoi.
- **Défaut n° 3 (plus rare) :** un terrain ne regardait que la première route trouvée, même si une autre route, reliée
  aux stations, passait tout près (de l'autre côté d'une rivière, par exemple).

## 📏 Les corrections
- **D'abord ceux qui en ont besoin.** L'eau courante va d'abord aux bâtiments de niveau 2 et plus (et aux grandes
  fermes). Les petites maisons ne reçoivent que ce qui reste, et elles ne s'en plaignent plus.
- **On ne grandit que s'il en reste assez.** Pour monter d'un niveau, il faut qu'il reste assez de courant et d'eau
  pour le niveau suivant. Sinon le bâtiment attend, et le panneau de la case dit : « 💧 plus d'eau (les stations sont
  pleines : construis-en une autre) ».
- **Une nouvelle réclamation 📢** : « ⚡ Les centrales sont pleines » ou « 💧 Les stations d'eau sont pleines » quand il
  ne reste presque plus rien.
- Un terrain prend **la route reliée la plus proche**, à 3 cases au plus.
- **Toucher une case** sans eau (ou sans courant) explique pourquoi :
  - trop loin d'une route ;
  - route reliée à aucune station ;
  - pénurie (les plus loin sont coupés) ;
  - pas besoin, grâce au puits.
- **📊** montre l'eau *nécessaire*, et à part l'eau « en plus » des petites maisons.
- **Sous le capot** : l'eau nécessaire, les petites maisons non servies, et le reste pour grandir.

Résultat sur la ville de test : **0 bâtiment** qui a besoin d'eau n'en a, et la ville continue de grandir.

## ✅ Critères pour valider
- [ ] Plus d'immeuble ni d'usine sans eau tant que 📊 montre ✅ pour l'eau.
- [ ] Touche un bâtiment sans eau : le panneau dit pourquoi.
- [ ] Quand les stations sont pleines, 📢 le dit, et les maisons attendent au lieu de se faire couper.
