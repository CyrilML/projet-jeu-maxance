# Demande n° 132 : rapprocher les tranchées de 1916

> Statut : ✅ livrée (tanks version 77).
> ✍️ = ce que Maxance a décidé.

## 🎯 Quoi
✍️ « Dans la Première Guerre mondiale, les tranchées sont trop éloignées. Rapprochez-les énormément. »

## ⚙️ Comment — choix de Claude (« énormément » n'avait pas de nombre)
- Les deux tranchées de tir passent de 320 m à **124 m** l'une de l'autre (`feu` : 160 → 62 dans
  `tanks/editions/premiere-guerre.js`). La tranchée de soutien suit (212 → 108). Les boyaux vont toujours jusqu'au camp.
- Tout le no man's land est resserré avec elles : barbelés 10 à 15 m devant la tranchée (avant 24 à 30), cratères sur
  46 m (avant 138), barrage d'artillerie sur 50 m (avant 135), 220 cratères (avant 380, sinon trop serrés).
- Le village en ruines est plus petit (rayon 30 m, 12 maisons) pour tenir entre les deux lignes ; la ferme de Vaulx est
  au milieu du no man's land.
- Les granges et les haies ne sont plus jamais posées sur une tranchée (`logique/terrain.js`, `surUneTranchee`).

## ✅ Critères
- [ ] Édition 1916 → bataille : depuis la banquette, on voit les barbelés tout près et la tranchée ennemie en face.
- [ ] Aucune maison, grange ou haie dans une tranchée.
- [ ] Les vagues d'assaut et le barrage marchent toujours ; aucune erreur.
- [ ] Les autres éditions ne changent pas.
